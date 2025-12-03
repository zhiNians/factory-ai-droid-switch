/**
 * 自定义 Hook: 管理密钥状态
 */

import { useState, useEffect, useCallback } from 'react';
import { Provider } from '../types/api';
import DroidAPI from '../types/api';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config = await DroidAPI.getConfig();
      setProviders(config.providers);

      // 设置当前激活的密钥
      const active = config.providers.find(p => p.isActive);
      setActiveProvider(active || null);
    } catch (err: any) {
      console.error('加载配置失败:', err);
      setError(err?.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加密钥
  const addProvider = useCallback(async (name: string, apiKey: string) => {
    setError(null);

    try {
      const newProvider = await DroidAPI.addProvider(name, apiKey);
      await loadConfig(); // 重新加载配置
      return newProvider;
    } catch (err: any) {
      const errorMsg = err?.message || '添加密钥失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadConfig]);

  // 删除密钥
  const removeProvider = useCallback(async (id: string) => {
    setError(null);

    try {
      await DroidAPI.removeProvider(id);
      await loadConfig(); // 重新加载配置
    } catch (err: any) {
      const errorMsg = err?.message || '删除密钥失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadConfig]);

  // 切换密钥
  const switchProvider = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      await DroidAPI.switchProvider(id);
      await loadConfig(); // 重新加载配置
    } catch (err: any) {
      const errorMsg = err?.message || '切换密钥失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadConfig]);

  // 停用当前密钥
  const disableProvider = useCallback(async () => {
    setError(null);

    try {
      await DroidAPI.disableProvider();
      await loadConfig(); // 重新加载配置
    } catch (err: any) {
      const errorMsg = err?.message || '停用密钥失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadConfig]);

  // 初始加载
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    providers,
    activeProvider,
    loading,
    error,
    loadConfig,
    addProvider,
    removeProvider,
    switchProvider,
    disableProvider,
  };
}
