use serde::{de, Deserialize, Deserializer, Serialize};

fn deserialize_domains<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
  D: Deserializer<'de>,
{
  #[derive(Deserialize)]
  #[serde(untagged)]
  enum Domains {
    List(Vec<String>),
    Json(String),
  }

  match Domains::deserialize(deserializer)? {
    Domains::List(domains) => Ok(domains),
    Domains::Json(value) => serde_json::from_str(&value).map_err(de::Error::custom),
  }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VpnStartRequest {
  pub domains: Vec<String>,
  #[serde(default)]
  pub ips: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VpnStatus {
  pub state: String,
  #[serde(deserialize_with = "deserialize_domains")]
  pub domains: Vec<String>,
}
