# Android VPN architecture

## Goal

Keep the existing desktop implementation based on `hosts` and Windows Firewall,
while using an Android `VpnService` for selective cluster blocking. The Android
path must never try to write `/etc/hosts` or execute Windows firewall commands.

## Ownership

### Shared Rust code

- Validate and normalize the selected domain list.
- Store the current VPN policy and expose a stable Tauri command contract.
- Define platform-neutral status values: `off`, `starting`, `on`, `stopping`,
  `error`.

### Desktop adapter

- Keep the current `update_hosts_block`, `update_firewall_rules`, and related
  commands unchanged.
- `update_cluster_rules` continues to select hosts and Windows Firewall from
  the existing settings.

### Android adapter

- Kotlin owns the Android service lifecycle and calls
  `VpnService.prepare(...)` before starting the service.
- The service creates the TUN interface with `VpnService.Builder` and runs the
  packet/DNS loop in a foreground service.
- Kotlin reports lifecycle changes back through the Tauri plugin/event layer.
- The service is stopped explicitly and closes the TUN file descriptor before
  reporting `off`.

## Runtime flow

1. React calls a platform-neutral command such as `vpn_start(domains)`.
2. Rust validates the domains and dispatches to the platform adapter.
3. On desktop, the adapter uses the existing hosts/firewall path.
4. On Android, Kotlin requests VPN consent if needed, then starts
   `ClusterVpnService` with the normalized domain policy.
5. The service emits `starting`, `on`, `error`, or `off`; React mirrors that in
   the existing `vpnStatus` store.

## JNI decision

A direct JNI bridge is not the first integration point. Tauri already provides
Rust-to-React IPC, and Kotlin is the correct owner of `VpnService`. Use a
custom Tauri Android plugin for Rust/Kotlin calls and events. Add JNI only if
the packet engine itself is moved into Rust; in that case JNI should expose a
small `start(policy)`, `stop()`, and `status()` surface, not Android lifecycle
logic.

## MVP packet strategy

Start with DNS blocking for the cluster domains. This is much smaller than a
full transparent proxy and is enough to validate consent, service lifetime,
policy updates, and UI state. A production implementation must decide how to
handle DoT, DoH, QUIC, cached IPs, IPv6, and applications that use hard-coded
resolvers. Those cases require a real packet-forwarding/filtering engine and
must not be hidden behind a fake `VpnService` that silently drops all traffic.

## Safe implementation order

1. Add the shared Rust VPN command/status contract with desktop and Android
   capability branches.
2. Add a custom Tauri Android plugin and a manifest-declared
   `ClusterVpnService`; initially implement consent and clean start/stop only.
3. Add the DNS policy loop and tests for domain matching and policy updates.
4. Switch the mobile apply/clear hook to the VPN commands. Keep the desktop
   hook on the current hosts/firewall commands.
5. Test Android lifecycle cases: permission denied, app recreated, service
   stopped by the system, policy update while active, and reboot behavior.