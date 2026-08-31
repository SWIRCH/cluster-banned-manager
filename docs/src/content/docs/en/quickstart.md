---
title: "Quick Start"
description: "Step-by-step guide to installing and configuring Cluster Banned Manager to optimize WoT Blitz"
keywords: "Cluster Banned Manager installation, how to set up WoT Blitz, optimize ping WoT Blitz, block servers Tanks Blitz, install Cluster Banned Manager, WoT Blitz ping settings, how to improve ping in tanks"
date: "2026-08-31"
author: "swirch"
author_link: "https://github.com/SWIRCH"
priority: 100
---

## 📥 Step 1: Download the Application

Choose the appropriate version:

### Windows (Recommended)
1. Go to the [Releases section on GitHub](https://github.com/cluster-banned-manager/releases)
2. Download `clusterbanned_0.1.6_x64-setup.exe`
3. Run the installer and follow the instructions

### Android
1. Go to the [Releases section on GitHub](https://github.com/cluster-banned-manager/releases)
2. Download `cluster-banned-manager.apk`
3. Allow installation from unknown sources in settings
4. Install the application

---

## ⚙️ Step 2: Run with Administrator Privileges

> [!IMPORTANT]
> **For Windows:** In order for server blocking to work, the application **must** be run as administrator.

**How to run:**
- Right-click the shortcut → "Run as administrator"
- Or configure the shortcut to always run with administrator privileges

---

## 🌍 Step 3: Select Region and Server

1. In the main window, select your region: **EU, RU, NA, or ASIA**
2. The application will automatically show the ping to each server:
   - 🟢 **Green:** <50ms — excellent
   - 🟡 **Yellow:** 50-100ms — normal
   - 🔴 **Red:** >100ms — poor

---

## 🔒 Step 4: Configure Server Blocking

1. Check the servers you want to block
2. Click **"Update Block"**
3. The application will automatically:
   - Add entries to the `hosts` file
   - Configure Windows Firewall rules
   - Create a backup of the settings

---

## 🎮 Step 5: Launch the Game

Click the **"Play"** button — the game will launch via Steam or Google Play with the settings already applied.

---

## ❗ Common Problems and Solutions

| Problem | Solution |
| :--- | :--- |
| **Server blocking does not work** | **Reason:** The application is run without administrator privileges.<br>**Solution:** Close the application and run it **as administrator**. |
| **Server pings are not detected** | **Reason:** Firewall or antivirus blocks ICMP requests.<br>**Solution:** Add the application to the exclusions of your firewall or antivirus. |
| **Error when updating hosts file** | **Reason:** The `hosts` file is protected by the system or used by another application.<br>**Solution:** Make sure the application is run as administrator and close other programs that might be using the `hosts` file. |
| **Application does not launch** | **Reason:** .NET Framework 4.8 or higher is missing.<br>**Solution:** Download and install .NET Framework from the official Microsoft website. |

---

## 🔗 Useful Links

- [Download the latest version](https://github.com/cluster-banned-manager/releases)
- [Ping fix using WARP](/docs/warp-fix/)
- [Report an issue](https://github.com/cluster-banned-manager/issues)
- [Source code on GitHub](https://github.com/cluster-banned-manager)