use crate::native::http;
use serde_json::Value;

const GITHUB_URL: &str =
    "https://raw.githubusercontent.com/SWIRCH/cluster-banned-manager/main/src/data/servers.json";

const LOCAL_PATH: &str = "../../../src/data/servers.json";

const EMBEDDED: &str = include_str!("../../../src/data/servers.json");

/// Получить данные о кластерах: GitHub → локальный файл → встроенный JSON.
/// Никогда не падает — последний fallback встроенный, он гарантированно есть
pub async fn load() -> Value {
    // 1. GitHub
    match http::fetch_json(GITHUB_URL).await {
        Ok(data) => {
            log::info!("✅ clusters: loaded from GitHub");
            return data;
        }
        Err(e) => log::error!("⚠️ clusters: GitHub failed: {e}"),
    }

    // 2. Локальный файл (только в dev — путь относительный, из target/debug)
    match std::fs::read_to_string(LOCAL_PATH) {
        Ok(content) => match serde_json::from_str::<Value>(&content) {
            Ok(data) => {
                log::info!("✅ clusters: loaded from local file");
                return data;
            }
            Err(e) => log::error!("⚠️ clusters: local parse failed: {e}"),
        },
        Err(e) => log::error!("⚠️ clusters: local read failed: {e}"),
    }

    // 3. Встроенный — гарантированно валидный JSON, иначе проект не собрался бы
    log::info!("⚠️ clusters: using embedded JSON");
    serde_json::from_str(EMBEDDED).unwrap_or_else(|e| {
        log::error!("⛔ clusters: embedded JSON broken: {e}");
        serde_json::json!({})
    })
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
