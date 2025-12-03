use serde::{Deserialize, Serialize};

/// API Key 密钥
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub api_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub balance: Option<BalanceInfo>,
    #[serde(default)]
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// 余额信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceInfo {
    pub used: u64,
    pub allowance: u64,
    pub remaining: u64,
    pub overage: u64,
    pub used_ratio: f64,
    pub percent_used: f64,
    pub exceeded: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry_date: Option<String>,
}

/// 推理级别
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ReasoningLevel {
    Off,
    Low,
    Medium,
    High,
}

impl Default for ReasoningLevel {
    fn default() -> Self {
        ReasoningLevel::Medium
    }
}

/// 模型信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub is_builtin: bool,
    #[serde(default)]
    pub reasoning_level: ReasoningLevel,
}

/// 模型配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfig {
    #[serde(default)]
    pub available_models: Vec<ModelInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_model_id: Option<String>,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            available_models: get_builtin_models(),
            selected_model_id: Some("claude-sonnet-4-5-20250929".to_string()),
        }
    }
}

/// 应用配置
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    #[serde(default)]
    pub providers: Vec<Provider>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_provider_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_balance_check: Option<String>,
    #[serde(default)]
    pub model_config: ModelConfig,
}

/// 获取内置模型列表
pub fn get_builtin_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "claude-sonnet-4-5-20250929".to_string(),
            name: "Claude Sonnet 4.5".to_string(),
            provider: "Anthropic".to_string(),
            description: Some("1.2x - 日常开发默认选择".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Medium,
        },
        ModelInfo {
            id: "claude-opus-4-5-20251101".to_string(),
            name: "Claude Opus 4.5".to_string(),
            provider: "Anthropic".to_string(),
            description: Some("1.2x - 高级推理模型".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::High,
        },
        ModelInfo {
            id: "claude-opus-4-1-20250805".to_string(),
            name: "Claude Opus 4.1".to_string(),
            provider: "Anthropic".to_string(),
            description: Some("6x - 复杂架构决策".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::High,
        },
        ModelInfo {
            id: "claude-haiku-4-5-20251001".to_string(),
            name: "Claude Haiku 4.5".to_string(),
            provider: "Anthropic".to_string(),
            description: Some("0.4x - 快速、高性价比".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Low,
        },
        ModelInfo {
            id: "gpt-5.1-codex".to_string(),
            name: "GPT-5.1-Codex".to_string(),
            provider: "OpenAI".to_string(),
            description: Some("0.5x - 编码任务优化".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Medium,
        },
        ModelInfo {
            id: "gpt-5.1".to_string(),
            name: "GPT-5.1".to_string(),
            provider: "OpenAI".to_string(),
            description: Some("0.5x - OpenAI 通用模型".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Medium,
        },
        ModelInfo {
            id: "gemini-3-pro-preview".to_string(),
            name: "Gemini 3 Pro".to_string(),
            provider: "Google".to_string(),
            description: Some("0.8x - Google 多模态模型".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Medium,
        },
        ModelInfo {
            id: "glm-4.6".to_string(),
            name: "Droid Core (GLM-4.6)".to_string(),
            provider: "智谱AI".to_string(),
            description: Some("0.25x - 开源、离线环境".to_string()),
            is_builtin: true,
            reasoning_level: ReasoningLevel::Low,
        },
    ]
}
