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

**Управление подключением к игровым серверам World of Tanks Blitz и Tanks Blitz.<br> Блокировка нежелательных кластеров на сетевом уровне для Windows и Android.**

</div>

> [!TIP]
> **Платформенные особенности:**
>
> 1. **Windows**: Поддерживает блокировку через системный файл `hosts` и правила **Windows Firewall** (требуются права администратора).
> 2. **Android**: Использован архитектурный подход на базе **VpnService / Локального файрвола**, блокирующий подключение к IP-адресам нежелательных серверов на лету без необходимости получения Root-прав.

> [!IMPORTANT]
> Если у вас есть проблемы с пингом или высокий loss, прочитайте статью [WARP FIX](https://cbmwot.vercel.app/docs/ru/warp-fix/)

## 🌎 Переводы/Translations

- [Russian](/README.md)
- [English](/README_EN.md)

## 📋 Содержание

- [🌟 Возможности](#возможности)
- [🎮 Поддерживаемые регионы](#поддерживаемые-регионы)
- [⚙️ Использование](#использование)
- [🛠 Технологии](#технологии)
- [🚀 Поддержка проекта](#поддержка-проекта)
- [⚖️ Лицензирование](#лицензирование)

## Возможности

### 🎯 Основные функции

- **Умная блокировка серверов** — выборочное отключение нежелательных игровых кластеров.
- **Кроссплатформенность** — полноценная работа на **Windows 10/11** и **Android** (APK).
- **Двойная защита (Windows)** — комбинированная блокировка через `hosts` и Windows Firewall.
- **Локальный VPN-файрвол (Android)** — эффективное фильтрование трафика без Root-прав.
- **Ping-мониторинг** — проверка задержки до серверов в реальном времени.
- **Автоматическая синхронизация** — поддержание актуального состояния блокировок при перезапуске.

### 🛡 Механизмы блокировки

1. **Windows**: Брандмауэр Windows (IP-level) + Hosts-файл (домены).
2. **Android**: Системный интерфейс `VpnService` для перехвата и фильтрации целевых IP-пакетов.

### 🎨 Интерфейс

![ClasterBanned](/public/app_interface_1.png)

- **Адаптивный UI** — единый стильный интерфейс под ПК и мобильные устройства.
- **Мультирегиональность** — поддержка всех серверов WoT Blitz (EU, NA, APAC) и Tanks Blitz (RU/Lesta).
- **Статус в реальном времени** — наглядные индикаторы активных подсистем и серверов.

## Поддерживаемые регионы

|                                                                                         | Регион               | Серверы    | Локация                               | IP Адреса                           |
| --------------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------------------------- | ----------------------------------- |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/eu.svg" width="32" /> | **Европа**           | 5 серверов | Амстердам, Франкфурт, Варшава, Алматы | [Список IP](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/ru.svg" width="32"/>  | **Россия**           | 6 серверов | Москва, Красноярск, Екатеринбург      | [Список IP](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/jp.svg" width="32" /> | **Азия**             | 3 сервера  | Сингапур, Токио                       | [Список IP](/src/data/servers.json) |
| <img src="https://github.com/lipis/flag-icons/blob/main/flags/4x3/us.svg" width="32" /> | **Северная Америка** | 3 сервера  | Чикаго, Вирджиния, Калифорния         | [Список IP](/src/data/servers.json) |

## Использование

### 💻 Windows
1. Скачайте `.exe` или `.msi` установщик со [страницы последнего релиза](https://github.com/SWIRCH/cluster-banned-manager/releases).
2. Установите и запустите приложение от имени администратора.
3. Выберите игровой регион и заблокируйте нежелательные сервера.

### 📱 Android
1. Скачайте `.apk` файл со [страницы релиза](https://github.com/SWIRCH/cluster-banned-manager/releases).
2. Разрешите установку из неизвестных источников при запросе системы.
3. Откройте приложение, выберите сервера и разрешите создание локального VPN-подключения (необходимо для работы файрвола).

> [!IMPORTANT]
> Белый индикатор в списке у сервера означает, что он включен и доступен для подключения.

## Собираем приложение сами

Требования:

1. **Node.js** 18+ и **bun**
2. **Rust** и **Cargo**
3. **Android SDK / NDK** *(только для сборки Android версии)*
4. **Visual Studio Build Tools** *(для Windows)*

```bash
# Клонирование репозитория
git clone https://github.com/SWIRCH/cluster-banned-manager.git
cd cluster-banned-manager

# Установка зависимостей
bun install

# Запуск в режиме разработки
bun tauri dev

# Сборка релизной версии
bun tauri build
```

## Технологии

### ♟ Backend (Rust/Tauri)

1. **Tauri 2.x** - современный фреймворк для создания desktop-приложений
2. **Rust** - безопасный и производительный системный язык
3. **Windows Firewall API** - прямое управление правилами брандмауэра
4. **Файловая система** - работа с системными файлами (hosts)

### 🗺 Frontend (TypeScript/React)

1. **React 19** - библиотека для построения пользовательских интерфейсов
2. **TypeScript** - типизированный JavaScript
3. **Tailwind CSS** - утилитарный CSS-фреймворк
4. **Framer Motion** - библиотека анимаций
5. **Headless UI** - доступные UI-компоненты

## Поддержка проекта

Вы можете поддержать проект, поставив :star: этому репозиторию (сверху справа этой страницы)

## Лицензирование

Проект распространяется на условиях лицензии ⚖️ [GPL-2.0](https://github.com/SWIRCH/cluster-banned-manager/blob/main/LICENSE)
