# Changelog

所有值得注意的项目变更将记录在此文件中。

本文档遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 格式，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- **模型管理功能**
  - 内置 6 个官方支持的 Factory AI 模型
    - Claude Sonnet 4.5 (默认, Medium 推理)
    - GPT-5 Codex (Medium 推理)
    - Claude Haiku 4.5 (Low 推理)
    - Droid Core (GLM-4.6) (Low 推理)
    - GPT-5 (Medium 推理)
    - Claude Opus 4.1 (High 推理)
  - 支持添加自定义模型
  - 模型选择器界面,可快速切换模型
  - 模型管理界面,可添加/删除自定义模型
  - 自动更新 Factory 配置文件 (`~/.factory/config.json`)
  - 选择的模型会在下次启动 Factory CLI 时自动生效
- **推理级别(Reasoning Level)管理**
  - 支持四种推理级别: Off, Low, Medium, High
  - 每个模型可独立配置推理级别
  - 推理级别徽章颜色编码 (Off=灰, Low=蓝, Medium=绿, High=紫)
  - 在模型管理界面直接切换推理级别
  - 添加自定义模型时可指定推理级别

### 修改
- 扩展应用配置结构,增加模型配置字段
- 优化顶部导航栏布局,集成模型选择器
- 模型选择器下拉菜单显示推理级别徽章

### 修复
- 修复模型和推理级别切换后不生效的问题（React 状态更新时序问题）
- **[严重]** 修复 Windows 上 PowerShell/CMD wrapper 硬编码 droid.exe 路径导致命令失效的问题
- PowerShell wrapper 现在只匹配 .exe 文件，避免找到 .cmd 导致递归
- 添加 wrapper 版本控制，旧版本会自动更新为新版本
- Windows CMD 现在自动将 `%USERPROFILE%\.factory\bin` 添加到用户 PATH（无需手动配置）

## [0.1.0] - 2024-12-01

### 新增
- 多密钥管理功能，支持添加、删除、切换多个 Factory AI API Keys
- 一键切换当前激活的 API Key
- 实时余额查询功能，支持单个和批量查询
- 批量导入 API Keys 功能
- 自动环境变量管理（`Factory_API_Key`）
  - Windows: 注册表持久化（`HKCU\Environment`）
  - macOS/Linux: Shell 配置文件管理（`.bashrc`、`.zshrc`、`.profile`）
- 系统托盘功能，支持托盘菜单快速切换密钥
- 现代化 UI 界面（React 19 + Tailwind CSS v4）
- 跨平台支持（Windows、macOS、Linux）
- 完整的错误处理和用户提示
- 配置文件自动管理（`~/.factory-ai-droid-switch/config.json`）
- 密钥余额信息展示
  - 已使用额度
  - 总配额
  - 使用百分比
  - 剩余额度
  - 到期时间
- 确认对话框（删除密钥等危险操作）

### 技术栈
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **后端**: Rust + Tauri 2.x
- **图标库**: Lucide React
- **HTTP 客户端**: reqwest
- **JSON 处理**: serde_json

### 已知问题
- 环境变量设置后可能需要重启终端或应用才能生效
- 批量导入时如果 API Key 格式错误会静默跳过

---

## 版本说明

### 语义化版本格式

- **主版本号**（Major）：不兼容的 API 修改
- **次版本号**（Minor）：向下兼容的功能性新增
- **修订号**（Patch）：向下兼容的问题修正

### 变更类型

- **新增（Added）**：新功能
- **修改（Changed）**：对现有功能的变更
- **弃用（Deprecated）**：即将删除的功能
- **移除（Removed）**：已删除的功能
- **修复（Fixed）**：Bug 修复
- **安全（Security）**：安全性相关的修复
