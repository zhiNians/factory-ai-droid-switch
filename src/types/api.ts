/**
 * Droid Switch - TypeScript 类型定义
 *
 * 这个文件定义了 Rust 后端返回的所有数据结构类型
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 密钥信息
 */
export interface Provider {
  /** 密钥唯一 ID (UUID) */
  id: string;
  /** 密钥名称 */
  name: string;
  /** API Key */
  apiKey: string;
  /** 余额信息 (可选) */
  balance?: BalanceInfo;
  /** 是否为当前激活的密钥 */
  isActive: boolean;
  /** 创建时间 (ISO 8601 格式) */
  createdAt?: string;
  /** 更新时间 (ISO 8601 格式) */
  updatedAt?: string;
}

/**
 * 余额信息
 */
export interface BalanceInfo {
  /** 已使用的 tokens */
  used: number;
  /** 总配额 */
  allowance: number;
  /** 剩余 tokens */
  remaining: number;
  /** 超额使用 */
  overage: number;
  /** 使用比率 (0-1) */
  usedRatio: number;
  /** 使用百分比 (0-100) */
  percentUsed: number;
  /** 是否已超额 */
  exceeded: boolean;
  /** 到期时间 (ISO 8601 格式, 可选) */
  expiryDate?: string;
}

/**
 * 推理级别
 */
export type ReasoningLevel = 'off' | 'low' | 'medium' | 'high';

/**
 * 模型信息
 */
export interface ModelInfo {
  /** 模型唯一 ID */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 提供商名称 */
  provider: string;
  /** 模型描述 (可选) */
  description?: string;
  /** 是否为内置模型 */
  isBuiltin: boolean;
  /** 推理级别 */
  reasoningLevel: ReasoningLevel;
}

/**
 * 模型配置
 */
export interface ModelConfig {
  /** 可用模型列表 */
  availableModels: ModelInfo[];
  /** 当前选中的模型 ID */
  selectedModelId?: string;
}

/**
 * 应用配置
 */
export interface AppConfig {
  /** 所有密钥列表 */
  providers: Provider[];
  /** 当前激活的密钥 ID */
  activeProviderId?: string;
  /** 上次余额检查时间 */
  lastBalanceCheck?: string;
  /** 模型配置 */
  modelConfig: ModelConfig;
}

/**
 * Tauri 命令 API
 */
export const DroidAPI = {
  // ==================== 配置管理 ====================

  /**
   * 获取应用配置
   */
  getConfig: (): Promise<AppConfig> =>
    invoke('get_config'),

  /**
   * 添加密钥
   * @param name 密钥名称
   * @param apiKey API Key
   */
  addProvider: (name: string, apiKey: string): Promise<Provider> =>
    invoke('add_provider', { name, apiKey }),

  /**
   * 删除密钥
   * @param id 密钥 ID
   */
  removeProvider: (id: string): Promise<void> =>
    invoke('remove_provider', { id }),

  /**
   * 切换密钥 (激活并设置环境变量)
   * @param id 密钥 ID
   */
  switchProvider: (id: string): Promise<Provider> =>
    invoke('switch_provider', { id }),

  /**
   * 停用当前密钥 (清除环境变量)
   */
  disableProvider: (): Promise<void> =>
    invoke('disable_provider'),

  /**
   * 获取当前激活的密钥
   */
  getActiveProvider: (): Promise<Provider | null> =>
    invoke('get_active_provider'),

  // ==================== 余额查询 ====================

  /**
   * 查询单个 API Key 的余额
   * @param apiKey API Key
   */
  checkBalance: (apiKey: string): Promise<BalanceInfo> =>
    invoke('check_balance', { apiKey }),

  /**
   * 批量查询多个 API Keys 的余额
   * @param apiKeys API Key 列表
   * @returns 返回 Map<apiKey, BalanceInfo>
   */
  batchCheckBalances: (apiKeys: string[]): Promise<Record<string, BalanceInfo>> =>
    invoke('batch_check_balances', { apiKeys }),

  /**
   * 刷新指定密钥的余额并更新到配置
   * @param id 密钥 ID
   */
  refreshProviderBalance: (id: string): Promise<BalanceInfo> =>
    invoke('refresh_provider_balance', { id }),

  /**
   * 刷新所有密钥的余额
   * @returns 返回更新后的所有密钥列表
   */
  refreshAllBalances: (): Promise<Provider[]> =>
    invoke('refresh_all_balances'),

  // ==================== 环境变量管理 ====================

  /**
   * 获取当前系统环境变量中的 API Key
   */
  getCurrentApiKey: (): Promise<string | null> =>
    invoke('get_current_api_key'),

  // ==================== 模型管理 ====================

  /**
   * 获取所有可用模型
   */
  getAvailableModels: (): Promise<ModelInfo[]> =>
    invoke('get_available_models'),

  /**
   * 获取当前选中的模型
   */
  getSelectedModel: (): Promise<string | null> =>
    invoke('get_selected_model'),

  /**
   * 设置选中的模型
   * @param modelId 模型 ID
   */
  setSelectedModel: (modelId: string): Promise<void> =>
    invoke('set_selected_model', { modelId }),

  /**
   * 添加自定义模型
   * @param id 模型 ID
   * @param name 模型名称
   * @param provider 提供商名称
   * @param description 模型描述 (可选)
   * @param reasoningLevel 推理级别 (可选)
   */
  addCustomModel: (id: string, name: string, provider: string, description?: string, reasoningLevel?: ReasoningLevel): Promise<void> =>
    invoke('add_custom_model', { id, name, provider, description, reasoningLevel }),

  /**
   * 删除自定义模型
   * @param modelId 模型 ID
   */
  removeCustomModel: (modelId: string): Promise<void> =>
    invoke('remove_custom_model', { modelId }),

  /**
   * 设置模型的推理级别
   * @param modelId 模型 ID
   * @param reasoningLevel 推理级别
   */
  setModelReasoningLevel: (modelId: string, reasoningLevel: ReasoningLevel): Promise<void> =>
    invoke('set_model_reasoning_level', { modelId, reasoningLevel }),

  /**
   * 重置模型配置为默认值
   */
  resetModelsConfig: (): Promise<void> =>
    invoke('reset_models_config'),
};

export default DroidAPI;
