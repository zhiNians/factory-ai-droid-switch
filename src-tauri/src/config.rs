use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

/// 获取应用配置目录路径 (~/.factory-ai-droid-switch)
pub fn get_app_config_dir() -> PathBuf {
    dirs::home_dir()
        .expect("无法获取用户主目录")
        .join(".factory-ai-droid-switch")
}

/// 获取应用配置文件路径
pub fn get_app_config_path() -> PathBuf {
    get_app_config_dir().join("config.json")
}

/// 读取 JSON 配置文件
pub fn read_json_file<T: for<'a> Deserialize<'a>>(path: &Path) -> Result<T, String> {
    if !path.exists() {
        return Err(format!("文件不存在: {}", path.display()));
    }

    let content = fs::read_to_string(path).map_err(|e| format!("读取文件失败: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("解析 JSON 失败: {}", e))
}

/// 写入 JSON 配置文件
pub fn write_json_file<T: Serialize>(path: &Path, data: &T) -> Result<(), String> {
    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let json =
        serde_json::to_string_pretty(data).map_err(|e| format!("序列化 JSON 失败: {}", e))?;

    atomic_write(path, json.as_bytes())
}

/// 原子写入：写入临时文件后 rename 替换，避免半写状态
pub fn atomic_write(path: &Path, data: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    let parent = path.parent().ok_or_else(|| "无效的路径".to_string())?;
    let mut tmp = parent.to_path_buf();
    let file_name = path
        .file_name()
        .ok_or_else(|| "无效的文件名".to_string())?
        .to_string_lossy()
        .to_string();
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    tmp.push(format!("{}.tmp.{}", file_name, ts));

    {
        let mut f = fs::File::create(&tmp).map_err(|e| format!("创建临时文件失败: {}", e))?;
        f.write_all(data)
            .map_err(|e| format!("写入临时文件失败: {}", e))?;
        f.flush().map_err(|e| format!("刷新临时文件失败: {}", e))?;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Ok(meta) = fs::metadata(path) {
            let perm = meta.permissions().mode();
            let _ = fs::set_permissions(&tmp, fs::Permissions::from_mode(perm));
        }
    }

    #[cfg(windows)]
    {
        // Windows 上 rename 目标存在会失败，先移除再重命名（尽量接近原子性）
        if path.exists() {
            let _ = fs::remove_file(path);
        }
        fs::rename(&tmp, path).map_err(|e| format!("原子替换失败: {}", e))?;
    }

    #[cfg(not(windows))]
    {
        fs::rename(&tmp, path).map_err(|e| format!("原子替换失败: {}", e))?;
    }
    Ok(())
}

/// 复制文件
pub fn copy_file(from: &Path, to: &Path) -> Result<(), String> {
    fs::copy(from, to).map_err(|e| format!("复制文件失败: {}", e))?;
    Ok(())
}

/// 删除文件
pub fn delete_file(path: &Path) -> Result<(), String> {
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("删除文件失败: {}", e))?;
    }
    Ok(())
}

/// 检查配置状态
#[derive(Serialize, Deserialize)]
pub struct ConfigStatus {
    pub exists: bool,
    pub path: String,
}

/// 获取配置状态
pub fn get_config_status() -> ConfigStatus {
    let path = get_app_config_path();
    ConfigStatus {
        exists: path.exists(),
        path: path.to_string_lossy().to_string(),
    }
}
