$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot\src-tauri

function Step($name, $script) {
    Write-Host ""
    Write-Host "==> $name" -ForegroundColor Cyan
    & $script
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $name" -ForegroundColor Red
        Pop-Location
        exit $LASTEXITCODE
    }
}

try {
    Step "cargo fmt --check" { cargo fmt --check }
    Step "cargo check"       { cargo check --all-targets }
    Step "cargo test"        { cargo test }
    Step "cargo clippy"      { cargo clippy -- -D warnings }

    Write-Host ""
    Write-Host "All checks passed." -ForegroundColor Green
}
finally {
    Pop-Location
}