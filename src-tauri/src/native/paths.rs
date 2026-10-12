use crate::error::{AppError, AppResult};
use std::path::PathBuf;

/// Путь к hosts-файлу, который реально существует в системе.
/// Windows: `C:\Windows\System32\drivers\etc\hosts`
/// Unix:    `/etc/hosts`
pub fn hosts_path() -> AppResult<PathBuf> {
    const CANDIDATES: &[&str] = &[r"C:\Windows\System32\drivers\etc\hosts", "/etc/hosts"];

    CANDIDATES
        .iter()
        .map(PathBuf::from)
        .find(|p| p.exists())
        .ok_or_else(|| AppError::Msg("hosts file not found".into()))
}

/// Путь к settings.json. Различается по ОС, но имя файла одно.
pub fn settings_path() -> AppResult<PathBuf> {
    let dir = app_config_dir()?;
    Ok(dir.join("settings.json"))
}

/// Директория конфигов приложения (создаётся при необходимости отдельно).
fn app_config_dir() -> AppResult<PathBuf> {
    #[cfg(windows)]
    {
        let base =
            std::env::var("APPDATA").map_err(|_| AppError::Msg("APPDATA not found".into()))?;
        Ok(PathBuf::from(base).join("clusterbanned"))
    }

    #[cfg(target_os = "macos")]
    {
        let base = std::env::var("HOME").map_err(|_| AppError::Msg("HOME not found".into()))?;
        Ok(PathBuf::from(base)
            .join("Library")
            .join("Application Support")
            .join("clusterbanned"))
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let base = std::env::var("HOME").map_err(|_| AppError::Msg("HOME not found".into()))?;
        Ok(PathBuf::from(base).join(".config").join("clusterbanned"))
    }
}
