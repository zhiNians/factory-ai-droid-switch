/**
 * 验证工具函数
 */

/**
 * 验证 API Key 格式
 * @param apiKey API Key
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Droid API Key 必须以 fk- 开头
  return apiKey.trim().startsWith('fk-');
}

/**
 * 验证密钥名称
 * @param name 密钥名称
 * @returns 是否有效
 */
export function validateProviderName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * 解析批量 API Keys
 * 支持多种分隔符：换行、逗号、分号
 * @param text 输入文本
 * @returns API Key 数组（去重后）
 */
export function parseBatchApiKeys(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // 支持换行、逗号、分号分隔
  const keys = text
    .split(/[\n,;]+/)
    .map(k => k.trim())
    .filter(k => validateApiKey(k));

  // 去重
  return Array.from(new Set(keys));
}

/**
 * 验证错误消息
 */
export const ValidationErrors = {
  API_KEY_REQUIRED: "请输入 API Key",
  API_KEY_INVALID: "API Key 格式无效（应以 fk- 开头）",
  NAME_REQUIRED: "请输入密钥名称",
  NAME_TOO_LONG: "密钥名称过长（最多 50 个字符）",
  NO_VALID_KEYS: "未找到有效的 API Key",
} as const;
