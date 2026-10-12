$ErrorActionPreference = 'Stop'

function Step($name, $script) {
    Write-Host ""
    Write-Host "==> $name" -ForegroundColor Cyan
    & $script
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $name" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Push-Location $PSScriptRoot
try {
    Step "bun install"    { bun install --frozen-lockfile }
    Step "tsc --noEmit"   { bun run tsc --noEmit }
    Step "bun run build"  { bun run build }
}
finally {
    Pop-Location
}

Push-Location $PSScriptRoot\src-tauri
try {
    Step "cargo fmt --check" { cargo fmt --check }
    Step "cargo check"       { cargo check --all-targets }
    Step "cargo test"        { cargo test }
    Step "cargo clippy"      { cargo clippy -- -D warnings }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "All checks passed." -ForegroundColor Green