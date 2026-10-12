use crate::core::vpn::{self, VpnPolicy};
use crate::error::AppResult;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct VpnPolicyRequest {
    pub domains: Vec<String>,
}

#[tauri::command]
pub fn vpn_prepare_policy(request: VpnPolicyRequest) -> AppResult<VpnPolicy> {
    vpn::build_policy(&request.domains)
}
