---
title: "Complete Guide to the hosts File and How It Affects Games"
description: "Detailed guide to the hosts file: what it is, where it is located, how it affects games, how to block servers, and why Cluster Banned Manager uses hosts + firewall."
keywords: "hosts file WoT Blitz, blocking servers hosts, how to block a server via hosts, Cluster Banned Manager hosts, Windows firewall game blocking, ping optimization hosts"
date: "2026-08-31"
author: "swirch"
author_link: "https://github.com/SWIRCH"
priority: 10
---

The `hosts` file is one of the most underrated tools in Windows. It exists on every computer, but few people know how it works and how it can help in games. In this article, I will tell you everything you need to know about the hosts file, how it affects connection to game servers, and why in **Cluster Banned Manager** I use it together with the Windows Firewall.

---

## 📁 What is the hosts file and where is it located

**The hosts file** is a text file without an extension that stores the mapping between domain names (for example, `https://wotblitz.com`) and IP addresses (for example, `185.46.146.190`).

**Where it is located:**
`C:\Windows\System32\drivers\etc\hosts`

**How it works:**
When you enter a website address in a browser or a game connects to a server, the computer first checks the hosts file. If there is an entry for this domain, the computer uses the specified IP address. If there is no entry, it contacts a DNS server (usually provided by your ISP or Google/Cloudflare).

| Request Route Stage | Action / Result |
| :--- | :--- |
| **1. Initialization** | The game requests the server → The `hosts` file is checked |
| **2. If entry is found** | Uses the IP address specified in the `hosts` file |
| **3. If entry is missing** | The system contacts an external DNS server |

---

## 🎮 How the hosts file affects games

### 1. Connection Speedup

If you know the IP address of the game server and add it to hosts, the computer will not waste time requesting the DNS server. The savings are fractions of a second, but in games this can be noticeable.

### 2. Server Blocking (The main feature of Cluster Banned Manager)

If you add an entry that redirects a domain to a non-existent address or to `127.0.0.1` (local computer), the game **will not be able to connect to this server**. This allows you to:

- **Block problem servers** with high ping or packet loss
- **Force connection to the nearest cluster** (for example, only to RU servers)
- **Get rid of "teleports" and lags** caused by switching between servers

**Example entry in hosts:**
```bash
# Blocking a server with bad ping
0.0.0.0 login1.wotblitz.com
0.0.0.0 login2.wotblitz.com
0.0.0.0 login3.wotblitz.com
0.0.0.0 login4.wotblitz.com
```

### 3. Traffic Redirection

Some players use hosts to redirect to other IP addresses (for example, to connect to a server through a proxy). But this is a more complex scenario.

---

## 🔥 Why I use hosts + firewall in Cluster Banned Manager

Using the `hosts` file alone **is not always enough**. That is why I added Windows Firewall management to the application as well.

### Problems with using only hosts:

| Problem | Why this happens |
|---|---|
| **Ignoring hosts** | WoT Blitz uses non-standard ports or bypasses the system DNS |
| **DNS Caching** | Windows may ignore changes in hosts until a reboot |
| **DNS Spoofing at ISP level** | Some ISPs block requests to DNS and substitute their own |

### How the firewall solves these problems:

**Windows Firewall** blocks the connection at the **network level**, before the request reaches the DNS or the server.

| Blocking Method | How it works and features |
|---|---|
| **1. Blocking via hosts** | • Adds the entry `0.0.0.0 domain.com`<br>• Works for most cases |
| **2. Blocking via firewall** *(additional protection)* | • Creates an outbound connection blocking rule<br>• Blocks at the network level, bypassing DNS<br>• Works even if hosts is ignored |

### How it works in the application code:

```rust
// Example from Cluster Banned Manager (simplified)

// 1. Blocking via hosts
fn block_via_hosts(domain: &str) {
    let hosts_path = r"C:\Windows\System32\drivers\etc\hosts";
    let entry = format!("0.0.0.0 {}\n", domain);
    // Add entry to the end of the file
    append_to_file(hosts_path, &entry);
}

// 2. Blocking via firewall (optional)
fn block_via_firewall(domain: &str) {
    // Create a rule in Windows Firewall
    let command = format!(
        "netsh advfirewall firewall add rule name=\"ClusterBanned_{}\" dir=out action=block remoteip={}",
        domain, domain
    );
    // Run command as administrator
    execute_as_admin(&command);
}
```

## 🛠️ How to use the hosts file manually

### Step 1: Open hosts as Administrator

1. Press `Win + R`, type `notepad`
2. Press `Ctrl + Shift + Enter` (run as administrator)
3. In Notepad: `File → Open`
4. Go to `C:\Windows\System32\drivers\etc\`
5. Select **"All Files"** in the file type filter
6. Open the `hosts` file

### Step 2: Add an entry to block

At the end of the file, add lines:

```bash
# Blocking WoT Blitz servers with bad ping
0.0.0.0 login1.wotblitz.com
0.0.0.0 login2.wotblitz.com
0.0.0.0 login3.wotblitz.com
0.0.0.0 login4.wotblitz.com
```

### Step 3: Save and Flush DNS

1. `Ctrl + S` — save the file
2. Restart your computer or run the command:

```cmd
ipconfig /flushdns
```

# ⚠️ Caution! What can go wrong

| Problem | Solution |
| :--- | :--- |
| hosts is not saving | Run notepad as administrator |
| Changes are not applied | Run `ipconfig /flushdns` in the command prompt |
| The game does not start | Check if you blocked the main authentication server |
| Is my account banned? | No, server blocking does not affect the account, this is not cheats |

## 🔗 Why Cluster Banned Manager is the best solution
Instead of messing around with manual hosts editing, I created an application that does everything automatically:

* **✅ Automatic server choice** — shows ping to each server in real time
* **✅ One-click blocking** — check the problematic servers and click "Update Block"
* **✅ Double blocking** — hosts + firewall for maximum reliability
* **✅ Backup copies** — automatic backup creation before making changes
* **✅ Game launch** — quick launch of WoT Blitz after applying settings

## 📌 What is important to remember
* **✅ The hosts file** is a simple and effective way to manage connections
* **✅ It allows you to block specific servers**, reducing ping and packet loss
* **✅ Using the firewall** solves problems when hosts does not work
* **✅ Cluster Banned Manager** automates the entire process, making it safe and simple

## 🔗 Useful Links
* [Download Cluster Banned Manager](#)
* [How to improve ping with WARP](#)
* [Official hosts documentation from Microsoft](#)

**Summary:** the hosts file is a powerful tool for managing server connections. And with Cluster Banned Manager, you get this tool in a convenient interface with additional blocking through the firewall for maximum reliability. 🚀