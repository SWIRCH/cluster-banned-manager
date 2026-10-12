use crate::error::{AppError, AppResult};
use std::process::{Command, Output};

/// Запустить и не ждать завершения (fire-and-forget).
pub fn spawn_hidden(program: &str, args: &[&str]) -> AppResult<()> {
    let mut cmd = Command::new(program);
    cmd.args(args);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.spawn()
        .map_err(|e| AppError::Msg(format!("failed to spawn `{program}`: {e}")))?;
    Ok(())
}

/// Запустить команду, скрыв окно консоли на Windows.
/// Возвращает вывод (stdout+stderr) или ошибку запуска.
pub fn run_hidden(program: &str, args: &[&str]) -> AppResult<Output> {
    let mut cmd = Command::new(program);
    cmd.args(args);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.output()
        .map_err(|e| AppError::Msg(format!("failed to run `{program}`: {e}")))
}

/// Запустить и вернуть stdout как строку (lossy). Ошибки процесса — наружу.
pub fn run_hidden_stdout(program: &str, args: &[&str]) -> AppResult<String> {
    let out = run_hidden(program, args)?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}
