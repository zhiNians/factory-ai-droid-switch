use crate::config::{get_app_config_path, read_json_file, write_json_file};
use crate::droid_config::{clear_factory_api_key_env, set_factory_api_key_env};
use crate::models::{AppConfig, Provider};
use chrono::Utc;

/// 加载应用配置
pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_app_config_path();

    if !config_path.exists() {
        log::info!("配置文件不存在，返回默认配置");
        return Ok(AppConfig::default());
    }

    read_json_file(&config_path)
}

/// 保存应用配置（原子写入）
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_app_config_path();
    write_json_file(&config_path, config)
}

/// 添加密钥
pub fn add_provider(name: String, api_key: String) -> Result<Provider, String> {
    let mut config = load_config()?;

    // 检查是否已存在同名密钥
    if config.providers.iter().any(|p| p.name == name) {
        return Err(format!("密钥名称 '{}' 已存在", name));
    }

    // 检查 API Key 是否已存在
    if config.providers.iter().any(|p| p.api_key == api_key) {
        return Err("此 API Key 已被添加".to_string());
    }

    let now = Utc::now().to_rfc3339();
    let provider = Provider {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        api_key,
        balance: None,
        is_active: false,
        created_at: Some(now.clone()),
        updated_at: Some(now),
    };

    config.providers.push(provider.clone());
    save_config(&config)?;

    log::info!("已添加密钥: {}", provider.name);
    Ok(provider)
}

/// 删除密钥
pub fn remove_provider(id: String) -> Result<(), String> {
    let mut config = load_config()?;

    let provider_index = config
        .providers
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| format!("未找到 ID 为 {} 的密钥", id))?;

    let provider = &config.providers[provider_index];

    // 如果删除的是当前激活的密钥，先清除环境变量
    if config.active_provider_id.as_ref() == Some(&id) {
        clear_factory_api_key_env()?;
        config.active_provider_id = None;
        log::info!("已清除当前激活的密钥环境变量");
    }

    let name = provider.name.clone();
    config.providers.remove(provider_index);
    save_config(&config)?;

    log::info!("已删除密钥: {}", name);
    Ok(())
}

/// 切换密钥
pub fn switch_provider(id: String) -> Result<Provider, String> {
    let mut config = load_config()?;

    // 先找到密钥并复制 API Key
    let api_key = config
        .providers
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("未找到 ID 为 {} 的密钥", id))?
        .api_key
        .clone();

    // 设置系统环境变量
    set_factory_api_key_env(&api_key)?;

    // 更新配置：取消所有激活状态，激活选中的密钥
    for p in &mut config.providers {
        p.is_active = p.id == id;
    }
    config.active_provider_id = Some(id.clone());
    save_config(&config)?;

    // 返回激活的密钥
    let provider = config
        .providers
        .into_iter()
        .find(|p| p.id == id)
        .unwrap();

    log::info!("已切换到密钥: {}", provider.name);
    Ok(provider)
}

/// 停用当前密钥
pub fn disable_provider() -> Result<(), String> {
    let mut config = load_config()?;

    if config.active_provider_id.is_none() {
        log::info!("当前没有激活的密钥");
        return Ok(());
    }

    // 清除环境变量
    clear_factory_api_key_env()?;

    // 更新配置：取消所有激活状态
    for p in &mut config.providers {
        p.is_active = false;
    }
    config.active_provider_id = None;
    save_config(&config)?;

    log::info!("已停用当前密钥");
    Ok(())
}

/// 获取当前激活的密钥
pub fn get_active_provider() -> Result<Option<Provider>, String> {
    let config = load_config()?;

    if let Some(active_id) = config.active_provider_id {
        let provider = config
            .providers
            .into_iter()
            .find(|p| p.id == active_id);
        Ok(provider)
    } else {
        Ok(None)
    }
}

/// 更新密钥余额信息
pub fn update_provider_balance(
    id: String,
    balance: crate::models::BalanceInfo,
) -> Result<(), String> {
    let mut config = load_config()?;

    let provider = config
        .providers
        .iter_mut()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("未找到 ID 为 {} 的密钥", id))?;

    let provider_name = provider.name.clone();
    provider.balance = Some(balance);
    provider.updated_at = Some(Utc::now().to_rfc3339());

    save_config(&config)?;
    log::info!("已更新密钥 {} 的余额信息", provider_name);
    Ok(())
}
