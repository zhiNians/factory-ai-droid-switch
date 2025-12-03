/**
 * 格式化工具函数
 */

/**
 * 格式化 Token 数量为 M 单位
 * @param num Token 数量
 * @returns 格式化后的字符串，如 "1.5M"
 */
export function formatM(num: number): string {
  return (num / 1000000).toFixed(2) + "M";
}

/**
 * 格式化百分比
 * @param value 百分比值 (0-100)
 * @param decimals 小数位数，默认 1
 * @returns 格式化后的字符串，如 "7.5%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + "%";
}

/**
 * 隐藏 API Key 中间部分
 * @param apiKey API Key
 * @returns 隐藏后的字符串，如 "fk-***...***xyz"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) return apiKey;

  const start = apiKey.substring(0, 3);
  const end = apiKey.substring(apiKey.length - 3);
  return `${start}***...***${end}`;
}

/**
 * 格式化时间戳为相对时间
 * @param timestamp 时间戳 (毫秒)
 * @returns 相对时间字符串，如 "5分钟前"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return `${days}天前`;
}

/**
 * 格式化日期时间
 * @param dateStr ISO 8601 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}
