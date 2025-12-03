use crate::models::{get_builtin_models, ModelInfo, ReasoningLevel};
use crate::provider_manager::{load_config, save_config};
use log::info;
use std::fs;
use std::path::PathBuf;

/// 获取 Factory settings 配置文件路径
fn get_factory_settings_path() -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or("无法获取用户主目录")?;
    Ok(home_dir.join(".factory").join("settings.json"))
}

/// 获取所有可用模型
pub fn get_available_models() -> Result<Vec<ModelInfo>, String> {
    let mut config = load_config()?;

    // 如果配置为空,初始化为内置模型
    if config.model_config.available_models.is_empty() {
        config.model_config.available_models = get_builtin_models();
        save_config(&config)?;
    }

    Ok(config.model_config.available_models.clone())
}

/// 获取当前选中的模型
pub fn get_selected_model() -> Result<Option<String>, String> {
    let config = load_config()?;
    Ok(config.model_config.selected_model_id.clone())
}

/// 设置选中的模型
pub fn set_selected_model(model_id: String) -> Result<(), String> {
    let mut config = load_config()?;

    // 查找模型并验证是否存在
    let model = config
        .model_config
        .available_models
        .iter()
        .find(|m| m.id == model_id)
        .cloned();

    let model = model.ok_or(format!("模型 '{}' 不存在", model_id))?;

    config.model_config.selected_model_id = Some(model_id.clone());
    save_config(&config)?;

    // 更新 Factory settings.json 配置文件
    update_factory_settings(&model_id, &model.reasoning_level)?;

    info!("模型已切换为: {}", model_id);
    Ok(())
}

/// 添加自定义模型
pub fn add_custom_model(
    id: String,
    name: String,
    provider: String,
    description: Option<String>,
    reasoning_level: Option<ReasoningLevel>,
) -> Result<(), String> {
    let mut config = load_config()?;

    // 检查模型 ID 是否已存在
    if config
        .model_config
        .available_models
        .iter()
        .any(|m| m.id == id)
    {
        return Err(format!("模型 ID '{}' 已存在", id));
    }

    let new_model = ModelInfo {
        id,
        name,
        provider,
        description,
        is_builtin: false,
        reasoning_level: reasoning_level.unwrap_or_default(),
    };

    config.model_config.available_models.push(new_model);
    save_config(&config)?;

    info!("自定义模型添加成功");
    Ok(())
}

/// 删除自定义模型
pub fn remove_custom_model(model_id: String) -> Result<(), String> {
    let mut config = load_config()?;

    // 查找模型
    let model = config
        .model_config
        .available_models
        .iter()
        .find(|m| m.id == model_id)
        .ok_or(format!("模型 '{}' 不存在", model_id))?;

    // 不允许删除内置模型
    if model.is_builtin {
        return Err("不能删除内置模型".to_string());
    }

    // 如果删除的是当前选中的模型,重置为默认模型
    if config.model_config.selected_model_id.as_ref() == Some(&model_id) {
        config.model_config.selected_model_id = Some("claude-sonnet-4-5-20250929".to_string());
    }

    config
        .model_config
        .available_models
        .retain(|m| m.id != model_id);
    save_config(&config)?;

    info!("自定义模型已删除: {}", model_id);
    Ok(())
}

/// 设置模型的推理级别
pub fn set_model_reasoning_level(model_id: String, reasoning_level: ReasoningLevel) -> Result<(), String> {
    let mut config = load_config()?;

    // 查找模型
    let model = config
        .model_config
        .available_models
        .iter_mut()
        .find(|m| m.id == model_id)
        .ok_or(format!("模型 '{}' 不存在", model_id))?;

    model.reasoning_level = reasoning_level.clone();
    save_config(&config)?;

    // 如果这是当前选中的模型，更新 Factory settings.json
    if config.model_config.selected_model_id.as_ref() == Some(&model_id) {
        update_factory_settings(&model_id, &reasoning_level)?;
    }

    info!("模型 {} 的推理级别已设置为: {:?}", model_id, reasoning_level);
    Ok(())
}

/// 将 ReasoningLevel 转换为 Factory settings 中的 reasoningEffort 值
fn reasoning_level_to_effort(level: &ReasoningLevel) -> &'static str {
    match level {
        ReasoningLevel::Off => "off",
        ReasoningLevel::Low => "low",
        ReasoningLevel::Medium => "medium",
        ReasoningLevel::High => "high",
    }
}

/// 更新 Factory settings.json 配置文件中的模型和推理级别
fn update_factory_settings(model_id: &str, reasoning_level: &ReasoningLevel) -> Result<(), String> {
    let settings_path = get_factory_settings_path()?;

    // 如果 Factory settings 文件不存在,创建一个基础配置
    if !settings_path.exists() {
        let factory_dir = settings_path
            .parent()
            .ok_or("无法获取 Factory 配置目录")?;

        fs::create_dir_all(factory_dir)
            .map_err(|e| format!("创建 Factory 配置目录失败: {}", e))?;

        let default_config = serde_json::json!({
            "model": model_id,
            "reasoningEffort": reasoning_level_to_effort(reasoning_level)
        });

        let content = serde_json::to_string_pretty(&default_config)
            .map_err(|e| format!("序列化配置失败: {}", e))?;

        fs::write(&settings_path, content)
            .map_err(|e| format!("写入 Factory 配置失败: {}", e))?;

        info!("已创建 Factory settings 文件: {:?}", settings_path);
        return Ok(());
    }

    // 读取现有配置 (settings.json 可能包含注释，需要使用 json5 或者手动处理)
    let config_content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("读取 Factory 配置失败: {}", e))?;

    // 尝试解析 JSON (忽略注释行)
    let clean_json = remove_json_comments(&config_content);
    let mut config: serde_json::Value = serde_json::from_str(&clean_json)
        .map_err(|e| format!("解析 Factory 配置失败: {}", e))?;

    // 更新 model 和 reasoningEffort
    if let Some(obj) = config.as_object_mut() {
        obj.insert("model".to_string(), serde_json::json!(model_id));
        obj.insert("reasoningEffort".to_string(), serde_json::json!(reasoning_level_to_effort(reasoning_level)));
    }

    // 写回文件
    let updated_content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&settings_path, updated_content)
        .map_err(|e| format!("写入 Factory 配置失败: {}", e))?;

    info!("已更新 Factory settings: model={}, reasoningEffort={}", model_id, reasoning_level_to_effort(reasoning_level));
    Ok(())
}

/// 移除 JSON 中的注释 (支持 // 和 /* */ 风格)
fn remove_json_comments(content: &str) -> String {
    let mut result = String::new();
    let mut in_string = false;
    let mut in_line_comment = false;
    let mut in_block_comment = false;
    let mut chars = content.chars().peekable();

    while let Some(c) = chars.next() {
        if in_line_comment {
            if c == '\n' {
                in_line_comment = false;
                result.push(c);
            }
            continue;
        }

        if in_block_comment {
            if c == '*' && chars.peek() == Some(&'/') {
                chars.next();
                in_block_comment = false;
            }
            continue;
        }

        if c == '"' && !in_block_comment && !in_line_comment {
            in_string = !in_string;
            result.push(c);
            continue;
        }

        if !in_string {
            if c == '/' {
                if chars.peek() == Some(&'/') {
                    chars.next();
                    in_line_comment = true;
                    continue;
                } else if chars.peek() == Some(&'*') {
                    chars.next();
                    in_block_comment = true;
                    continue;
                }
            }
        }

        result.push(c);
    }

    result
}

/// 重置模型配置为默认值
pub fn reset_models_config() -> Result<(), String> {
    let mut config = load_config()?;
    config.model_config.available_models = get_builtin_models();
    config.model_config.selected_model_id = Some("claude-sonnet-4-5-20250929".to_string());
    save_config(&config)?;

    info!("模型配置已重置为默认值");
    Ok(())
}
