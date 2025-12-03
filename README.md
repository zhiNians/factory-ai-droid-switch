<p align="center">
  <img src="public/logo.svg" alt="Droid Switch Logo" width="120" height="120">
</p>

<h1 align="center">Droid Switch</h1>

<p align="center">
  <strong>A modern desktop application for managing Factory AI API Keys</strong>
</p>

<p align="center">
  <a href="./README_CN.md">中文文档</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/version-0.1.0-orange" alt="Version">
</p>

---

## Overview

Droid Switch is a cross-platform desktop application built with Tauri and React that simplifies the management of multiple Factory AI API keys. It provides a seamless experience for switching between API keys, checking balances, and managing environment variables.

## Features

- **Multi-Key Management** - Add, delete, and organize multiple API keys
- **One-Click Switching** - Instantly activate any API key
- **Balance Monitoring** - Real-time quota usage and remaining balance display
- **Batch Import** - Import multiple API keys at once
- **Model Selection** - Choose from built-in or custom AI models with configurable reasoning levels
- **Configuration Management** - Automatic Factory config file management
- **System Tray** - Quick access from system tray with context menu
- **Cross-Platform** - Native support for Windows, macOS, and Linux
- **Modern UI** - Clean, responsive interface built with React 19 and Tailwind CSS

## Screenshots

<p align="center">
  <img src=".github/images/screenshots/main-interface.png" alt="Main Interface" width="800">
  <br>
  <em>Main Interface - API Key Management</em>
</p>

## Installation

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended)
  ```bash
  npm install -g pnpm
  ```
- **Rust** 1.70 or higher
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### Build from Source

```bash
# Clone the repository
git clone https://github.com/zhiNians/factory-ai-droid-switch.git
cd factory-ai-droid-switch

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

The built application will be located in `src-tauri/target/release/bundle/`.

### Download Pre-built Binaries

> Pre-built binaries will be available in the [Releases](https://github.com/zhiNians/factory-ai-droid-switch/releases) page.

## Usage

### Managing API Keys

1. **Add a Key** - Click the "Add Key" button, enter a name and your API key
2. **Activate a Key** - Click "Activate" on any key card to set it as the current key
3. **Deactivate** - Click "Deactivate" to clear the active key
4. **Delete** - Click the delete button to remove a key

### Batch Import

1. Click "Batch Import"
2. Enter a name prefix (e.g., "Key")
3. Paste one API key per line
4. Click "Import"

Keys will be named automatically (e.g., "Key 1", "Key 2", etc.)

### Model Selection

- Use the model selector in the top navigation to choose your preferred AI model
- Configure reasoning levels (Off, Low, Medium, High) for each model
- Add custom models through the model management interface

### How It Works

Droid Switch manages API keys by:
1. Writing the active API key to `~/.factory/config.json`
2. Installing a shell wrapper function that automatically loads the key when running `droid` commands

No manual environment variable configuration is needed - simply activate a key and restart your `droid` session.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Lucide React Icons
- Framer Motion

### Backend
- Rust
- Tauri 2.x
- reqwest (HTTP client)
- serde_json

## Project Structure

```
factory-ai-droid-switch/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/                # Rust source code
│   └── tauri.conf.json     # Tauri configuration
├── public/                 # Static assets
└── package.json            # Dependencies
```

## Configuration

Configuration file location:
- **Windows**: `C:\Users\{username}\.factory-ai-droid-switch\config.json`
- **macOS**: `/Users/{username}/.factory-ai-droid-switch/config.json`
- **Linux**: `/home/{username}/.factory-ai-droid-switch/config.json`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop application framework
- [React](https://react.dev/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library
- [Factory AI](https://factory.ai/) - API service provider

---

<p align="center">Made with ❤️ by <a href="https://github.com/zhiNians">zhiNian</a></p>
