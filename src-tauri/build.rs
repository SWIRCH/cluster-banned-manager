fn main() {
    let mut attrs = tauri_build::Attributes::new();

    if std::env::var("PROFILE").as_deref() == Ok("release") {
        let windows = tauri_build::WindowsAttributes::new()
            .app_manifest(include_str!("installer/windows/app.manifest"));
        attrs = attrs.windows_attributes(windows);
    }

    tauri_build::try_build(attrs).expect("failed to run build script");
}
