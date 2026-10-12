use crate::error::{AppError, AppResult};
use serde_json::Value;
use std::time::Duration;

/// Общий HTTP-клиент приложения. Один на процесс — reqwest сам держит пул соединений.
fn client() -> AppResult<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| AppError::Msg(format!("http client build: {e}")))
}

/// GET и распарсить ответ как JSON. Ошибки сети/статуса/парсинга — AppError.
pub async fn fetch_json(url: &str) -> AppResult<Value> {
    let response = client()?
        .get(url)
        .send()
        .await
        .map_err(|e| AppError::Msg(format!("http get {url}: {e}")))?;

    if !response.status().is_success() {
        return Err(AppError::Msg(format!(
            "http {} from {url}",
            response.status()
        )));
    }

    response
        .json::<Value>()
        .await
        .map_err(|e| AppError::Msg(format!("http json {url}: {e}")))
}
