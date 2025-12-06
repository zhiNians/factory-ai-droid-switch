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

    #[cfg(target_os = "windows")]
    {
        // Windows: 同时写入注册表环境变量（持久化，但需重启生效）
        if let Err(e) = set_registry_env_var("FACTORY_API_KEY", api_key) {
            log::warn!("写入注册表环境变量失败: {}", e);
        }
    }
    
    // 安装 shell 包装函数（如果尚未安装）
    if let Err(e) = install_shell_wrapper() {
        log::warn!("安装 shell 包装函数失败: {}", e);
    }
    
    Ok(())
}

/// Windows: 设置用户级环境变量（写入注册表）
#[cfg(target_os = "windows")]
fn set_registry_env_var(name: &str, value: &str) -> Result<(), String> {
    use std::process::Command;
    
    let set_cmd = if value.is_empty() {
        format!(
            "[Environment]::SetEnvironmentVariable('{}', $null, 'User')",
            name
        )
    } else {
        format!(
            "[Environment]::SetEnvironmentVariable('{}', '{}', 'User')",
            name, value.replace("'", "''")
        )
    };
    
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &set_cmd])
        .output()
        .map_err(|e| format!("执行 PowerShell 失败: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("设置环境变量失败: {}", stderr));
    }
    
    // 广播变更
    broadcast_environment_change();
    
    Ok(())
}

/// 清除 Factory API Key（从 ~/.factory/config.json 移除）
/// 
/// 同时会清除 Windows 注册表中的环境变量（如果存在）
pub fn clear_factory_api_key_env() -> Result<(), String> {
    clear_factory_config_api_key()?;

    #[cfg(target_os = "windows")]
    {
        // Windows: 清除注册表环境变量
        // 传入空字符串会被 set_registry_env_var 设置为空，相当于删除
        if let Err(e) = set_registry_env_var("FACTORY_API_KEY", "") {
            log::warn!("清除注册表环境变量失败: {}", e);
        }
    }

    Ok(())
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

/// 从文本中移除指定标记之间的内容（包括标记行）
fn remove_wrapper_block(content: &str, marker_start: &str, marker_end: &str) -> String {
    let mut result = Vec::new();
    let mut in_block = false;
    
    for line in content.lines() {
        if line.contains(marker_start) {
            in_block = true;
            continue;
        }
        if line.contains(marker_end) {
            in_block = false;
            continue;
        }
        if !in_block {
            result.push(line);
        }
    }
    
    result.join("\n")
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
# Version: 2
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
    let marker_end = "# factory-ai-droid-switch Wrapper End";
    let current_version = "# Version: 2";

    let shell_configs = vec![
        home.join(".zshrc"),
        home.join(".bashrc"),
    ];

    for config_path in shell_configs {
        if config_path.exists() {
            match std::fs::read_to_string(&config_path) {
                Ok(content) => {
                    // 检查是否已安装且是最新版本
                    if content.contains(marker_start) {
                        if content.contains(current_version) {
                            log::info!("shell 包装函数已是最新版本: {}", config_path.display());
                            continue;
                        }
                        // 旧版本存在，需要更新
                        log::info!("检测到旧版本 wrapper，正在更新: {}", config_path.display());
                        let new_content = remove_wrapper_block(&content, marker_start, marker_end);
                        let new_content = format!("{}\n{}\n", new_content.trim_end(), shell_function);
                        std::fs::write(&config_path, &new_content)
                            .map_err(|e| format!("更新 {} 失败: {}", config_path.display(), e))?;
                        log::info!("已更新 shell 包装函数: {}", config_path.display());
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
    
    // 支持 Windows PowerShell 和 PowerShell Core
    let profile_paths = vec![
        home.join("Documents").join("WindowsPowerShell").join("Microsoft.PowerShell_profile.ps1"),
        home.join("Documents").join("PowerShell").join("Microsoft.PowerShell_profile.ps1"),
    ];

    let powershell_function = r#"
# factory-ai-droid-switch Wrapper Start
# Version: 6
function droid {
    $configPath = "$env:USERPROFILE\.factory\config.json"
    if (Test-Path $configPath) {
        try {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            if ($config.api_key) { $env:FACTORY_API_KEY = $config.api_key } else { $env:FACTORY_API_KEY = $null }
        } catch { }
    }
    # 查找真实的 droid 命令，排除 .factory 目录下的 wrapper，并支持 .exe/.cmd/.bat
    $droidCmd = Get-Command droid -All -ErrorAction SilentlyContinue | Where-Object { 
        $_.CommandType -eq 'Application' -and 
        ($_.Extension -ieq '.exe' -or $_.Extension -ieq '.cmd' -or $_.Extension -ieq '.bat') -and 
        $_.Source -notlike "*\.factory\*" 
    } | Select-Object -First 1

    if ($droidCmd) { & $droidCmd.Source @args }
    else { Write-Error "droid command not found (checked .exe, .cmd, .bat). Please install Factory CLI first." }
}
# factory-ai-droid-switch Wrapper End"#;

    let marker_start = "# factory-ai-droid-switch Wrapper Start";
    let marker_end = "# factory-ai-droid-switch Wrapper End";
    let current_version = "# Version: 6";

    for ps_profile in profile_paths {
        // 确保父目录存在（如果 Documents 存在）
        if let Some(parent) = ps_profile.parent() {
            if let Some(docs) = parent.parent() {
                if !docs.exists() { continue; }
            }
            if let Err(e) = std::fs::create_dir_all(parent) {
                log::warn!("创建目录失败 {}: {}", parent.display(), e);
                continue;
            }
        }

        // 读取现有内容或创建空内容
        let content = if ps_profile.exists() {
            match std::fs::read_to_string(&ps_profile) {
                Ok(c) => c,
                Err(e) => {
                    log::warn!("读取 {} 失败: {}", ps_profile.display(), e);
                    continue;
                }
            }
        } else {
            String::new()
        };

        // 检查是否已安装且是最新版本
        if content.contains(marker_start) {
            if content.contains(current_version) {
                log::info!("PowerShell 包装函数已是最新版本: {}", ps_profile.display());
                continue;
            }
            // 旧版本存在，需要更新
            log::info!("检测到旧版本 wrapper，正在更新: {}", ps_profile.display());
            let new_content = remove_wrapper_block(&content, marker_start, marker_end);
            let new_content = format!("{}\n{}\n", new_content.trim_end(), powershell_function);
            if let Err(e) = std::fs::write(&ps_profile, new_content) {
                log::warn!("更新 {} 失败: {}", ps_profile.display(), e);
            }
            continue;
        }

        // 添加函数
        let new_content = format!("{}\n{}\n", content.trim_end(), powershell_function);
        if let Err(e) = std::fs::write(&ps_profile, new_content) {
             log::warn!("写入 {} 失败: {}", ps_profile.display(), e);
        } else {
             log::info!("已安装 PowerShell 包装函数到: {}", ps_profile.display());
        }
    }

    Ok(())
}

/// Windows: 安装 CMD 批处理文件
#[cfg(target_os = "windows")]
fn install_cmd_wrapper() -> Result<(), String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    
    // 批处理文件路径
    let bin_dir = home.join(".factory").join("bin");
    let cmd_wrapper = bin_dir.join("droid.cmd");
    
    // CMD wrapper: use PowerShell to find droid.exe/cmd/bat and read config
    let batch_content = r#"@echo off
setlocal
set "CF=%USERPROFILE%\.factory\config.json"
set "FACTORY_API_KEY="
if exist "%CF%" (
    for /f "usebackq delims=" %%k in (`powershell -NoProfile -Command "try{$c=Get-Content '%CF%' -Raw|ConvertFrom-Json;if($c.api_key){Write-Output $c.api_key}}catch{}"`) do set "FACTORY_API_KEY=%%k"
)
set "DROID_EXE="
for /f "delims=" %%e in ('powershell -NoProfile -Command "$E='.exe','.cmd','.bat';$P=$env:Path-split';';foreach($d in $P){if($d-like'*\.factory\*'){continue};foreach($x in $E){$f=Join-Path $d ('droid'+$x);if(Test-Path $f){$f;exit}}}"') do set "DROID_EXE=%%e"
if defined DROID_EXE (
    "%DROID_EXE%" %*
    exit /b %errorlevel%
)
echo droid command not found (checked .exe, .cmd, .bat)
exit /b 1
"#;

    // 确保目录存在
    std::fs::create_dir_all(&bin_dir)
        .map_err(|e| format!("创建 bin 目录失败: {}", e))?;

    // 检查是否需要更新（检查新版本特征：usebackq）
    if cmd_wrapper.exists() {
        let existing = std::fs::read_to_string(&cmd_wrapper).unwrap_or_default();
        if existing.contains("usebackq") {
            log::info!("CMD 批处理文件已是最新版本");
            return Ok(());
        }
        log::info!("检测到旧版本 CMD wrapper，正在更新...");
    }

    // 写入批处理文件（确保使用 Windows CRLF 行尾符）
    let batch_content_crlf = batch_content.replace('\n', "\r\n");
    std::fs::write(&cmd_wrapper, batch_content_crlf)
        .map_err(|e| format!("写入 CMD 批处理文件失败: {}", e))?;

    log::info!("已安装 CMD 批处理文件到: {}", cmd_wrapper.display());
    
    // 自动将 bin 目录添加到用户 PATH（优先级最高）
    if let Err(e) = add_to_user_path(&bin_dir) {
        log::warn!("自动添加 PATH 失败: {}，请手动添加", e);
    }
    
    Ok(())
}

/// Windows: 将目录添加到用户 PATH 环境变量（放在最前面确保优先级最高）
#[cfg(target_os = "windows")]
fn add_to_user_path(dir: &std::path::Path) -> Result<(), String> {
    use std::process::Command;
    
    let dir_str = dir.to_string_lossy().to_string();
    
    // 使用 PowerShell 读取当前用户 PATH
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", 
            "[Environment]::GetEnvironmentVariable('Path', 'User')"])
        .output()
        .map_err(|e| format!("执行 PowerShell 失败: {}", e))?;
    
    let current_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    
    // 检查是否已经在 PATH 中
    let path_lower = current_path.to_lowercase();
    let dir_lower = dir_str.to_lowercase();
    
    // 检查各种可能的格式
    let already_exists = path_lower.split(';')
        .any(|p| {
            let p = p.trim();
            p == dir_lower || 
            p == dir_lower.replace('/', "\\") ||
            p.replace("%userprofile%", &std::env::var("USERPROFILE").unwrap_or_default().to_lowercase()) == dir_lower
        });
    
    if already_exists {
        log::info!("PATH 中已包含 {}", dir_str);
        return Ok(());
    }
    
    // 将新目录添加到 PATH 最前面（确保优先级最高）
    let new_path = if current_path.is_empty() {
        dir_str.clone()
    } else {
        format!("{};{}", dir_str, current_path)
    };
    
    // 使用 PowerShell 设置用户 PATH
    let set_cmd = format!(
        "[Environment]::SetEnvironmentVariable('Path', '{}', 'User')",
        new_path.replace("'", "''")
    );
    
    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &set_cmd])
        .output()
        .map_err(|e| format!("设置 PATH 失败: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("设置 PATH 失败: {}", stderr));
    }
    
    log::info!("已将 {} 添加到用户 PATH（需要重启 CMD 生效）", dir_str);
    
    // 广播环境变量变更消息，让部分应用立即感知（CMD 可能仍需重启）
    broadcast_environment_change();
    
    Ok(())
}

/// Windows: 广播环境变量变更消息
#[cfg(target_os = "windows")]
fn broadcast_environment_change() {
    use std::process::Command;
    
    // 使用 PowerShell 发送 WM_SETTINGCHANGE 消息
    let _ = Command::new("powershell")
        .args(["-NoProfile", "-Command", 
            "Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition '[DllImport(\"user32.dll\", SetLastError = true, CharSet = CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);'; $HWND_BROADCAST = [IntPtr]0xffff; $WM_SETTINGCHANGE = 0x1a; $result = [UIntPtr]::Zero; [Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)"])
        .output();
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

// ==================== 用户级别系统提示词管理 ====================

use crate::models::{PromptConfig, PromptTemplate, get_recommended_prompts};

/// 获取 ~/.factory/AGENTS.md 的路径（跨平台支持）
fn get_agents_md_path() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    Ok(home.join(".factory").join("AGENTS.md"))
}

/// 获取提示词配置文件路径
fn get_prompt_config_path() -> Result<std::path::PathBuf, String> {
    let home = dirs::home_dir().ok_or("无法获取用户主目录")?;
    Ok(home.join(".factory").join("prompts.json"))
}

/// 读取用户级别系统提示词
pub fn get_user_system_prompt() -> Result<String, String> {
    let agents_path = get_agents_md_path()?;
    
    if !agents_path.exists() {
        log::info!("~/.factory/AGENTS.md 不存在，返回空内容");
        return Ok(String::new());
    }

    std::fs::read_to_string(&agents_path)
        .map_err(|e| format!("读取 AGENTS.md 失败: {}", e))
}

/// 保存用户级别系统提示词
pub fn set_user_system_prompt(content: &str) -> Result<(), String> {
    let agents_path = get_agents_md_path()?;
    
    // 确保 .factory 目录存在
    if let Some(parent) = agents_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("创建 .factory 目录失败: {}", e))?;
    }

    std::fs::write(&agents_path, content)
        .map_err(|e| format!("写入 AGENTS.md 失败: {}", e))?;

    log::info!("已更新 ~/.factory/AGENTS.md");
    Ok(())
}

/// 获取 AGENTS.md 文件的完整路径（用于在文件管理器中打开）
pub fn get_agents_md_file_path() -> Result<String, String> {
    let agents_path = get_agents_md_path()?;
    Ok(agents_path.to_string_lossy().to_string())
}

/// 加载提示词配置
pub fn load_prompt_config() -> Result<PromptConfig, String> {
    let config_path = get_prompt_config_path()?;
    
    if !config_path.exists() {
        return Ok(PromptConfig::default());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取 prompts.json 失败: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("解析 prompts.json 失败: {}", e))
}

/// 保存提示词配置
pub fn save_prompt_config(config: &PromptConfig) -> Result<(), String> {
    let config_path = get_prompt_config_path()?;
    
    // 确保 .factory 目录存在
    if let Some(parent) = config_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("创建 .factory 目录失败: {}", e))?;
    }

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    
    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入 prompts.json 失败: {}", e))?;

    log::info!("已保存提示词配置");
    Ok(())
}

/// 获取所有提示词模板（包括推荐和用户自定义）
pub fn get_all_prompt_templates() -> Result<Vec<PromptTemplate>, String> {
    let config = load_prompt_config()?;
    let mut templates = get_recommended_prompts();
    
    // 添加用户自定义模板
    for template in config.templates {
        if !template.is_builtin {
            templates.push(template);
        }
    }
    
    Ok(templates)
}

/// 获取推荐提示词列表
pub fn get_recommended_prompt_templates() -> Vec<PromptTemplate> {
    get_recommended_prompts()
}

/// 添加自定义提示词模板
pub fn add_prompt_template(name: String, content: String, description: Option<String>, category: Option<String>) -> Result<PromptTemplate, String> {
    let mut config = load_prompt_config()?;
    
    let id = format!("custom-{}", chrono::Utc::now().timestamp_millis());
    let template = PromptTemplate {
        id: id.clone(),
        name,
        content,
        description,
        category,
        is_builtin: false,
        created_at: Some(chrono::Utc::now().to_rfc3339()),
    };
    
    config.templates.push(template.clone());
    save_prompt_config(&config)?;
    
    Ok(template)
}

/// 删除自定义提示词模板
pub fn remove_prompt_template(id: String) -> Result<(), String> {
    let mut config = load_prompt_config()?;
    
    let original_len = config.templates.len();
    config.templates.retain(|t| t.id != id || t.is_builtin);
    
    if config.templates.len() == original_len {
        return Err("未找到该模板或无法删除内置模板".to_string());
    }
    
    // 如果删除的是当前激活的模板，清除激活状态
    if config.active_template_id.as_ref() == Some(&id) {
        config.active_template_id = None;
    }
    
    save_prompt_config(&config)?;
    Ok(())
}

/// 应用提示词模板（写入 AGENTS.md 并设置为激活）
pub fn apply_prompt_template(id: String) -> Result<(), String> {
    let all_templates = get_all_prompt_templates()?;
    
    let template = all_templates.iter()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("未找到 ID 为 {} 的模板", id))?;
    
    // 写入 AGENTS.md
    set_user_system_prompt(&template.content)?;
    
    // 更新激活状态
    let mut config = load_prompt_config()?;
    config.active_template_id = Some(id);
    save_prompt_config(&config)?;
    
    log::info!("已应用模板: {}", template.name);
    Ok(())
}

/// 获取当前激活的模板 ID
pub fn get_active_template_id() -> Result<Option<String>, String> {
    let config = load_prompt_config()?;
    Ok(config.active_template_id)
}
