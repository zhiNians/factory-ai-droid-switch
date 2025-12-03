use serde::Deserialize;
use serde_json::Value;
use crate::models::BalanceInfo;

/// Factory.ai API 响应结构
#[derive(Debug, Deserialize)]
struct FactoryApiResponse {
    usage: Usage,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Usage {
    standard: StandardUsage,
    #[serde(rename = "endDate")]
    end_date: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StandardUsage {
    user_tokens: u64,
    total_allowance: u64,
    org_overage_used: u64,
    used_ratio: f64,
}

/// 设置 Factory API Key（写入 ~/.factory/config.json）
/// 
/// 更新配置文件并安装 shell 包装函数。
/// shell 函数会在每次执行 droid 时从配置文件读取 api_key。
/// 这样切换 key 后只需重启 droid 即可生效，无需重启终端。
pub fn set_factory_api_key_env(api_key: &str) -> Result<(), String> {
    // 写入配置文件
    set_factory_config_api_key(api_key)?;
    
    // 安装 shell 包装函数（如果尚未安装）
    if let Err(e) = install_shell_wrapper() {
        log::warn!("安装 shell 包装函数失败: {}", e);
    }
    
    Ok(())
}

/// 清除 Factory API Key（从 ~/.factory/config.json 移除）
/// 
/// 只更新配置文件，不清除系统环境变量。
pub fn clear_factory_api_key_env() -> Result<(), String> {
    clear_factory_config_api_key()
}

/// 获取 ~/.factory/config.json 的路径
fn get_factory_config_path() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    Ok(home.join(".factory").join("config.json"))
}

/// 设置 ~/.factory/config.json 中的 api_key
fn set_factory_config_api_key(api_key: &str) -> Result<(), String> {
    let config_path = get_factory_config_path()?;
    
    // 确保 .factory 目录存在
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("创建 .factory 目录失败: {}", e))?;
    }

    // 读取现有配置或创建新配置
    let mut config: Value = if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("读取 config.json 失败: {}", e))?;
        serde_json::from_str(&content).unwrap_or_else(|_| serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // 更新 api_key 字段
    if let Some(obj) = config.as_object_mut() {
        obj.insert("api_key".to_string(), serde_json::json!(api_key));
    }

    // 写入配置文件
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化 config.json 失败: {}", e))?;
    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入 config.json 失败: {}", e))?;

    log::info!("已更新 ~/.factory/config.json 中的 api_key");
    Ok(())
}

/// 清除 ~/.factory/config.json 中的 api_key
fn clear_factory_config_api_key() -> Result<(), String> {
    let config_path = get_factory_config_path()?;
    
    if !config_path.exists() {
        log::info!("~/.factory/config.json 不存在，无需清除");
        return Ok(());
    }

    // 读取现有配置
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取 config.json 失败: {}", e))?;
    let mut config: Value = serde_json::from_str(&content)
        .unwrap_or_else(|_| serde_json::json!({}));

    // 移除 api_key 字段
    if let Some(obj) = config.as_object_mut() {
        obj.remove("api_key");
    }

    // 写入配置文件
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化 config.json 失败: {}", e))?;
    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入 config.json 失败: {}", e))?;

    log::info!("已清除 ~/.factory/config.json 中的 api_key");
    Ok(())
}

/// 安装 shell 包装函数
/// 
/// 在 shell 配置文件中添加 droid 函数，每次执行时自动从 config.json 读取 api_key
fn install_shell_wrapper() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        install_windows_wrapper()
    }

    #[cfg(not(target_os = "windows"))]
    {
        install_unix_wrapper()
    }
}

/// Unix: 安装 shell 包装函数到 .zshrc 和 .bashrc
#[cfg(not(target_os = "windows"))]
fn install_unix_wrapper() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    
    let shell_function = r#"
# factory-ai-droid-switch Wrapper Start
# 此函数由 factory-ai-droid-switch 自动生成，用于动态加载 API Key
droid() {
    local api_key=""
    local config_file="$HOME/.factory/config.json"
    if [ -f "$config_file" ]; then
        api_key=$(grep -o '"api_key"[[:space:]]*:[[:space:]]*"[^"]*"' "$config_file" 2>/dev/null | sed 's/.*"api_key"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    fi
    if [ -n "$api_key" ]; then
        FACTORY_API_KEY="$api_key" command droid "$@"
    else
        command droid "$@"
    fi
}
# factory-ai-droid-switch Wrapper End"#;

    let marker_start = "# factory-ai-droid-switch Wrapper Start";

    let shell_configs = vec![
        home.join(".zshrc"),
        home.join(".bashrc"),
    ];

    for config_path in shell_configs {
        if config_path.exists() {
            match std::fs::read_to_string(&config_path) {
                Ok(content) => {
                    // 检查是否已安装
                    if content.contains(marker_start) {
                        log::info!("shell 包装函数已存在于: {}", config_path.display());
                        continue;
                    }

                    // 添加 shell 函数
                    let new_content = format!("{}\n{}\n", content.trim_end(), shell_function);
                    std::fs::write(&config_path, new_content)
                        .map_err(|e| format!("写入 {} 失败: {}", config_path.display(), e))?;

                    log::info!("已安装 shell 包装函数到: {}", config_path.display());
                }
                Err(e) => {
                    log::warn!("读取 {} 失败: {}", config_path.display(), e);
                }
            }
        }
    }

    Ok(())
}

/// Windows: 安装 PowerShell 函数和 CMD 批处理文件
#[cfg(target_os = "windows")]
fn install_windows_wrapper() -> Result<(), String> {
    // 安装 PowerShell 函数
    if let Err(e) = install_powershell_wrapper() {
        log::warn!("安装 PowerShell 包装函数失败: {}", e);
    }
    
    // 安装 CMD 批处理文件
    if let Err(e) = install_cmd_wrapper() {
        log::warn!("安装 CMD 批处理文件失败: {}", e);
    }
    
    Ok(())
}

/// Windows: 安装 PowerShell 包装函数到 $PROFILE
#[cfg(target_os = "windows")]
fn install_powershell_wrapper() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    
    // PowerShell profile 路径
    let ps_profile = home
        .join("Documents")
        .join("WindowsPowerShell")
        .join("Microsoft.PowerShell_profile.ps1");

    let powershell_function = r#"
# factory-ai-droid-switch Wrapper Start
# 此函数由 factory-ai-droid-switch 自动生成，用于动态加载 API Key
function droid {
    $configPath = "$env:USERPROFILE\.factory\config.json"
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            if ($config.api_key) {
                $env:FACTORY_API_KEY = $config.api_key
            }
        } catch {
            # 忽略解析错误
        }
    }
    & "$env:USERPROFILE\.factory\bin\droid.exe" @args
}
# factory-ai-droid-switch Wrapper End"#;

    let marker_start = "# factory-ai-droid-switch Wrapper Start";

    // 确保目录存在
    if let Some(parent) = ps_profile.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("创建 PowerShell profile 目录失败: {}", e))?;
    }

    // 读取现有内容或创建空内容
    let content = if ps_profile.exists() {
        std::fs::read_to_string(&ps_profile)
            .map_err(|e| format!("读取 PowerShell profile 失败: {}", e))?
    } else {
        String::new()
    };

    // 检查是否已安装
    if content.contains(marker_start) {
        log::info!("PowerShell 包装函数已存在");
        return Ok(());
    }

    // 添加函数
    let new_content = format!("{}\n{}\n", content.trim_end(), powershell_function);
    std::fs::write(&ps_profile, new_content)
        .map_err(|e| format!("写入 PowerShell profile 失败: {}", e))?;

    log::info!("已安装 PowerShell 包装函数到: {}", ps_profile.display());
    Ok(())
}

/// Windows: 安装 CMD 批处理文件
/// 
/// 创建 droid.cmd 文件到 ~/.factory/bin/ 目录
/// 用户需要确保该目录在 PATH 中且优先级高于原 droid.exe
#[cfg(target_os = "windows")]
fn install_cmd_wrapper() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    
    // 批处理文件路径
    let bin_dir = home.join(".factory").join("bin");
    let cmd_wrapper = bin_dir.join("droid.cmd");
    
    // 批处理文件内容
    // 使用 PowerShell 来解析 JSON（CMD 原生不支持 JSON 解析）
    let batch_content = r#"@echo off
setlocal enabledelayedexpansion

REM factory-ai-droid-switch Wrapper - 自动加载 API Key
set "CONFIG_FILE=%USERPROFILE%\.factory\config.json"
set "FACTORY_API_KEY="

if exist "%CONFIG_FILE%" (
    for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "(Get-Content '%CONFIG_FILE%' | ConvertFrom-Json).api_key"`) do (
        set "FACTORY_API_KEY=%%a"
    )
)

REM 调用真正的 droid.exe
"%USERPROFILE%\.factory\bin\droid.exe" %*
"#;

    // 确保目录存在
    std::fs::create_dir_all(&bin_dir)
        .map_err(|e| format!("创建 bin 目录失败: {}", e))?;

    // 检查是否已存在
    if cmd_wrapper.exists() {
        let existing = std::fs::read_to_string(&cmd_wrapper).unwrap_or_default();
        if existing.contains("factory-ai-droid-switch Wrapper") {
            log::info!("CMD 批处理文件已存在");
            return Ok(());
        }
    }

    // 写入批处理文件
    std::fs::write(&cmd_wrapper, batch_content)
        .map_err(|e| format!("写入 CMD 批处理文件失败: {}", e))?;

    log::info!("已安装 CMD 批处理文件到: {}", cmd_wrapper.display());
    log::info!("注意: 请确保 %USERPROFILE%\\.factory\\bin 在 PATH 中且优先级高于原 droid.exe 位置");
    Ok(())
}

/// 获取当前配置文件中的 Factory API Key
pub fn get_factory_api_key_env() -> Result<Option<String>, String> {
    let config_path = get_factory_config_path()?;
    
    if !config_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取 config.json 失败: {}", e))?;
    let config: Value = serde_json::from_str(&content)
        .unwrap_or_else(|_| serde_json::json!({}));

    Ok(config.get("api_key").and_then(|v| v.as_str()).map(|s| s.to_string()))
}

/// 查询单个 API Key 的余额
pub async fn check_balance(api_key: &str) -> Result<BalanceInfo, String> {
    log::info!("开始查询余额，API Key: {}...", &api_key[..api_key.len().min(10)]);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| {
            log::error!("创建 HTTP 客户端失败: {}", e);
            format!("创建 HTTP 客户端失败: {}", e)
        })?;

    log::info!("发送请求到 Factory.ai API...");
    let response = client
        .get("https://app.factory.ai/api/organization/members/chat-usage")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("x-factory-client", "web-browser")
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| {
            log::error!("请求失败: {}", e);
            format!("请求失败: {}", e)
        })?;

    let status = response.status();
    log::info!("收到响应，状态码: {}", status);

    if status.as_u16() != 200 {
        let text = response.text().await.unwrap_or_default();
        log::error!("HTTP 错误 {}: {}", status, text);
        return Err(format!("HTTP {}: {}", status, text));
    }

    // 先获取响应文本用于调试
    let response_text = response.text().await
        .map_err(|e| {
            log::error!("读取响应文本失败: {}", e);
            format!("读取响应失败: {}", e)
        })?;

    log::info!("响应内容: {}", response_text);

    // 解析 JSON
    let api_response: FactoryApiResponse = serde_json::from_str(&response_text)
        .map_err(|e| {
            log::error!("JSON 解析失败: {}，响应内容: {}", e, response_text);
            format!("解析响应失败: {}，原始响应: {}", e, response_text)
        })?;

    let usage = api_response.usage.standard;
    let remaining = usage.total_allowance.saturating_sub(usage.user_tokens);
    let percent_used = usage.used_ratio * 100.0;
    let exceeded = usage.used_ratio > 1.0;

    // 提取到期时间：endDate字段（Unix时间戳，毫秒）
    let expiry_date = api_response.usage.end_date.map(|timestamp| {
        // 将毫秒时间戳转换为ISO格式字符串
        use chrono::{Utc, TimeZone};
        let datetime = Utc.timestamp_millis_opt(timestamp).unwrap();
        datetime.to_rfc3339()
    });

    log::info!("余额查询成功: 已用 {}, 总配额 {}, 剩余 {}",
        usage.user_tokens, usage.total_allowance, remaining);

    if let Some(ref expiry) = expiry_date {
        log::info!("到期时间: {}", expiry);
    }

    Ok(BalanceInfo {
        used: usage.user_tokens,
        allowance: usage.total_allowance,
        remaining,
        overage: usage.org_overage_used,
        used_ratio: usage.used_ratio,
        percent_used,
        exceeded,
        expiry_date,
    })
}

/// 批量查询 API Keys 的余额
pub async fn batch_check_balances(
    api_keys: Vec<String>,
) -> Result<std::collections::HashMap<String, BalanceInfo>, String> {
    use std::collections::HashMap;

    let mut results = HashMap::new();

    for (i, key) in api_keys.iter().enumerate() {
        match check_balance(key).await {
            Ok(balance) => {
                results.insert(key.clone(), balance);
            }
            Err(e) => {
                log::warn!("查询密钥 {} 余额失败: {}", key, e);
            }
        }

        // 延迟 200ms 避免请求过快
        if i < api_keys.len() - 1 {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        }
    }

    Ok(results)
}
