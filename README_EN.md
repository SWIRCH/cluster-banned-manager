# <img src="/public/clusterbanned.png" height="34" /> Cluster Banned Manager

![ClasterBanned](/public/banner.png)

<div align="center">
  
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-f472b8?style=for-the-badge&logo=bun&logoColor=White)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)

**Management of connections to World of Tanks Blitz game servers. <br> By hard-blocking connections to clusters at the firewall level.**

</div>

> [!TIP]
> The program supports two blocking modes: **basic** (via hosts file) and **advanced** (via Windows Firewall).
>
> 1. Basic mode works with **any system settings**.
> 2. Advanced level (Windows Firewall) automatically activates if the **firewall is enabled**. It creates special rules for **hard blocking** at the network level.
>
> Recommendation: Ensure that **Windows Firewall is enabled** to utilize both protection levels.

## 🌎 Translations

- [Russian](/README.md)
- [English](/README_EN.md)

## 📋 Table of Contents

- [🌟 Features](#features)
- [🎮 Supported Regions](#supported-regions)
- [⚙️ Usage](#usage)
- [🛠 Technologies](#technologies)
- [🚀 Project Support](#project-support)
- [⚖️ Licensing](#licensing)

## Features

### 🎯 Core Functions

- **Smart Server Blocking** - selective disabling of unwanted game clusters
- **Dual Protection** - combined blocking via hosts file and Windows Firewall
- **Automatic Synchronization** - maintaining consistency between settings and actual system state
- **Backup System** - creating backups of hosts file with configurable number of stored versions
- **Ping Monitoring** - checking latency to servers for optimal connection selection

### 🛡 Blocking Levels

1. **Hosts File** - traditional domain redirection method
2. **Windows Firewall** - network-level blocking by IP addresses (more reliable)
3. **Combined Mode** - simultaneous application of both methods

### 🎨 Interface

![ClasterBanned](/public/app_interface_1.png)

- **Intuitive UI** - modern interface with animation support
- **Multi-regional Support** - support for all WoT Blitz game regions
- **Themes & Wallpapers** - random wallpapers of game events
- **Real-time Status** - monitoring of blocking status and network latency

## Supported Regions

|                                                                                         | Region            | Servers   | Location                             | IP Addresses                      |
| --------------------------------------------------------------------------------------- | ----------------- | --------- | ------------------------------------ | --------------------------------- |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/eu.svg" width="32" /> | **Europe**        | 5 servers | Amsterdam, Frankfurt, Warsaw, Almaty | [IP List](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/ru.svg" width="32"/>  | **Russia**        | 6 servers | Moscow, Krasnoyarsk, Yekaterinburg   | [IP List](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/jp.svg" width="32" /> | **Asia**          | 3 servers | Singapore, Tokyo                     | [IP List](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/us.svg" width="32" /> | **North America** | 3 servers | Chicago, Virginia, California        | [IP List](/src/data/servers.json) |

## Usage

1. Download the installer from the [latest release page](https://github.com/SWIRCH/cluster-banned-manager/releases)
2. Go through the application installation process
3. Run the application as administrator to access system files
4. Select a game region in the top menu
5. Configure the desired servers for blocking
> [!IMPORTANT]
> A white indicator in the server list means it is enabled and available for connection.

## Building the Application Yourself

Requirements:

1. **Windows 10/11** (64-bit)
2. **Node.js** 18+ and **bun**
3. **Rust** and **Cargo**
4. **Visual Studio Build Tools** (for Windows)

```bash
# Clone repository
git clone https://github.com/SWIRCH/cluster-banned-manager.git
cd cluster-banned-manager

# Install dependencies
bun install

# Run in development mode
bun tauri dev

# Build release version
bun tauri build
```

## Technologies

### ♟ Backend (Rust/Tauri)

1. **Tauri 2.x** - modern framework for creating desktop applications
2. **Rust** - safe and performant system language
3. **Windows Firewall API** - direct management of firewall rules
4. **File System** - working with system files (hosts)

### 🗺 Frontend (TypeScript/React)

1. **React 18** - library for building user interfaces
2. **TypeScript** - typed JavaScript
3. **Tailwind CSS** - utility-first CSS framework
4. **Framer Motion** - animation library
5. **Headless UI** - accessible UI components

## Project Support

You can support the project by giving this repository a :star: (top right of this page)

## Licensing

The project is distributed under the ⚖️ [GPL-2.0](https://github.com/SWIRCH/cluster-banned-manager/blob/main/LICENSE) license
