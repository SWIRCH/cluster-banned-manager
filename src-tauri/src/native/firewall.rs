use crate::error::{AppError, AppResult};
use crate::native::process;
use std::collections::BTreeSet;

pub const RULE_PREFIX: &str = "WoT_Blitz_Block_";

/// Префикс имени правила. Используется для поиска/удаления «наших» правил.
pub const OUR_PREFIXES: &[&str] = &["WoT_Blitz_Block_", "WoT_Block_", "ClusterBanned_"];

pub fn is_ours(name: &str) -> bool {
    OUR_PREFIXES.iter().any(|p| name.starts_with(p))
}

/// Собрать имя правила из домена.
pub fn rule_name(domain: &str) -> String {
    format!("{}{}", RULE_PREFIX, domain.replace('.', "_"))
}

/// Имя правила для отдельного IP (fallback, когда netsh не переваривает
/// список через запятую).
pub fn ip_rule_name(domain: &str, ip: &str) -> String {
    format!("{}_{}", rule_name(domain), ip.replace('.', "_"))
}

/// Добавить одно правило блокировки для набора IP.
/// Возвращает `Ok(())` если netsh отчитался успехом, иначе `Err`.
#[cfg(windows)]
pub fn add_rule(name: &str, ips: &[String]) -> AppResult<()> {
    if ips.is_empty() {
        return Err(AppError::Msg("add_rule: empty ips".into()));
    }

    // Сначала удаляем старое правило с тем же именем (идемпотентность).
    let _ = process::run_hidden(
        "netsh",
        &[
            "advfirewall",
            "firewall",
            "delete",
            "rule",
            &format!("name={name}"),
        ],
    );

    let ips_str = ips.join(",");
    let out = process::run_hidden(
        "netsh",
        &[
            "advfirewall",
            "firewall",
            "add",
            "rule",
            &format!("name={name}"),
            "dir=out",
            "action=block",
            &format!("remoteip={ips_str}"),
            "protocol=any",
            "enable=yes",
            "profile=any",
        ],
    )?;

    if out.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&out.stderr).to_string();
        Err(AppError::Msg(format!("netsh add rule failed: {stderr}")))
    }
}

#[cfg(not(windows))]
pub fn add_rule(_name: &str, _ips: &[String]) -> AppResult<()> {
    Err(AppError::Unsupported("firewall is Windows-only".into()))
}

/// Удалить правило по имени. Отсутствие правила — не ошибка.
pub fn delete_rule(name: &str) -> AppResult<bool> {
    let out = process::run_hidden(
        "netsh",
        &[
            "advfirewall",
            "firewall",
            "delete",
            "rule",
            &format!("name={name}"),
        ],
    )?;
    Ok(out.status.success())
}

#[cfg(not(windows))]
pub fn delete_rule(_name: &str) -> AppResult<bool> {
    Err(AppError::Unsupported("firewall is Windows-only".into()))
}

/// Получить полный список имён правил (все правила системы).
#[cfg(windows)]
pub fn list_rule_names() -> AppResult<Vec<String>> {
    let out = process::run_hidden(
        "netsh",
        &["advfirewall", "firewall", "show", "rule", "name=all"],
    )?;

    let stdout = String::from_utf8_lossy(&out.stdout);

    let names: BTreeSet<String> = stdout
        .lines()
        .filter_map(|line| line.split_once(':'))
        .map(|(_, value)| value.trim())
        .filter(|v| is_ours(v))
        .map(str::to_string)
        .collect();

    Ok(names.into_iter().collect())
}

#[cfg(not(windows))]
pub fn list_rule_names() -> AppResult<Vec<String>> {
    Err(AppError::Unsupported("firewall is Windows-only".into()))
}
