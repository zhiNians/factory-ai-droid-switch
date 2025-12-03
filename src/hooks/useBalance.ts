/**
 * 自定义 Hook: 管理余额查询
 */

import { useState, useCallback } from 'react';
import { BalanceInfo } from '../types/api';
import DroidAPI from '../types/api';

export function useBalance() {
  const [balances, setBalances] = useState<Record<string, BalanceInfo>>({});
  const [lastChecked, setLastChecked] = useState<Record<string, number>>({});
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 查询单个余额
  const checkBalance = useCallback(async (id: string, apiKey: string) => {
    setCheckingIds(prev => new Set(prev).add(id));
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const balance = await DroidAPI.checkBalance(apiKey);

      setBalances(prev => ({
        ...prev,
        [id]: balance,
      }));

      setLastChecked(prev => ({
        ...prev,
        [id]: Date.now(),
      }));

      return balance;
    } catch (err: any) {
      const errorMsg = err?.message || '查询余额失败';
      setErrors(prev => ({
        ...prev,
        [id]: errorMsg,
      }));
      throw new Error(errorMsg);
    } finally {
      setCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // 批量查询余额
  const batchCheckBalances = useCallback(async (
    items: Array<{ id: string; apiKey: string }>
  ) => {
    const apiKeys = items.map(item => item.apiKey);
    const idMap = Object.fromEntries(items.map(item => [item.apiKey, item.id]));

    // 标记所有为正在检查
    setCheckingIds(prev => {
      const next = new Set(prev);
      items.forEach(item => next.add(item.id));
      return next;
    });

    try {
      const results = await DroidAPI.batchCheckBalances(apiKeys);

      // 更新余额
      Object.entries(results).forEach(([apiKey, balance]) => {
        const id = idMap[apiKey];
        if (id) {
          setBalances(prev => ({
            ...prev,
            [id]: balance,
          }));
          setLastChecked(prev => ({
            ...prev,
            [id]: Date.now(),
          }));
          // 清除错误
          setErrors(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
      });

      return results;
    } catch (err: any) {
      const errorMsg = err?.message || '批量查询失败';
      // 为所有设置错误
      items.forEach(item => {
        setErrors(prev => ({
          ...prev,
          [item.id]: errorMsg,
        }));
      });
      throw new Error(errorMsg);
    } finally {
      // 清除所有检查状态
      setCheckingIds(prev => {
        const next = new Set(prev);
        items.forEach(item => next.delete(item.id));
        return next;
      });
    }
  }, []);

  // 刷新单个密钥余额
  const refreshProviderBalance = useCallback(async (id: string) => {
    setCheckingIds(prev => new Set(prev).add(id));
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      const balance = await DroidAPI.refreshProviderBalance(id);

      setBalances(prev => ({
        ...prev,
        [id]: balance,
      }));

      setLastChecked(prev => ({
        ...prev,
        [id]: Date.now(),
      }));

      return balance;
    } catch (err: any) {
      const errorMsg = err?.message || '刷新余额失败';
      setErrors(prev => ({
        ...prev,
        [id]: errorMsg,
      }));
      throw new Error(errorMsg);
    } finally {
      setCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  // 刷新所有余额
  const refreshAllBalances = useCallback(async () => {
    try {
      const providers = await DroidAPI.refreshAllBalances();

      // 更新所有余额
      providers.forEach(provider => {
        if (provider.balance) {
          setBalances(prev => ({
            ...prev,
            [provider.id]: provider.balance!,
          }));
          setLastChecked(prev => ({
            ...prev,
            [provider.id]: Date.now(),
          }));
        }
      });

      return providers;
    } catch (err: any) {
      const errorMsg = err?.message || '刷新所有余额失败';
      throw new Error(errorMsg);
    }
  }, []);

  // 获取余额状态
  const getBalanceStatus = useCallback((id: string) => {
    return {
      balance: balances[id],
      lastChecked: lastChecked[id],
      isChecking: checkingIds.has(id),
      error: errors[id],
    };
  }, [balances, lastChecked, checkingIds, errors]);

  return {
    balances,
    lastChecked,
    checkingIds,
    errors,
    checkBalance,
    batchCheckBalances,
    refreshProviderBalance,
    refreshAllBalances,
    getBalanceStatus,
  };
}
