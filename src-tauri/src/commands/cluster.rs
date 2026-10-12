use crate::core::{clusters, firewall, hosts, settings};
use crate::error::AppResult;
use serde_json::json;

#[tauri::command]
pub async fn update_cluster_rules(
    region_id: String,
    blocked_domains: Vec<String>,
    enable: bool,
    use_hosts: bool,
    use_firewall: bool,
) -> AppResult<serde_json::Value> {
    let backup = settings::load()?.use_backup;

    // 1. hosts
    let hosts_result = if use_hosts {
        let op = if enable {
            hosts::HostsOp::Replace {
                region: Some(region_id.clone()),
                domains: blocked_domains.clone(),
            }
        } else {
            hosts::HostsOp::RemoveDomains {
                region: Some(region_id.clone()),
                domains: blocked_domains.clone(),
            }
        };

        match hosts::apply(op, backup) {
            Ok(r) => json!(r.message),
            Err(e) => json!(format!("Error: {e}")),
        }
    } else {
        json!("Skipped")
    };

    // 2. firewall
    let firewall_result = if use_firewall {
        let data = clusters::load().await;
        let region = region_id.clone();
        let domains = blocked_domains.clone();

        match tauri::async_runtime::spawn_blocking(move || {
            firewall::update_for_region(&data, &region, &domains, enable)
        })
        .await
        {
            Ok(Ok(msg)) => json!(msg),
            Ok(Err(e)) => json!(format!("Error: {e}")),
            Err(e) => json!(format!("Worker error: {e}")),
        }
    } else {
        json!("Skipped")
    };

    let success = !hosts_result.as_str().unwrap_or("").starts_with("Error:")
        && !firewall_result.as_str().unwrap_or("").starts_with("Error:");

    Ok(json!({
        "success": success,
        "hosts": hosts_result,
        "firewall": firewall_result,
    }))
}

#[tauri::command]
pub async fn clear_cluster_blocks() -> AppResult<String> {
    let settings = settings::load()?; // ← один раз, оба поля
    let backup = settings.use_backup;
    let use_firewall = settings.use_firewall;

    let mut messages = Vec::new();

    // 1. hosts — всегда
    match hosts::apply(hosts::HostsOp::ClearAll, backup) {
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
