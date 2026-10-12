use crate::core::clusters;
use crate::error::{AppError, AppResult};
use crate::native::firewall as fw;
use serde_json::Value;
use std::net::{Ipv4Addr, ToSocketAddrs};

/// Применить блокировку/разблокировку для одного домена с готовым списком IP.
/// Внутри: сначала пытаемся одним правилом, если netsh ругается — по одному IP.
pub fn apply_for_domain(domain: &str, ips: &[String], enable: bool) -> AppResult<String> {
    let name = fw::rule_name(domain);

    if !enable {
        fw::delete_rule(&name)?;
        return Ok(format!("Firewall rule removed for {domain}"));
    }

    if ips.is_empty() {
        return Ok(format!("No IPs to block for {domain}"));
    }

    // 1. Пробуем одним правилом со списком.
    match fw::add_rule(&name, ips) {
        Ok(()) => Ok(format!(
            "Firewall rule created for {} ({} IPs)",
            domain,
            ips.len()
        )),
        Err(_) => {
            // 2. Fallback: по одному IP.
            let mut ok = 0usize;
            for ip in ips {
                let ip_name = fw::ip_rule_name(domain, ip);
                if fw::add_rule(&ip_name, &[ip.clone()]).is_ok() {
                    ok += 1;
                }
            }
            Ok(format!("Blocked {ok} IPs individually for {domain}"))
        }
    }
}

/// Массовая операция по региону. Берём IP из clusters-данных.
pub fn update_for_region(
    clusters_data: &Value,
    region_id: &str,
    blocked_domains: &[String],
    enable: bool,
) -> AppResult<String> {
    if region_id.is_empty() {
        return Err(AppError::Msg("region_id is empty".into()));
    }

    let mut results = Vec::new();
    let mut total_ips = 0usize;

    for domain in blocked_domains {
        let ips = clusters::extract_ips(clusters_data, region_id, domain);
        if ips.is_empty() {
            // Fallback: DNS-резолв, как в .old
            let resolved = resolve_ipv4(domain);
            if resolved.is_empty() {
                continue;
            }
            match apply_for_domain(domain, &resolved, enable) {
                Ok(msg) => results.push(format!("{domain}: {msg}")),
                Err(e) => results.push(format!("{domain}: error: {e}")),
            }
            total_ips += resolved.len();
            continue;
        }

        match apply_for_domain(domain, &ips, enable) {
            Ok(msg) => results.push(format!("{domain}: {msg}")),
            Err(e) => results.push(format!("{domain}: error: {e}")),
        }
        total_ips += ips.len();
    }

    if results.is_empty() {
        return Ok(format!(
            "No firewall rules {} for region {} (no matching domains or IPs)",
            if enable { "added" } else { "removed" },
            region_id
        ));
    }

    let summary = format!(
        "{} {} IPs across {} domains",
        if enable { "Blocked" } else { "Unblocked" },
        total_ips,
        results.len()
    );
    results.insert(0, summary);
    Ok(results.join("\n"))
}

/// Удалить все правила, начинающиеся с префикса приложения.
pub fn clear_all() -> AppResult<String> {
    let names = fw::list_rule_names()?;

    if names.is_empty() {
        return Ok("No firewall rules found to delete".into());
    }

    let total = names.len();
    let mut deleted = 0usize;

    for name in &names {
        if matches!(fw::delete_rule(name), Ok(true)) {
            deleted += 1;
        }
    }
    let failed = total - deleted;

    if failed == 0 {
        Ok(format!("Deleted {deleted} firewall rules"))
    } else if deleted == 0 {
        Err(AppError::Msg(format!(
            "Failed to delete {total} firewall rules (run as administrator?)"
        )))
    } else {
        Ok(format!(
            "Deleted {deleted} of {total} firewall rules ({failed} failed)"
        ))
    }
}

/// Список наших правил (по префиксу).
pub fn list_ours() -> AppResult<Vec<String>> {
    let all = fw::list_rule_names()?;
    Ok(all.into_iter().filter(|n| fw::is_ours(n)).collect())
}

/// DNS-резолв домена в IPv4. Возвращает пустой Vec при неудаче.
fn resolve_ipv4(domain: &str) -> Vec<String> {
    let Ok(iter) = format!("{domain}:443").to_socket_addrs() else {
        return Vec::new();
    };
    iter.filter_map(|addr| match addr.ip() {
        std::net::IpAddr::V4(v4) => Some(v4.to_string()),
        std::net::IpAddr::V6(_) => None,
    })
    .collect::<Vec<_>>()
    .into_iter()
    .filter(|s| s.parse::<Ipv4Addr>().is_ok())
    .collect()
}
