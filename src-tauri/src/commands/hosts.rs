use crate::core::hosts::{self, HostsOp};
use crate::core::settings;
use crate::error::{AppError, AppResult};

#[tauri::command]
pub fn read_blocked_domains() -> AppResult<Vec<String>> {
    hosts::read_blocked_domains()
}

#[tauri::command]
pub fn check_hosts_consistency(
    selections: serde_json::Value,
) -> AppResult<hosts::ConsistencyReport> {
    hosts::check_consistency(&selections)
}

#[tauri::command]
pub fn update_hosts_block(
    blocked_domains: Option<Vec<String>>,
    blocked_domains_alt: Option<Vec<String>>,
    remove: Option<bool>,
    region: Option<String>,
    args: Option<serde_json::Value>,
) -> AppResult<String> {
    let payload = args.as_ref().map(|v| v.get("args").unwrap_or(v));

    let domains = blocked_domains
        .or(blocked_domains_alt)
        .or_else(|| extract_domains(payload))
        .ok_or_else(|| AppError::Msg("update_hosts_block missing blocked_domains".into()))?;

    let region = region.or_else(|| extract_region(payload));
    let remove = remove.or_else(|| extract_remove(payload)).unwrap_or(false);

    let op = if remove {
        HostsOp::RemoveDomains { region, domains }
    } else {
        HostsOp::Replace { region, domains }
    };

    let backup = settings::load()?.use_backup;
    Ok(hosts::apply(op, backup)?.message)
}

fn extract_domains(v: Option<&serde_json::Value>) -> Option<Vec<String>> {
    let v = v?;
    let arr = v
        .get("blocked_domains")
        .or_else(|| v.get("blocked_domains_alt"))?
        .as_array()?;
    Some(
        arr.iter()
            .filter_map(|x| x.as_str().map(str::to_string))
            .collect(),
    )
}

fn extract_region(v: Option<&serde_json::Value>) -> Option<String> {
    v?.get("region")?.as_str().map(str::to_string)
}

fn extract_remove(v: Option<&serde_json::Value>) -> Option<bool> {
    v?.get("remove")?.as_bool()
}
