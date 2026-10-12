use crate::error::{AppError, AppResult};
use crate::native::paths;
use serde::Serialize;
use std::collections::BTreeSet;

const START_MARKER: &str = "# clusterbanned start";
const END_MARKER: &str = "# clusterbanned end";

#[derive(Debug, Serialize)]
pub struct ConsistencyReport {
    pub blocked: Vec<String>,
    pub mismatch: bool,
}

/// Результат применения операции: сообщение + был ли реально изменён файл.
#[derive(Debug)]
pub struct ApplyResult {
    pub message: String,
    pub modified: bool,
}

/// Прочитать все домены из блока(ов) clusterbanned в hosts.
pub fn read_blocked_domains() -> AppResult<Vec<String>> {
    let text = std::fs::read_to_string(paths::hosts_path()?)?;
    Ok(parse_blocked_domains(&text))
}

/// Распарсить ВСЕ домены в hosts (не только наши блоки) — как в оригинале.
pub fn parse_blocked_domains(text: &str) -> Vec<String> {
    let mut set = BTreeSet::new();
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

/// Проверка соответствия hosts и selections (карта region -> {domain: enabled}).
pub fn check_consistency(selections: &serde_json::Value) -> AppResult<ConsistencyReport> {
    let text = std::fs::read_to_string(paths::hosts_path()?)?;
    let blocked: BTreeSet<String> = parse_blocked_domains(&text).into_iter().collect();
    Ok(compute_consistency(&blocked, selections))
}

/// Чистая функция сравнения — тестируется без ФС.
pub fn compute_consistency(
    blocked: &BTreeSet<String>,
    selections: &serde_json::Value,
) -> ConsistencyReport {
    let mut mismatch = false;

    if let serde_json::Value::Object(map) = selections {
        'outer: for (_region, val) in map {
            if let serde_json::Value::Object(domain_map) = val {
                for (domain, enabled_val) in domain_map {
                    let enabled = enabled_val.as_bool().unwrap_or(true);
                    let hosts_blocked = blocked.contains(&domain.to_lowercase());
                    if hosts_blocked != !enabled {
                        mismatch = true;
                        break 'outer;
                    }
                }
            }
        }
    }

    ConsistencyReport {
        blocked: blocked.iter().cloned().collect(),
        mismatch,
    }
}

/// Операция над блоком hosts.
#[derive(Debug, Clone)]
pub enum HostsOp {
    /// Заменить блок для региона `region` (или безымянный, если None) на новый список доменов.
    Replace {
        region: Option<String>,
        domains: Vec<String>,
    },
    /// Удалить конкретные домены из блока региона. Если блок опустеет — удалить целиком.
    RemoveDomains {
        region: Option<String>,
        domains: Vec<String>,
    },
    /// Удалить все блоки clusterbanned (не трогая чужое).
    ClearAll,
}

/// Единая точка входа: применить операцию, при `backup = true` сохранить копию.
pub fn apply(op: HostsOp, backup: bool) -> AppResult<ApplyResult> {
    let path = paths::hosts_path()?;
    let original = std::fs::read_to_string(&path)?;
    let mut content = original.clone();

    let (message, modified) = match op {
        HostsOp::Replace { region, domains } => {
            let had_block = find_block(&content, region.as_deref()).is_some();
            replace_block(&mut content, region.as_deref(), &domains)?;

            let modified = had_block || !domains.is_empty();
            let msg = if domains.is_empty() {
                format!("Removed clusterbanned block (wrote to {})", path.display())
            } else {
                format!(
                    "Successfully blocked {} domains (wrote to {})",
                    domains.len(),
                    path.display()
                )
            };
            (msg, modified)
        }
        HostsOp::RemoveDomains { region, domains } => {
            remove_domains(&mut content, region.as_deref(), &domains)?
        }
        HostsOp::ClearAll => {
            let removed = clear_all_blocks(&mut content);
            if removed == 0 {
                return Ok(ApplyResult {
                    message: "No clusterbanned blocks found in hosts".into(),
                    modified: false,
                });
            }
            (
                format!("Successfully removed {} block(s) from hosts", removed),
                true,
            )
        }
    };

    if modified {
        if backup {
            write_backup(&path, &original)?;
        }
        std::fs::write(&path, content.as_bytes())?;
    }

    Ok(ApplyResult { message, modified })
}

/// Найти ПЕРВЫЙ диапазон блока, соответствующего региону.
/// Если region=None — первый найденный блок.
fn find_block(content: &str, region: Option<&str>) -> Option<(usize, usize)> {
    find_all_blocks(content, region).into_iter().next()
}

/// Найти ВСЕ диапазоны блоков, соответствующих региону.
/// Полезно для будущего dedupe.
fn find_all_blocks(content: &str, region: Option<&str>) -> Vec<(usize, usize)> {
    let mut result = Vec::new();
    let mut idx = 0;

    while let Some(rel_start) = content[idx..].find(START_MARKER) {
        let start = idx + rel_start;
        let Some(rel_end) = content[start..].find(END_MARKER) else {
            break;
        };
        let end = start + rel_end + END_MARKER.len();

        let first_line = content[start..].lines().next().unwrap_or("");
        let block_region = first_line
            .find("region:")
            .and_then(|p| first_line[p + "region:".len()..].split_whitespace().next())
            .map(str::to_string);

        let matches = match (region, block_region.as_deref()) {
            (Some(target), Some(br)) => br == target,
            (None, _) => true,
            _ => false,
        };
        if matches {
            result.push((start, end));
        }

        idx = end;
    }

    result
}

/// Заменить блок для региона на новый список доменов.
fn replace_block(content: &mut String, region: Option<&str>, domains: &[String]) -> AppResult<()> {
    // Удаляем ВСЕ блоки этого региона (на случай дублей от старых версий).
    let ranges = find_all_blocks(content, region);
    // Идём с конца, чтобы индексы не съезжали.
    for (start, end) in ranges.into_iter().rev() {
        content.replace_range(start..end, "");
    }
    collapse_blank_lines(content);

    if domains.is_empty() {
        return Ok(());
    }

    let block = build_block(region, domains);
    *content = content.trim_end_matches('\n').to_string();
    content.push_str("\n\n");
    content.push_str(&block);
    content.push('\n');
    Ok(())
}

/// Удалить конкретные домены из блока. Если блок опустеет — убрать целиком.
fn remove_domains(
    content: &mut String,
    region: Option<&str>,
    domains: &[String],
) -> AppResult<(String, bool)> {
    let Some((start, end)) = find_block(content, region) else {
        return Ok(("No cluster entries to update".into(), false));
    };

    let block = &content[start..end];
    let mut existing: BTreeSet<String> = BTreeSet::new();
    for line in block.lines() {
        let t = line.trim();
        if t.starts_with(START_MARKER) || t.starts_with(END_MARKER) || t.is_empty() {
            continue;
        }
        if let Some(d) = t.split_whitespace().nth(1) {
            existing.insert(d.to_lowercase());
        }
    }

    let remove_set: BTreeSet<String> = domains.iter().map(|s| s.to_lowercase()).collect();
    let remaining: Vec<String> = existing.difference(&remove_set).cloned().collect();

    if remaining.len() == existing.len() {
        return Ok(("No matching entries to remove".into(), false));
    }

    let replacement = if remaining.is_empty() {
        String::new()
    } else {
        build_block(region, &remaining)
    };

    content.replace_range(start..end, &replacement);
    collapse_blank_lines(content);

    if remaining.is_empty() {
        Ok(("Removed clusterbanned block".into(), true))
    } else {
        let removed_count = existing.intersection(&remove_set).count();
        Ok((
            format!(
                "Removed {} entries, left {} entries",
                removed_count,
                remaining.len()
            ),
            true,
        ))
    }
}

/// Удалить все блоки clusterbanned. Возвращает число удалённых.
fn clear_all_blocks(content: &mut String) -> usize {
    let mut removed = 0;
    let mut position = 0;
    loop {
        let Some(rel) = content[position..].find(START_MARKER) else {
            break;
        };
        let start = position + rel;

        let Some(rel_end) = content[start..].find(END_MARKER) else {
            break;
        };
        let end = start + rel_end + END_MARKER.len();

        content.replace_range(start..end, "");
        removed += 1;
        position = start;
    }
    if removed > 0 {
        collapse_blank_lines(content);
        *content = content.trim().to_string();
        content.push('\n');
    }
    removed
}

fn build_block(region: Option<&str>, domains: &[String]) -> String {
    let mut block = String::new();
    match region {
        Some(r) => block.push_str(&format!("{} region:{}", START_MARKER, r)),
        None => block.push_str(START_MARKER),
    }
    block.push('\n');
    for d in domains {
        block.push_str(&format!("0.0.0.0 {}\n", d));
    }
    block.push_str(END_MARKER);
    block
}

fn collapse_blank_lines(content: &mut String) {
    while content.contains("\n\n\n") {
        *content = content.replace("\n\n\n", "\n\n");
    }
}

fn write_backup(path: &std::path::Path, original: &str) -> AppResult<()> {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| AppError::Msg(e.to_string()))?
        .as_secs();
    let backup_path = format!("{}.clusterbanned.bak.{}", path.display(), ts);
    std::fs::write(&backup_path, original.as_bytes())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_domains() {
        let text = "0.0.0.0 example.com\n0.0.0.0 test.org\n";
        assert_eq!(parse_blocked_domains(text), vec!["example.com", "test.org"]);
    }

    #[test]
    fn consistency_no_mismatch_when_allowed_and_not_blocked() {
        // enabled = true (разрешён), hosts_blocked = false → согласовано
        let blocked = BTreeSet::new();
        let selections = serde_json::json!({ "eu": { "example.com": true } });
        assert!(!compute_consistency(&blocked, &selections).mismatch);
    }

    #[test]
    fn consistency_mismatch_when_allowed_but_blocked() {
        // enabled = true (разрешён), hosts_blocked = true → mismatch
        let mut blocked = BTreeSet::new();
        blocked.insert("example.com".to_string());
        let selections = serde_json::json!({ "eu": { "example.com": true } });
        assert!(compute_consistency(&blocked, &selections).mismatch);
    }

    #[test]
    fn consistency_no_mismatch_when_blocked_and_blocked() {
        // enabled = false (заблокирован), hosts_blocked = true → согласовано
        let mut blocked = BTreeSet::new();
        blocked.insert("example.com".to_string());
        let selections = serde_json::json!({ "eu": { "example.com": false } });
        assert!(!compute_consistency(&blocked, &selections).mismatch);
    }

    #[test]
    fn consistency_mismatch_when_blocked_but_not_in_hosts() {
        // enabled = false (заблокирован), hosts_blocked = false → mismatch
        let blocked = BTreeSet::new();
        let selections = serde_json::json!({ "eu": { "example.com": false } });
        assert!(compute_consistency(&blocked, &selections).mismatch);
    }

    #[test]
    fn find_block_by_region() {
        let content = "\
# clusterbanned start region:eu\n0.0.0.0 a.com\n# clusterbanned end\n\
# clusterbanned start region:na\n0.0.0.0 b.com\n# clusterbanned end\n";
        let (s, e) = find_block(content, Some("na")).unwrap();
        assert!(content[s..e].contains("b.com"));
        assert!(!content[s..e].contains("a.com"));
    }

    #[test]
    fn find_block_none_returns_first() {
        let content = "\
# clusterbanned start region:eu\n0.0.0.0 a.com\n# clusterbanned end\n\
# clusterbanned start region:na\n0.0.0.0 b.com\n# clusterbanned end\n";
        let (s, e) = find_block(content, None).unwrap();
        assert!(content[s..e].contains("a.com"));
    }

    #[test]
    fn replace_block_creates_new_block() {
        let mut content = "127.0.0.1 localhost\n".to_string();
        replace_block(&mut content, Some("eu"), &["a.com".into()]).unwrap();
        assert!(content.contains("# clusterbanned start region:eu"));
        assert!(content.contains("0.0.0.0 a.com"));
    }

    #[test]
    fn replace_block_dedupes_same_region() {
        let mut content = format!(
            "{START_MARKER} region:eu\n0.0.0.0 old.com\n{END_MARKER}\n\
             {START_MARKER} region:eu\n0.0.0.0 older.com\n{END_MARKER}\n"
        );
        replace_block(&mut content, Some("eu"), &["new.com".into()]).unwrap();
        assert!(!content.contains("old.com"));
        assert!(!content.contains("older.com"));
        assert!(content.contains("new.com"));
        // Ровно один блок с region:eu
        assert_eq!(content.matches("region:eu").count(), 1);
    }

    #[test]
    fn remove_domains_keeps_rest() {
        let mut content =
            format!("{START_MARKER} region:eu\n0.0.0.0 a.com\n0.0.0.0 b.com\n{END_MARKER}\n");
        let (msg, modified) = remove_domains(&mut content, Some("eu"), &["a.com".into()]).unwrap();
        assert!(modified);
        assert!(msg.contains("Removed 1"));
        assert!(!content.contains("a.com"));
        assert!(content.contains("b.com"));
    }

    #[test]
    fn remove_domains_no_match_reports_unmodified() {
        let mut content = format!("{START_MARKER} region:eu\n0.0.0.0 a.com\n{END_MARKER}\n");
        let (_, modified) =
            remove_domains(&mut content, Some("eu"), &["nonexistent.com".into()]).unwrap();
        assert!(!modified);
    }

    #[test]
    fn clear_all_removes_multiple_blocks() {
        let mut content = format!(
            "{START_MARKER} region:eu\n0.0.0.0 a.com\n{END_MARKER}\n\
             some other line\n\
             {START_MARKER} region:na\n0.0.0.0 b.com\n{END_MARKER}\n"
        );
        assert_eq!(clear_all_blocks(&mut content), 2);
        assert!(content.contains("some other line"));
        assert!(!content.contains("clusterbanned"));
    }
}
