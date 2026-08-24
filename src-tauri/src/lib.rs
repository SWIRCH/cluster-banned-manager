// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde_json::json;
use std::io::ErrorKind;
use std::net::{IpAddr, SocketAddr, TcpStream, ToSocketAddrs};
use std::process::Command;
use std::time::{Duration, Instant};

const START_MARKER: &str = "# clusterbanned start";
const END_MARKER: &str = "# clusterbanned end";

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn read_hosts_file() -> Result<String, String> {
    let paths = ["C:\\Windows\\System32\\drivers\\etc\\hosts", "/etc/hosts"];
    for p in paths {
        if let Ok(s) = std::fs::read_to_string(p) {
            return Ok(s);
        }
    }
    Err("hosts file not found or unreadable".into())
}

fn parse_blocked_domains_from_text(text: &str) -> Vec<String> {
    let mut set = std::collections::BTreeSet::new();
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let parts: Vec<_> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            for p in &parts[1..] {
                let d = p.to_lowercase();
                if d.contains('.') {
                    set.insert(d);
                }
            }
        }
    }
    set.into_iter().collect()
}

#[tauri::command]
fn read_blocked_domains() -> Result<Vec<String>, String> {
    let text = read_hosts_file()?;
    Ok(parse_blocked_domains_from_text(&text))
}

#[tauri::command]
fn check_hosts_consistency(selections: serde_json::Value) -> Result<serde_json::Value, String> {
    let text = match read_hosts_file() {
        Ok(t) => t,
        Err(_) => return Ok(json!({ "available": false, "mismatch": false, "blocked": [] })),
    };
    let hosts_set: std::collections::BTreeSet<String> =
        parse_blocked_domains_from_text(&text).into_iter().collect();

    // selections is expected to be a map of region -> { domain: bool }
    let mut mismatch = false;

    if let serde_json::Value::Object(map) = selections {
        for (_region, val) in map {
            if let serde_json::Value::Object(domain_map) = val {
                for (domain, enabled_val) in domain_map {
                    let enabled = match enabled_val {
                        serde_json::Value::Bool(b) => b,
                        _ => true,
                    };
                    let hosts_blocked = hosts_set.contains(&domain.to_lowercase());
                    if hosts_blocked != !enabled {
                        mismatch = true;
                        break;
                    }
                }
            }
            if mismatch {
                break;
            }
        }
    }

    Ok(json!({ "available": true, "mismatch": mismatch, "blocked": hosts_set }))
}

#[tauri::command]
fn update_hosts_block(blocked_domains: Vec<String>) -> Result<(), String> {
    // try to find an accessible hosts path and write the block
    let paths = ["C:\\Windows\\System32\\drivers\\etc\\hosts", "/etc/hosts"];

    for p in paths {
        if let Ok(mut content) = std::fs::read_to_string(p) {
            // remove existing block
            let re = regex::Regex::new(&format!(
                "{}[\\s\\S]*?{}",
                regex::escape(START_MARKER),
                regex::escape(END_MARKER)
            ))
            .map_err(|e| e.to_string())?;
            content = re.replace_all(&content, "").to_string();

            // append new block
            let mut block = String::new();
            block.push_str(START_MARKER);
            block.push('\n');
            for d in &blocked_domains {
                block.push_str(&format!("0.0.0.0 {}\n", d));
            }
            block.push_str(END_MARKER);
            if !content.ends_with('\n') {
                content.push('\n');
            }
            content.push_str(&block);
            // try write
            if std::fs::write(p, content).is_ok() {
                return Ok(());
            }
        }
    }
    Err("failed to write hosts (permission or file missing)".into())
}

#[tauri::command]
async fn ping_server(
    hostname: String,
    timeout_ms: Option<u64>,
    port: Option<u16>,
    addresses: Option<Vec<String>>,
) -> Result<serde_json::Value, String> {
    tauri::async_runtime::spawn_blocking(move || ping_host(hostname, timeout_ms, port, addresses))
        .await
        .map_err(|error| format!("ping worker failed: {error}"))?
}

fn ping_host(
    hostname: String,
    timeout_ms: Option<u64>,
    port: Option<u16>,
    addresses: Option<Vec<String>>,
) -> Result<serde_json::Value, String> {
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(2000).clamp(200, 4000));
    let ips = resolve_ping_ips(&hostname, addresses)?;
    if ips.is_empty() {
        return Ok(json!({
            "ping": null,
            "status": "dns_error",
            "method": "icmp",
            "error": format!("No IPs to ping for {hostname}")
        }));
    }

    for ip in ips.iter().take(2) {
        if let Some(ms) = icmp_ping(*ip, timeout) {
            return Ok(json!({
                "ping": ms,
                "status": "ok",
                "method": "icmp",
                "port": null
            }));
        }
    }

    ping_tcp_rtt(ips, timeout, port)
}

fn icmp_ping(ip: IpAddr, timeout: Duration) -> Option<u64> {
    let ip = ip.to_string();
    let timeout_sec = timeout.as_secs().clamp(1, 5).to_string();
    let timeout_ms = timeout.as_millis().max(200).to_string();
    let attempts = [
        (
            "ping",
            vec![
                "-c".into(),
                "1".into(),
                "-W".into(),
                timeout_sec.clone(),
                ip.clone(),
            ],
        ),
        (
            "/system/bin/ping",
            vec![
                "-c".into(),
                "1".into(),
                "-W".into(),
                timeout_sec,
                ip.clone(),
            ],
        ),
        (
            "ping",
            vec!["-n".into(), "1".into(), "-w".into(), timeout_ms, ip],
        ),
    ];

    for (bin, args) in attempts {
        let output = match Command::new(bin).args(&args).output() {
            Ok(output) => output,
            Err(_) => continue,
        };
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        if let Some(ms) = parse_icmp_ms(&stdout).or_else(|| parse_icmp_ms(&stderr)) {
            return Some(ms);
        }
    }
    None
}

fn parse_icmp_ms(output: &str) -> Option<u64> {
    let lower = output.to_ascii_lowercase();
    let idx = lower.find("time=").or_else(|| lower.find("time<"))?;
    let rest = lower.get(idx + 5..)?;
    let numeric: String = rest
        .chars()
        .take_while(|c| c.is_ascii_digit() || *c == '.')
        .collect();
    if numeric.is_empty() {
        return if lower.contains("time<") {
            Some(1)
        } else {
            None
        };
    }
    numeric
        .parse::<f64>()
        .ok()
        .map(|ms| ms.round().max(1.0) as u64)
}

fn ping_tcp_rtt(
    ips: Vec<IpAddr>,
    timeout: Duration,
    port: Option<u16>,
) -> Result<serde_json::Value, String> {
    let ports = if let Some(port) = port {
        vec![port]
    } else {
        vec![443, 80]
    };

    let deadline = Instant::now() + timeout;
    let mut last_error = String::from("timeout");

    for ip in ips.iter().take(2) {
        for port in &ports {
            let remaining = deadline.saturating_duration_since(Instant::now());
            if remaining < Duration::from_millis(80) {
                break;
            }

            let addr = SocketAddr::new(*ip, *port);
            let started = Instant::now();
            match TcpStream::connect_timeout(&addr, remaining) {
                Ok(_) => {
                    return Ok(tcp_ping_ok(started, *port, "tcp"));
                }
                Err(error) if is_rtt_error(&error) => {
                    return Ok(tcp_ping_ok(started, *port, "tcp_rst"));
                }
                Err(error) => {
                    last_error = error.to_string();
                }
            }
        }
    }

    Ok(json!({
        "ping": null,
        "status": "timeout",
        "method": "tcp",
        "error": last_error
    }))
}

fn tcp_ping_ok(started: Instant, port: u16, method: &str) -> serde_json::Value {
    json!({
        "ping": started.elapsed().as_millis().max(1) as u64,
        "status": "ok",
        "method": method,
        "port": port
    })
}

fn is_rtt_error(error: &std::io::Error) -> bool {
    matches!(
        error.kind(),
        ErrorKind::ConnectionRefused | ErrorKind::ConnectionReset | ErrorKind::BrokenPipe
    )
}

fn resolve_ping_ips(hostname: &str, addresses: Option<Vec<String>>) -> Result<Vec<IpAddr>, String> {
    let mut ips = Vec::new();
    if let Some(addresses) = addresses {
        for address in addresses {
            let trimmed = address.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(ip) = trimmed.parse::<IpAddr>() {
                if !ips.contains(&ip) {
                    ips.push(ip);
                }
            }
        }
    }
    if !ips.is_empty() {
        return Ok(ips);
    }

    format!("{hostname}:443")
        .to_socket_addrs()
        .map(|iter| {
            let mut resolved = Vec::new();
            for addr in iter {
                if !resolved.contains(&addr.ip()) {
                    resolved.push(addr.ip());
                }
            }
            resolved
        })
        .map_err(|error| format!("DNS resolution failed for {hostname}: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_cluster_vpn::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            ping_server,
            read_blocked_domains,
            check_hosts_consistency,
            update_hosts_block
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
