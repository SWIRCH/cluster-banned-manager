# build.ps1 - Автоматическая сборка Tauri с выбором целевой платформы

param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "desktop", "android")]
    [string]$Target = ""
)

# 0. Меню выбора, если параметр не передан
if (-not $Target) {
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host " SELECT BUILD TARGET PLATFORM  " -ForegroundColor Cyan
    Write-Host "===============================" -ForegroundColor Cyan
    Write-Host "1) Desktop + Android (All)"
    Write-Host "2) Desktop only"
    Write-Host "3) Android only"
    Write-Host "-------------------------------"
    
    $choice = Read-Host "Enter your choice (1-3)"
    switch ($choice) {
        "1" { $Target = "all" }
        "2" { $Target = "desktop" }
        "3" { $Target = "android" }
        default {
            Write-Host "[ERROR] Invalid selection. Exiting." -ForegroundColor Red
            exit 1
        }
    }
}

# 1. Проверяем, отключен ли DEBUG_MODE в файле конфигурации
$configPath = "src\utils\config.ts"

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    
    if ($configContent -match "DEBUG_MODE\s*:\s*true") {
        Write-Host ""
        Write-Host "[ERROR] DEBUG_MODE is set to TRUE in $configPath!" -ForegroundColor Red
        Write-Host "[ERROR] Please set DEBUG_MODE: false before building release." -ForegroundColor Red
        Write-Host ""
        exit 1
    } else {
        Write-Host "[OK] DEBUG_MODE is disabled." -ForegroundColor Green
    }
} else {
    Write-Host "[WARNING] Config file not found at $configPath" -ForegroundColor Yellow
}

# 2. Читаем версию из tauri.conf.json
$tauriConfigPath = "src-tauri\tauri.conf.json"
$tauriConfig = Get-Content $tauriConfigPath -Raw | ConvertFrom-Json

if (-not $tauriConfig.version) {
    Write-Host "[ERROR] Cannot read version from $tauriConfigPath" -ForegroundColor Red
    exit 1
}

$version = $tauriConfig.version
Write-Host "[INFO] App version: $version" -ForegroundColor Cyan
Write-Host "[INFO] Selected build target: $Target" -ForegroundColor Cyan

# ==========================================
# CБОРКА DESKTOP (выполняется для 'all' и 'desktop')
# ==========================================
if ($Target -eq "all" -or $Target -eq "desktop") {
    Write-Host ""
    Write-Host ">>> STARTING DESKTOP BUILD <<<" -ForegroundColor Green

    # Устанавливаем переменные для подписи
    $privateKeyPath = "$HOME\.tauri\myapp.key"
    $privateKeyPassPath = "$HOME\.tauri\pass.key"

    if (-not (Test-Path $privateKeyPath)) {
        Write-Host "[ERROR] Private key not found: $privateKeyPath" -ForegroundColor Red
        Write-Host "Run: tauri signer generate -- -w `$HOME\.tauri\myapp.key" -ForegroundColor Yellow
        exit 1
    }

    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $privateKeyPath -Raw
    Write-Host "[OK] Private key loaded." -ForegroundColor Green

    if (Test-Path $privateKeyPassPath) {
        $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Get-Content $privateKeyPassPath -Raw
        Write-Host "[OK] Key password loaded." -ForegroundColor Green
    }

    Write-Host "[INFO] Building Desktop app..." -ForegroundColor Green
    bun tauri build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Desktop build failed." -ForegroundColor Red
        exit 1
    }

    Write-Host "[OK] Desktop build successful! Preparing latest.json..." -ForegroundColor Green

    # Поиск .sig файлов
    $bundleDir = "src-tauri\target\release\bundle"
    $sigFiles = Get-ChildItem -Path $bundleDir -Filter *.sig -Recurse

    if ($sigFiles.Count -eq 0) {
        Write-Host "[WARNING] No .sig files found for Desktop." -ForegroundColor Yellow
    } else {
        # Определяем GitHub репозиторий из endpoints
        $githubRepo = ""
        if ($tauriConfig.plugins.updater.endpoints.Count -gt 0) {
            $endpoint = $tauriConfig.plugins.updater.endpoints[0]
            if ($endpoint -match 'github\.com/([^/]+/[^/]+)') {
                $githubRepo = $matches[1]
                Write-Host "[INFO] Detected GitHub repo: $githubRepo" -ForegroundColor Cyan
            }
        }

        # Структура latest.json
        $latestJson = @{
            version = "v$version"
            notes = "Auto-generated update for version $version"
            pub_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            platforms = @{}
        }

        foreach ($sigFile in $sigFiles) {
            $platformKey = ""
            $sigContent = (Get-Content $sigFile.FullName -Raw).Trim()
            $installerFileName = $sigFile.Name -replace '\.sig$', ''
            
            if ($sigFile.FullName -match "\\nsis\\") {
                $platformKey = "windows-x86_64"
                $installerType = "nsis"
            } elseif ($sigFile.FullName -match "\\msi\\") {
                $platformKey = "windows-x86_64-msi"
                $installerType = "msi"
            } elseif ($sigFile.FullName -match "\\app\\") {
                $platformKey = "darwin-x86_64"
                $installerType = "app"
            } elseif ($sigFile.FullName -match "\\appimage\\") {
                $platformKey = "linux-x86_64"
                $installerType = "appimage"
            }
            
            if ($platformKey -ne "") {
                if ($githubRepo -ne "") {
                    $installerUrl = "https://github.com/$githubRepo/releases/download/v$version/$installerFileName"
                } else {
                    $installerUrl = "https://github.com/USER/REPO/releases/download/v$version/$installerFileName"
                }
                
                $latestJson.platforms[$platformKey] = @{
                    signature = $sigContent
                    url = $installerUrl
                }
                Write-Host "  [ADDED] $platformKey ($installerType)" -ForegroundColor Cyan
            }
        }

        # Сохранение latest.json
        $jsonOutput = $latestJson | ConvertTo-Json -Depth 10
        $outputPath = "latest.json"
        $jsonOutput | Out-File -FilePath $outputPath -Encoding UTF8

        Write-Host ""
        Write-Host "[OK] latest.json created!" -ForegroundColor Green
        Write-Host "File: $outputPath" -ForegroundColor Green
    }
}

# ==========================================
# CБОРКА ANDROID (выполняется для 'all' и 'android')
# ==========================================
if ($Target -eq "all" -or $Target -eq "android") {
    Write-Host ""
    Write-Host ">>> STARTING ANDROID BUILD <<<" -ForegroundColor Green
    
    # Собираем APK
    bun tauri android build --apk

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Android build failed." -ForegroundColor Red
        exit 1
    }

    # 1. Гарантируем получение $githubRepo, даже если Desktop блок не запускался
    if (-not $githubRepo) {
        if ($tauriConfig.plugins.updater.endpoints.Count -gt 0) {
            $endpoint = $tauriConfig.plugins.updater.endpoints[0]
            if ($endpoint -match 'github\.com/([^/]+/[^/]+)') {
                $githubRepo = $matches[1]
            }
        }
    }

    # 2. Читаем или создаем новыйlatest.json
    if (Test-Path "latest.json") {
        $latestJson = Get-Content "latest.json" -Raw | ConvertFrom-Json
    } else {
        $latestJson = [PSCustomObject]@{
            version   = "v$version"
            notes     = "Auto-generated update for version $version"
            pub_date  = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
            platforms = [PSCustomObject]@{}
        }
    }

    # 3. Формируем URL для APK
    if ($githubRepo) {
        $apkUrl = "https://github.com/$githubRepo/releases/download/v$version/app-universal-release.apk"
    } else {
        $apkUrl = "https://github.com/SWIRCH/cluster-banned-manager/releases/download/v$version/app-universal-release.apk"
    }

    # 4. Добавляем ключ android
    if (-not $latestJson.platforms) {
        $latestJson | Add-Member -MemberType NoteProperty -Name "platforms" -Value ([PSCustomObject]@{})
    }
    
    $latestJson.platforms | Add-Member -MemberType NoteProperty -Name "android" -Value ([PSCustomObject]@{ url = $apkUrl }) -Force

    # 5. Сохраняем обратно в file
    $latestJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "latest.json" -Encoding UTF8
    Write-Host "[ADDED] Android platform to latest.json" -ForegroundColor Cyan

    $androidApkDir = "src-tauri\gen\android\app\build\outputs\apk\universal\release"
    Write-Host "[OK] Android build successful!" -ForegroundColor Green
    Write-Host "[INFO] Signed APK directory: $androidApkDir" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " ALL REQUESTED BUILDS COMPLETED SUCCESSFULLY! " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green