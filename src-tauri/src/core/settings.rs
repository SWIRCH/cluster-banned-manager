use crate::error::AppResult;
use crate::native::paths;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum SyncMode {
    #[default]
    Hybrid,
    Local,
    Server,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Settings {
    pub use_firewall: bool,
    pub use_backup: bool,
    pub backup_count: u32,
    pub sync_mode: SyncMode,

    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            use_firewall: true,
            use_backup: false,
            backup_count: 5,
            sync_mode: SyncMode::Hybrid,
            extra: HashMap::new(),
        }
    }
}

/// Прочитать настройки. Если файла нет — вернуть дефолты (без создания файла).
pub fn load() -> AppResult<Settings> {
    let path = paths::settings_path()?;
    if !path.exists() {
        return Ok(Settings::default());
    }
    let content = std::fs::read_to_string(&path)?;
    let settings: Settings = serde_json::from_str(&content)?;
    Ok(settings)
}

/// Записать настройки. Создаёт директорию при необходимости.
pub fn save(settings: &Settings) -> AppResult<()> {
    let path = paths::settings_path()?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(settings)?;
    std::fs::write(&path, content)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_has_expected_values() {
        let s = Settings::default();
        assert!(s.use_firewall);
        assert!(!s.use_backup);
        assert_eq!(s.backup_count, 5);
        assert_eq!(s.sync_mode, SyncMode::Hybrid);
    }

    #[test]
    fn deserializes_partial_json_with_defaults() {
        let s: Settings = serde_json::from_str(r#"{"useBackup": true}"#).unwrap();
        assert!(s.use_backup);
        assert!(s.use_firewall); // дефолт
        assert_eq!(s.backup_count, 5); // дефолт
        assert_eq!(s.sync_mode, SyncMode::Hybrid);
    }

    #[test]
    fn roundtrip_preserves_all_fields() {
        let s = Settings {
            use_firewall: false,
            use_backup: true,
            backup_count: 10,
            sync_mode: SyncMode::Hybrid,
            extra: HashMap::new(),
        };
        let json = serde_json::to_string(&s).unwrap();
        let back: Settings = serde_json::from_str(&json).unwrap();
        assert!(!back.use_firewall);
        assert!(back.use_backup);
        assert_eq!(back.backup_count, 10);
    }
}
