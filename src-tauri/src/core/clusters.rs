use crate::core::settings::{load as load_settings, Settings, SyncMode};
use crate::core::{firewall, hosts};
use crate::error::AppResult;
use crate::native::http;
use serde_json::Value;
use std::path::Path;
use tauri::{AppHandle, Manager};

const GITHUB_URL: &str =
    "https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/main/src/data/servers.json";

const EMBEDDED: &str = include_str!("../../../src/data/servers.json");

/// Источник 1: GitHub
async fn from_github() -> Option<Value> {
    match http::fetch_json(GITHUB_URL).await {
        Ok(data) => {
            log::info!("✅ clusters: loaded from GitHub");
            Some(data)
        }
        Err(e) => {
            log::error!("⚠️ clusters: GitHub failed: {e}");
            None
        }
    }
}

/// Источник 2: %LOCALAPPDATA%/com.aysi.clusterbanned/resources/servers.json
fn from_local(path: &Path) -> Option<Value> {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => {
            log::error!("⚠️ clusters: local read failed ({}): {e}", path.display());
            return None;
        }
    };
    match serde_json::from_str::<Value>(&content) {
        Ok(data) => {
            log::info!("✅ clusters: loaded from local file");
            Some(data)
        }
        Err(e) => {
            log::error!("⚠️ clusters: local parse failed: {e}");
            None
        }
    }
}

/// Источник 3: встроенный JSON (последний рубеж)
fn embedded() -> Value {
    log::info!("⚠️ clusters: using embedded JSON");
    serde_json::from_str(EMBEDDED).unwrap_or_else(|e| {
        log::error!("⛔ clusters: embedded JSON broken: {e}");
        serde_json::json!({})
    })
}

/// Чистая версия: режим и путь приходят снаружи (тесты, особые случаи).
///
/// - `Local`  — только локальный файл
/// - `Hybrid` — GitHub → локальный файл
/// - `Server` — только GitHub
///
/// Если выбранные источники не сработали, возвращается встроенный JSON.
pub async fn load_with(mode: &SyncMode, local_path: &Path) -> Value {
    let loaded = match mode {
        SyncMode::Local => from_local(local_path),
        SyncMode::Server => from_github().await,
        SyncMode::Hybrid => match from_github().await {
            Some(data) => Some(data),
            None => from_local(local_path),
        },
    };

    loaded.unwrap_or_else(embedded)
}

/// Основная точка входа для всего приложения.
/// Сама определяет syncMode из настроек и путь к локальному servers.json.
pub async fn load(app: &AppHandle) -> Value {
    let mode = load_settings().map(|s| s.sync_mode).unwrap_or_else(|e| {
        log::error!("⚠️ clusters: settings load failed: {e}, using default mode");
        SyncMode::default()
    });

    let local_path = match app.path().app_local_data_dir() {
        Ok(dir) => dir.join("resources").join("servers.json"),
        Err(e) => {
            log::error!("⚠️ clusters: app_local_data_dir failed: {e}");
            // Пустой путь: чтение локального файла не удастся,
            // и цепочка дойдёт до GitHub / embedded по режиму
            std::path::PathBuf::new()
        }
    };

    load_with(&mode, &local_path).await
}

/// Извлечь IP-адреса кластера по региону и домену.
/// Возвращает пустой Vec, если регион/домен не найдены.
pub fn extract_ips(data: &Value, region_id: &str, domain: &str) -> Vec<String> {
    let Some(regions) = data.get("regions").and_then(Value::as_array) else {
        return Vec::new();
    };

    for region in regions {
        if region.get("id").and_then(Value::as_str) != Some(region_id) {
            continue;
        }
        let Some(clusters) = region.get("clusters").and_then(Value::as_array) else {
            continue;
        };
        for cluster in clusters {
            let Some(d) = cluster.get("domain").and_then(Value::as_str) else {
                continue;
            };
            if !d.eq_ignore_ascii_case(domain) {
                continue;
            }
            if let Some(ips) = cluster.get("ips").and_then(Value::as_array) {
                return ips
                    .iter()
                    .filter_map(|v| v.as_str().map(str::to_string))
                    .filter(|s| !s.is_empty())
                    .collect();
            }
        }
    }

    Vec::new()
}

/// Все домены, встречающиеся в данных (по всем регионам). Пригодится firewall-очистке.
pub fn all_domains(data: &Value) -> Vec<String> {
    let mut out = Vec::new();
    let Some(regions) = data.get("regions").and_then(Value::as_array) else {
        return out;
    };
    for region in regions {
        let Some(clusters) = region.get("clusters").and_then(Value::as_array) else {
            continue;
        };
        for cluster in clusters {
            if let Some(d) = cluster.get("domain").and_then(Value::as_str) {
                out.push(d.to_string());
            }
        }
    }
    out
}

pub async fn cleanup_blocks(force_firewall: bool) -> AppResult<String> {
    let settings = load_settings().unwrap_or_else(|e| {
        log::error!("cleanup: settings load failed: {e}, using defaults");
        Settings::default()
    });
    let use_backup = settings.use_backup;
    let use_firewall = force_firewall || settings.use_firewall;

    let mut messages = Vec::new();

    // 1. hosts — всегда
    match hosts::apply(hosts::HostsOp::ClearAll, use_backup) {
        Ok(r) => messages.push(r.message),
        Err(e) => messages.push(format!("Hosts cleanup error: {e}")),
    }

    // 2. firewall — только если включён в настройках
    if use_firewall {
        match tauri::async_runtime::spawn_blocking(firewall::clear_all).await {
            Ok(Ok(msg)) => messages.push(msg),
            Ok(Err(e)) => messages.push(format!("Firewall cleanup error: {e}")),
            Err(e) => messages.push(format!("Firewall worker error: {e}")),
        }
    } else {
        messages.push("Firewall cleanup skipped (disabled in settings)".into());
    }

    Ok(messages.join("\n"))
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"{
        "regions": [
            {
                "id": "eu",
                "clusters": [
                    { "domain": "a.example.com", "ips": ["1.2.3.4", "5.6.7.8"] },
                    { "domain": "b.example.com", "ips": [] }
                ]
            },
            {
                "id": "na",
                "clusters": [
                    { "domain": "c.example.com", "ips": ["9.9.9.9"] }
                ]
            }
        ]
    }"#;

    #[test]
    fn extract_ips_finds_by_region_and_domain() {
        let data: Value = serde_json::from_str(SAMPLE).unwrap();
        let ips = extract_ips(&data, "eu", "a.example.com");
        assert_eq!(ips, vec!["1.2.3.4", "5.6.7.8"]);
    }

    #[test]
    fn extract_ips_is_case_insensitive_on_domain() {
        let data: Value = serde_json::from_str(SAMPLE).unwrap();
        let ips = extract_ips(&data, "eu", "A.EXAMPLE.COM");
        assert_eq!(ips.len(), 2);
    }

    #[test]
    fn extract_ips_empty_when_unknown() {
        let data: Value = serde_json::from_str(SAMPLE).unwrap();
        assert!(extract_ips(&data, "eu", "nope.com").is_empty());
        assert!(extract_ips(&data, "xx", "a.example.com").is_empty());
    }

    #[test]
    fn all_domains_collects_all_regions() {
        let data: Value = serde_json::from_str(SAMPLE).unwrap();
        let domains = all_domains(&data);
        assert_eq!(
            domains,
            vec!["a.example.com", "b.example.com", "c.example.com"]
        );
    }
}
