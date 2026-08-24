use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

#[derive(Debug, Deserialize)]
pub struct VpnPolicyRequest {
    pub domains: Vec<String>,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct VpnPolicy {
    pub domains: Vec<String>,
}

fn normalize_domain(domain: &str) -> Option<String> {
    let normalized = domain.trim().trim_end_matches('.').to_ascii_lowercase();

    if normalized.is_empty()
        || normalized.len() > 253
        || normalized.starts_with('.')
        || normalized.ends_with('.')
        || normalized.split('.').any(|part| {
            part.is_empty()
                || part.len() > 63
                || part.starts_with('-')
                || part.ends_with('-')
                || !part
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        })
    {
        return None;
    }

    Some(normalized)
}

pub fn build_policy(domains: &[String]) -> Result<VpnPolicy, String> {
    let mut normalized = BTreeSet::new();

    for domain in domains {
        let value =
            normalize_domain(domain).ok_or_else(|| format!("invalid VPN domain: {domain}"))?;
        normalized.insert(value);
    }

    Ok(VpnPolicy {
        domains: normalized.into_iter().collect(),
    })
}

#[tauri::command]
pub fn vpn_prepare_policy(request: VpnPolicyRequest) -> Result<VpnPolicy, String> {
    build_policy(&request.domains)
}

#[cfg(test)]
mod tests {
    use super::build_policy;

    #[test]
    fn normalizes_and_deduplicates_domains() {
        let policy = build_policy(&[
            " Cluster.EXAMPLE.com ".to_string(),
            "cluster.example.com.".to_string(),
        ])
        .expect("policy should be valid");

        assert_eq!(policy.domains, vec!["cluster.example.com"]);
    }

    #[test]
    fn rejects_invalid_domains() {
        let error = build_policy(&["bad domain.example".to_string()]).unwrap_err();

        assert!(error.contains("invalid VPN domain"));
    }
}
