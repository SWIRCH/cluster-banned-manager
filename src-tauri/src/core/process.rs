use crate::error::AppResult;
use crate::native::process;
use sysinfo::{PidExt, ProcessExt, SystemExt};

/// Запущен ли процесс, имя или командная строка которого содержит `name`
/// (регистронезависимо).
pub fn is_running(name: &str) -> bool {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_processes();
    let needle = name.to_lowercase();

    for (_pid, proc_) in sys.processes() {
        if proc_.name().to_lowercase().contains(&needle) {
            return true;
        }
        if let Some(cmd) = proc_.cmd().first() {
            if cmd.to_lowercase().contains(&needle) {
                return true;
            }
        }
    }
    false
}

/// Убить все процессы, подходящие под `name`. Возвращает число убитых.
pub fn kill(name: &str) -> AppResult<String> {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_processes();
    let needle = name.to_lowercase();
    let mut killed = 0usize;

    for (pid, proc_) in sys.processes() {
        let by_name = proc_.name().to_lowercase().contains(&needle);
        let by_cmd = proc_
            .cmd()
            .iter()
            .any(|s| s.to_lowercase().contains(&needle));

        if !(by_name || by_cmd) {
            continue;
        }

        let pid_u = pid.as_u32();

        #[cfg(windows)]
        {
            let pid_s = pid_u.to_string();
            if process::run_hidden("taskkill", &["/PID", &pid_s, "/F"]).is_ok() {
                killed += 1;
            }
        }

        #[cfg(not(windows))]
        {
            let pid_s = pid_u.to_string();
            if process::run_hidden("kill", &["-TERM", &pid_s]).is_ok() {
                killed += 1;
            }
        }
    }

    Ok(format!("killed {killed} processes"))
}

/// Запустить игру по `steam://rungameid/<appid>`. Возвращает URI.
pub fn launch_game(appid: &str) -> AppResult<String> {
    let uri = format!("steam://rungameid/{appid}");

    #[cfg(target_os = "windows")]
    {
        process::spawn_hidden("cmd", &["/C", "start", "", &uri])?;
    }

    #[cfg(target_os = "macos")]
    {
        process::spawn_hidden("open", &[&uri])?;
    }

    #[cfg(all(not(target_os = "macos"), not(target_os = "windows")))]
    {
        process::spawn_hidden("xdg-open", &[&uri])?;
    }

    Ok(uri)
}
