// 模块导入
pub mod balance;
pub mod config;
pub mod droid_config;
pub mod model_manager;
pub mod models;
pub mod provider_manager;

use models::{AppConfig, BalanceInfo, ModelInfo, Provider, ReasoningLevel, PromptTemplate};
use std::collections::HashMap;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuBuilder, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

// ==================== 托盘菜单相关 ====================

/// 创建动态托盘菜单
fn create_tray_menu(app: &tauri::AppHandle) -> Result<Menu<tauri::Wry>, String> {
    let config = provider_manager::load_config()?;
    let mut menu_builder = MenuBuilder::new(app);

    // 顶部：打开主界面
    let show_main_item = MenuItem::with_id(app, "show_main", "打开主界面", true, None::<&str>)
        .map_err(|e| format!("创建打开主界面菜单失败: {}", e))?;
    menu_builder = menu_builder.item(&show_main_item).separator();

    // 密钥列表
    if !config.providers.is_empty() {
        for provider in &config.providers {
            let is_current = config.active_provider_id.as_ref() == Some(&provider.id);
            let item = CheckMenuItem::with_id(
                app,
                format!("provider_{}", provider.id),
                &provider.name,
                true,
                is_current,
                None::<&str>,
            )
            .map_err(|e| format!("创建菜单项失败: {}", e))?;
            menu_builder = menu_builder.item(&item);
        }

        // 如果有当前密钥，添加停用按钮
        if config.active_provider_id.is_some() {
            menu_builder = menu_builder.separator();
            let disable_item = MenuItem::with_id(
                app,
                "disable_provider",
                "停用当前密钥",
                true,
                None::<&str>,
            )
            .map_err(|e| format!("创建停用菜单失败: {}", e))?;
            menu_builder = menu_builder.item(&disable_item);
        }
    } else {
        let empty_hint = MenuItem::with_id(app, "empty", "(无密钥)", false, None::<&str>)
            .map_err(|e| format!("创建空提示失败: {}", e))?;
        menu_builder = menu_builder.item(&empty_hint);
    }

    // 分隔符和退出菜单
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)
        .map_err(|e| format!("创建退出菜单失败: {}", e))?;

    menu_builder = menu_builder.separator().item(&quit_item);

    menu_builder
        .build()
        .map_err(|e| format!("构建菜单失败: {}", e))
}

/// 处理托盘菜单事件
fn handle_tray_menu_event(app: &tauri::AppHandle, event_id: &str) {
    log::info!("处理托盘菜单事件: {}", event_id);

    match event_id {
        "show_main" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" => {
            log::info!("退出应用");
            app.exit(0);
        }
        "disable_provider" => {
            log::info!("停用密钥");
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = disable_provider_internal(&app_handle).await {
                    log::error!("停用密钥失败: {}", e);
                }
            });
        }
        id if id.starts_with("provider_") => {
            let provider_id = id.strip_prefix("provider_").unwrap();
            log::info!("切换到密钥: {}", provider_id);

            let app_handle = app.clone();
            let provider_id = provider_id.to_string();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = switch_provider_internal(&app_handle, provider_id).await {
                    log::error!("切换密钥失败: {}", e);
                }
            });
        }
        _ => {
            log::warn!("未处理的菜单事件: {}", event_id);
        }
    }
}

/// 内部切换密钥函数
async fn switch_provider_internal(
    app: &tauri::AppHandle,
    provider_id: String,
) -> Result<(), String> {
    // 执行切换
    let provider = provider_manager::switch_provider(provider_id.clone())?;
    log::info!("已切换到密钥: {}", provider.name);

    // 切换成功后重新创建托盘菜单
    if let Ok(new_menu) = create_tray_menu(app) {
        if let Some(tray) = app.tray_by_id("main") {
            if let Err(e) = tray.set_menu(Some(new_menu)) {
                log::error!("更新托盘菜单失败: {}", e);
            }
        }
    }

    // 发射事件到前端，通知密钥已切换
    let event_data = serde_json::json!({
        "providerId": provider_id
    });
    if let Err(e) = app.emit("provider-switched", event_data) {
        log::error!("发射密钥切换事件失败: {}", e);
    }

    Ok(())
}

/// 内部停用密钥函数
async fn disable_provider_internal(app: &tauri::AppHandle) -> Result<(), String> {
    provider_manager::disable_provider()?;
    log::info!("已停用密钥");

    // 停用成功后重新创建托盘菜单
    if let Ok(new_menu) = create_tray_menu(app) {
        if let Some(tray) = app.tray_by_id("main") {
            if let Err(e) = tray.set_menu(Some(new_menu)) {
                log::error!("更新托盘菜单失败: {}", e);
            }
        }
    }

    // 发射事件到前端，通知密钥已停用
    let event_data = serde_json::json!({
        "providerId": ""
    });
    if let Err(e) = app.emit("provider-switched", event_data) {
        log::error!("发射密钥停用事件失败: {}", e);
    }

    Ok(())
}

/// 更新托盘菜单的 Tauri 命令
#[tauri::command]
async fn update_tray_menu(app: tauri::AppHandle) -> Result<bool, String> {
    if let Ok(new_menu) = create_tray_menu(&app) {
        if let Some(tray) = app.tray_by_id("main") {
            tray.set_menu(Some(new_menu))
                .map_err(|e| format!("更新托盘菜单失败: {}", e))?;
            return Ok(true);
        }
    }
    Ok(false)
}

// ==================== 配置管理命令 ====================

/// 获取应用配置
#[tauri::command]
async fn get_config() -> Result<AppConfig, String> {
    provider_manager::load_config()
}

/// 添加密钥
#[tauri::command]
async fn add_provider(app: tauri::AppHandle, name: String, api_key: String) -> Result<Provider, String> {
    let provider = provider_manager::add_provider(name, api_key)?;

    // 刷新托盘菜单
    let _ = update_tray_menu(app).await;

    Ok(provider)
}

/// 删除密钥
#[tauri::command]
async fn remove_provider(app: tauri::AppHandle, id: String) -> Result<(), String> {
    provider_manager::remove_provider(id)?;

    // 刷新托盘菜单
    let _ = update_tray_menu(app).await;

    Ok(())
}

/// 切换密钥
#[tauri::command]
async fn switch_provider(app: tauri::AppHandle, id: String) -> Result<Provider, String> {
    let provider = provider_manager::switch_provider(id)?;

    // 刷新托盘菜单
    let _ = update_tray_menu(app).await;

    Ok(provider)
}

/// 停用当前密钥
#[tauri::command]
async fn disable_provider(app: tauri::AppHandle) -> Result<(), String> {
    provider_manager::disable_provider()?;

    // 刷新托盘菜单
    let _ = update_tray_menu(app).await;

    Ok(())
}

/// 获取当前激活的密钥
#[tauri::command]
async fn get_active_provider() -> Result<Option<Provider>, String> {
    provider_manager::get_active_provider()
}

// ==================== 余额查询命令 ====================

/// 查询单个 API Key 的余额
#[tauri::command]
async fn check_balance(api_key: String) -> Result<BalanceInfo, String> {
    balance::check_balance(&api_key).await
}

/// 批量查询 API Keys 的余额
#[tauri::command]
async fn batch_check_balances(api_keys: Vec<String>) -> Result<HashMap<String, BalanceInfo>, String> {
    balance::batch_check_balances(api_keys).await
}

/// 查询密钥余额并更新到配置
#[tauri::command]
async fn refresh_provider_balance(id: String) -> Result<BalanceInfo, String> {
    // 加载配置获取密钥信息
    let config = provider_manager::load_config()?;
    let provider = config
        .providers
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("未找到 ID 为 {} 的密钥", id))?;

    // 查询余额
    let balance = balance::check_balance(&provider.api_key).await?;

    // 更新到配置
    provider_manager::update_provider_balance(id, balance.clone())?;

    Ok(balance)
}

/// 批量刷新所有密钥余额
#[tauri::command]
async fn refresh_all_balances() -> Result<Vec<Provider>, String> {
    let config = provider_manager::load_config()?;
    let mut updated_providers = Vec::new();

    for (i, provider) in config.providers.iter().enumerate() {
        log::info!("正在查询密钥 {} 的余额...", provider.name);

        match balance::check_balance(&provider.api_key).await {
            Ok(balance) => {
                provider_manager::update_provider_balance(provider.id.clone(), balance)?;
                log::info!("密钥 {} 余额查询成功", provider.name);
            }
            Err(e) => {
                log::warn!("密钥 {} 余额查询失败: {}", provider.name, e);
            }
        }

        // 延迟 200ms 避免请求过快
        if i < config.providers.len() - 1 {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
        }
    }

    // 重新加载配置返回更新后的密钥列表
    let updated_config = provider_manager::load_config()?;
    for provider in updated_config.providers {
        updated_providers.push(provider);
    }

    Ok(updated_providers)
}

// ==================== 环境变量管理命令 ====================

/// 获取当前环境变量中的 API Key
#[tauri::command]
async fn get_current_api_key() -> Result<Option<String>, String> {
    droid_config::get_factory_api_key_env()
}

// ==================== 系统提示词管理命令 ====================

/// 获取用户级别系统提示词
#[tauri::command]
async fn get_user_system_prompt() -> Result<String, String> {
    droid_config::get_user_system_prompt()
}

/// 保存用户级别系统提示词
#[tauri::command]
async fn set_user_system_prompt(content: String) -> Result<(), String> {
    droid_config::set_user_system_prompt(&content)
}

/// 获取 AGENTS.md 文件路径
#[tauri::command]
async fn get_agents_md_file_path() -> Result<String, String> {
    droid_config::get_agents_md_file_path()
}

/// 获取所有提示词模板
#[tauri::command]
async fn get_all_prompt_templates() -> Result<Vec<PromptTemplate>, String> {
    droid_config::get_all_prompt_templates()
}

/// 获取推荐提示词模板
#[tauri::command]
async fn get_recommended_prompt_templates() -> Result<Vec<PromptTemplate>, String> {
    Ok(droid_config::get_recommended_prompt_templates())
}

/// 添加自定义提示词模板
#[tauri::command]
async fn add_prompt_template(
    name: String, 
    content: String, 
    description: Option<String>, 
    category: Option<String>
) -> Result<PromptTemplate, String> {
    droid_config::add_prompt_template(name, content, description, category)
}

/// 删除提示词模板
#[tauri::command]
async fn remove_prompt_template(id: String) -> Result<(), String> {
    droid_config::remove_prompt_template(id)
}

/// 应用提示词模板
#[tauri::command]
async fn apply_prompt_template(id: String) -> Result<(), String> {
    droid_config::apply_prompt_template(id)
}

/// 获取当前激活的模板 ID
#[tauri::command]
async fn get_active_template_id() -> Result<Option<String>, String> {
    droid_config::get_active_template_id()
}

// ==================== 模型管理命令 ====================

/// 获取所有可用模型
#[tauri::command]
async fn get_available_models() -> Result<Vec<ModelInfo>, String> {
    model_manager::get_available_models()
}

/// 获取当前选中的模型
#[tauri::command]
async fn get_selected_model() -> Result<Option<String>, String> {
    model_manager::get_selected_model()
}

/// 设置选中的模型
#[tauri::command]
async fn set_selected_model(model_id: String) -> Result<(), String> {
    model_manager::set_selected_model(model_id)
}

/// 添加自定义模型
#[tauri::command]
async fn add_custom_model(
    id: String,
    name: String,
    provider: String,
    description: Option<String>,
    reasoning_level: Option<ReasoningLevel>,
) -> Result<(), String> {
    model_manager::add_custom_model(id, name, provider, description, reasoning_level)
}

/// 删除自定义模型
#[tauri::command]
async fn remove_custom_model(model_id: String) -> Result<(), String> {
    model_manager::remove_custom_model(model_id)
}

/// 设置模型的推理级别
#[tauri::command]
async fn set_model_reasoning_level(model_id: String, reasoning_level: ReasoningLevel) -> Result<(), String> {
    model_manager::set_model_reasoning_level(model_id, reasoning_level)
}

/// 重置模型配置为默认值
#[tauri::command]
async fn reset_models_config() -> Result<(), String> {
    model_manager::reset_models_config()
}

// ==================== 其他命令 ====================

/// 测试命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 创建动态托盘菜单
            let menu = create_tray_menu(app.handle())?;

            // 构建托盘
            let app_handle_for_tray = app.handle().clone();
            let tray_builder = TrayIconBuilder::with_id("main")
                .on_tray_icon_event(move |_tray, event| match event {
                    // 左键单击切换窗口显示/隐藏
                    TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } => {
                        if let Some(window) = app_handle_for_tray.get_webview_window("main") {
                            if let Ok(is_visible) = window.is_visible() {
                                if is_visible {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.unminimize();
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        }
                    }
                    _ => {}
                })
                .menu(&menu)
                .on_menu_event(|app, event| {
                    handle_tray_menu_event(app, &event.id.0);
                })
                .show_menu_on_left_click(false)
                .icon(app.default_window_icon().unwrap().clone());

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 配置管理
            get_config,
            add_provider,
            remove_provider,
            switch_provider,
            disable_provider,
            get_active_provider,
            // 余额查询
            check_balance,
            batch_check_balances,
            refresh_provider_balance,
            refresh_all_balances,
            // 环境变量
            get_current_api_key,
            // 系统提示词
            get_user_system_prompt,
            set_user_system_prompt,
            get_agents_md_file_path,
            get_all_prompt_templates,
            get_recommended_prompt_templates,
            add_prompt_template,
            remove_prompt_template,
            apply_prompt_template,
            get_active_template_id,
            // 模型管理
            get_available_models,
            get_selected_model,
            set_selected_model,
            add_custom_model,
            remove_custom_model,
            set_model_reasoning_level,
            reset_models_config,
            // 托盘菜单
            update_tray_menu,
            // 测试
            greet,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
