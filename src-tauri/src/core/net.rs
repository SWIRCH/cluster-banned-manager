use crate::error::AppResult;
use crate::native::process;
use serde_json::json;
use std::net::{IpAddr, SocketAddr, TcpStream, ToSocketAddrs};
use std::time::{Duration, Instant};

/// Пингануть хост. Возвращает JSON-совместимый отчёт.
pub fn ping_host(hostname: &str, timeout_ms: Option<u64>) -> AppResult<serde_json::Value> {
    let start = Instant::now();

    let resolved: Vec<IpAddr> = (hostname, 0u16)
        .to_socket_addrs()
        .map(|it| it.map(|a| a.ip()).collect())
        .unwrap_or_default();

    let ip = resolved.first().map(|i| i.to_string());

    if !resolved.is_empty()
        && resolved
            .iter()
            .all(|i| i.is_loopback() || i.is_unspecified())
    {
        return Ok(json!({
            "ping": null,
            "status": "blocked",
            "ip": ip,
            "elapsed_ms": start.elapsed().as_millis() as u64
        }));
    }

    let timeout_sec = ((timeout_ms.unwrap_or(600) as f64) / 1000.0).ceil() as u64;

    #[cfg(windows)]
    let args = ["-n", "1", "-w", &(timeout_sec * 1000).to_string(), hostname];

    #[cfg(not(windows))]
    let args = ["-c", "1", "-W", &timeout_sec.to_string(), hostname];

    let output = match process::run_hidden("ping", &args) {
        Ok(o) => o,
        Err(e) => {
            return Ok(json!({
                "ping": null,
                "status": "command_error",
                "error": e.to_string(),
                "elapsed_ms": start.elapsed().as_millis() as u64
            }));
        }
    };

    let elapsed = start.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if output.status.success() {
        if let Some(ping_time) = parse_ping_time(&stdout) {
            return Ok(json!({
                "ping": ping_time,
                "status": "ok",
                "method": "icmp",
                "elapsed_ms": elapsed
            }));
        }
        return Ok(json!({
            "ping": elapsed,
            "status": "ok_no_time",
            "method": "icmp",
            "output": stdout.to_string(),
            "elapsed_ms": elapsed
        }));
    }

    let status = if stdout.contains("timed out") || stdout.contains("Request timed out") {
        "timeout"
    } else if stdout.contains("Destination host unreachable") {
        "unreachable"
    } else if stdout.contains("could not find host") || stderr.contains("could not find host") {
        "dns_error"
    } else {
        "error"
    };

    Ok(json!({
        "ping": null,
        "status": status,
        "error": format!("{} - {}", stdout, stderr),
        "elapsed_ms": elapsed
    }))
}

/// Достать время из вывода `ping`. Поддерживает Windows и Unix-форматы.
pub fn parse_ping_time(output: &str) -> Option<u64> {
    for line in output.lines() {
        let line = line.trim();

        // Windows: "Reply from 92.223.31.134: bytes=32 time=64ms TTL=45"
        if let Some(pos) = line.find("time=") {
            let after = &line[pos + 5..];
            if let Some(end) = after.find("ms") {
                if let Ok(t) = after[..end].trim().parse::<u64>() {
                    return Some(t);
                }
            }
        }

        // Unix: "... icmp_seq=1 ttl=45 time=63.8 ms"
        if let Some(pos) = line.find("time=") {
            let after = &line[pos + 5..];
            if let Some(end) = after.find(" ms") {
                if let Ok(t) = after[..end].trim().parse::<f64>() {
                    return Some(t as u64);
                }
            }
        }
    }
    None
}

/// Полный диагностический отчёт: DNS → TCP на первый IP → системный ping.
pub fn debug_network(hostname: &str) -> AppResult<serde_json::Value> {
    let mut results = json!({});

    // --- Тест 1: DNS ---
    let dns_start = Instant::now();
    let dns_result = format!("{hostname}:80").to_socket_addrs();
    let dns_time = dns_start.elapsed();

    match dns_result {
        Ok(iter) => {
            let addrs: Vec<SocketAddr> = iter.collect();
            let ips: Vec<String> = addrs.iter().take(3).map(|a| a.ip().to_string()).collect();

            results["dns"] = json!({
                "success": true,
                "ips": ips,
                "time_ms": dns_time.as_millis()
            });

            // --- Тест 2: TCP ---
            if let Some(first_ip) = ips.first() {
                let ports = [80u16, 443, 8080, 8443];
                let mut tcp_tests = Vec::new();

                for port in ports {
                    let addr = format!("{first_ip}:{port}");
                    let tcp_start = Instant::now();

                    let entry = match addr.parse::<SocketAddr>() {
                        Ok(socket_addr) => match TcpStream::connect_timeout(
                            &socket_addr,
                            Duration::from_millis(2000),
                        ) {
                            Ok(_) => json!({
                                "port": port,
                                "success": true,
                                "time_ms": tcp_start.elapsed().as_millis()
                            }),
                            Err(e) => json!({
                                "port": port,
                                "success": false,
                                "error": e.to_string(),
                                "time_ms": tcp_start.elapsed().as_millis()
                            }),
                        },
                        Err(_) => json!({
                            "port": port,
                            "success": false,
                            "error": "Failed to parse socket address",
                            "time_ms": 0
                        }),
                    };
                    tcp_tests.push(entry);
                }
                results["tcp"] = json!(tcp_tests);
            }
        }
        Err(e) => {
            results["dns"] = json!({
                "success": false,
                "error": e.to_string(),
                "time_ms": dns_time.as_millis()
            });
        }
    }

    // --- Тест 3: Системный ping ---
    #[cfg(windows)]
    let ping_args = ["-n", "1", hostname];
    #[cfg(not(windows))]
    let ping_args = ["-c", "1", hostname];

    let cmd_start = Instant::now();
    match process::run_hidden("ping", &ping_args) {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let stderr = String::from_utf8_lossy(&out.stderr);
            results["system_ping"] = json!({
                "success": out.status.success(),
                "exit_code": out.status.code().unwrap_or(-1),
                "stdout": stdout.to_string(),
                "stderr": stderr.to_string(),
                "time_ms": cmd_start.elapsed().as_millis()
            });
        }
        Err(e) => {
            results["system_ping"] = json!({
                "success": false,
                "error": e.to_string(),
                "time_ms": cmd_start.elapsed().as_millis()
            });
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::parse_ping_time;

    #[test]
    fn parses_windows_format() {
        let out = "Reply from 1.2.3.4: bytes=32 time=64ms TTL=45";
        assert_eq!(parse_ping_time(out), Some(64));
    }

    #[test]
    fn parses_unix_format_with_ms_suffix() {
        let out = "64 bytes from 1.2.3.4: icmp_seq=1 ttl=45 time=63.8 ms";
        assert_eq!(parse_ping_time(out), Some(63));
    }

    #[test]
    fn returns_none_when_no_time() {
        let out = "Request timed out.";
        assert_eq!(parse_ping_time(out), None);
    }
}
