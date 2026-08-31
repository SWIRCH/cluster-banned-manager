# <img src="/public/clusterbanned.png" height="34" /> Cluster Banned Manager

![ClasterBanned](/public/banner.png)

<div align="center">
  
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-f472b8?style=for-the-badge&logo=bun&logoColor=White)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

**Manage connections to World of Tanks Blitz and Tanks Blitz game servers.<br> Block unwanted clusters at the network level for Windows and Android.**

</div>

> [!TIP]
> **Platform Features:**
>
> 1. **Windows**: Supports blocking via the system `hosts` file and **Windows Firewall** rules (requires administrator privileges).
> 2. **Android**: Uses an architectural approach based on **VpnService / Local Firewall**, blocking connections to unwanted server IP addresses on the fly without requiring Root access.

> [!IMPORTANT]
> If you experience high ping or packet loss, check out the [WARP FIX guide](https://swirch.github.io/cluster-banned-manager/docs/en/warp-fix/).

## 🌎 Translations

- [Russian](/README.md)
- [English](/README_EN.md)

## 📋 Table of Contents

- [🌟 Features](#features)
- [🎮 Supported Regions](#supported-regions)
- [⚙️ Usage](#usage)
- [🛠 Tech Stack](#tech-stack)
- [🚀 Support the Project](#support-the-project)
- [⚖️ License](#license)

## Features

### 🎯 Key Functions

- **Smart Server Blocking** — Selectively disable unwanted game clusters.
- **Cross-Platform** — Full support for **Windows 10/11** and **Android** (APK).
- **Dual Protection (Windows)** — Combined blocking via the `hosts` file and Windows Firewall.
- **Local VPN Firewall (Android)** — Efficient traffic filtering without Root access.
- **Ping Monitoring** — Real-time ping checks to all servers.
- **Automatic Sync** — Keeps server block states in sync upon app restart.

### 🛡 Blocking Mechanisms

1. **Windows**: Windows Firewall (IP-level) + Hosts file (domain-level).
2. **Android**: System `VpnService` interface to intercept and filter target IP packets.

### 🎨 Interface

![ClasterBanned](/public/app_interface_1.png)

- **Adaptive UI** — Modern unified interface for both PC and mobile devices.
- **Multi-Region Support** — Covers all WoT Blitz (EU, NA, APAC) and Tanks Blitz (RU/Lesta) servers.
- **Real-time Status** — Visual indicators for active subsystems and server statuses.

## Supported Regions

|                                                                                         | Region               | Servers   | Location                              | IP Addresses                        |
| --------------------------------------------------------------------------------------- | -------------------- | --------- | ------------------------------------- | ----------------------------------- |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/eu.svg" width="32" /> | **Europe**           | 5 servers | Amsterdam, Frankfurt, Warsaw, Almaty  | [IP List](/src/data/servers.json)   |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/ru.svg" width="32"/>  | **Russia (Lesta)**   | 6 servers | Moscow, Krasnoyarsk, Yekaterinburg    | [IP List](/src/data/servers.json)   |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/jp.svg" width="32" /> | **Asia**             | 3 servers | Singapore, Tokyo                      | [IP List](/src/data/servers.json)   |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/us.svg" width="32" /> | **North America**    | 3 servers | Chicago, Virginia, California         | [IP List](/src/data/servers.json)   |

## Usage

### 💻 Windows
1. Download the `.exe` or `.msi` installer from the [latest release page](https://github.com/SWIRCH/cluster-banned-manager/releases).
2. Install and launch the application as Administrator.
3. Select your game region and block unwanted servers.

### 📱 Android
1. Download the `.apk` file from the [latest release page](https://github.com/SWIRCH/cluster-banned-manager/releases).
2. Allow installation from unknown sources when prompted by the system.
3. Open the app, select the servers to block, and grant permission to set up a local VPN connection (required for firewall operation).

> [!IMPORTANT]
> A white indicator next to a server in the list means it is enabled and available for connection.

## Building from Source

Requirements:

1. **Node.js** 18+ and **bun**
2. **Rust** and **Cargo**
3. **Android SDK / NDK** *(only required for building the Android APK)*
4. **Visual Studio Build Tools** *(for Windows)*

```bash
# Clone the repository
git clone [https://github.com/SWIRCH/cluster-banned-manager.git](https://github.com/SWIRCH/cluster-banned-manager.git)
cd cluster-banned-manager

# Install dependencies
bun install

# Run in development mode (Desktop)
bun tauri dev

# Build release version for Windows
bun tauri build

# Build release version for Android (APK)
bun tauri android build
```

## Technologies

### ♟ Backend (Rust/Tauri)

1. **Tauri 2.x** - modern framework for creating desktop applications
2. **Rust** - safe and performant system language
3. **Windows Firewall API** - direct management of firewall rules
4. **File System** - working with system files (hosts)

### 🗺 Frontend (TypeScript/React)

1. **React 19** - library for building user interfaces
2. **TypeScript** - typed JavaScript
3. **Tailwind CSS** - utility-first CSS framework
4. **Framer Motion** - animation library
5. **Headless UI** - accessible UI components

## Project Support

You can support the project by giving this repository a :star: (top right of this page)

## Licensing

The project is distributed under the ⚖️ [GPL-2.0](https://github.com/SWIRCH/cluster-banned-manager/blob/main/LICENSE) license
