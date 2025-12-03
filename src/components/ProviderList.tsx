/**
 * 密钥列表组件
 */

import React, { useEffect } from 'react';
import { Play, Edit3, Trash2, CheckCircle2, Users, RefreshCw, Key, Copy, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { Provider } from '../types/api';
import { cn } from '../lib/utils';
import { maskApiKey } from '../lib/format';
import { BalanceDisplay } from './BalanceDisplay';
import { useBalance } from '../hooks/useBalance';
import { SpotlightCard } from './ui/SpotlightCard';
import { Button } from "./ui/button";

interface ProviderListProps {
  providers: Provider[];
  activeProviderId?: string;
  onSwitch: (id: string) => Promise<void>;
  onDisable: () => Promise<void>;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onNotify?: (message: string, type: 'success' | 'error', duration?: number) => void;
}

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  activeProviderId,
  onSwitch,
  onDisable,
  onDelete,
  onEdit,
  onNotify,
}) => {
  const {
    balances,
    lastChecked,
    checkingIds,
    errors,
    batchCheckBalances,
    refreshProviderBalance,
  } = useBalance();

  // 初始加载时批量查询余额
  useEffect(() => {
    if (providers.length > 0) {
      const items = providers
        .filter(p => p.apiKey)
        .map(p => ({ id: p.id, apiKey: p.apiKey }));

      if (items.length > 0) {
        batchCheckBalances(items).catch(err => {
          console.error('批量查询余额失败:', err);
        });
      }
    }
  }, [providers, batchCheckBalances]);

  // 刷新单个密钥余额
  const handleRefreshBalance = async (provider: Provider) => {
    try {
      await refreshProviderBalance(provider.id);
      onNotify?.('余额已更新', 'success', 2000);
    } catch (err: any) {
      onNotify?.(`刷新失败: ${err.message}`, 'error', 3000);
    }
  };

  // 刷新所有余额
  const handleRefreshAll = async () => {
    const items = providers
      .filter(p => p.apiKey)
      .map(p => ({ id: p.id, apiKey: p.apiKey }));

    if (items.length === 0) return;

    try {
      await batchCheckBalances(items);
      onNotify?.('所有余额已更新', 'success', 2000);
    } catch (err: any) {
      onNotify?.(`批量刷新失败: ${err.message}`, 'error', 3000);
    }
  };

  // 切换密钥
  const handleSwitch = async (id: string) => {
    try {
      await onSwitch(id);
      onNotify?.('密钥已切换', 'success', 2000);
    } catch (err: any) {
      onNotify?.(`切换失败: ${err.message}`, 'error', 3000);
    }
  };

  // 停用密钥
  const handleDisable = async () => {
    try {
      await onDisable();
      onNotify?.('已停用当前密钥', 'success', 2000);
    } catch (err: any) {
      onNotify?.(`停用失败: ${err.message}`, 'error', 3000);
    }
  };

  // 复制 API Key
  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      onNotify?.('API Key 已复制', 'success', 1000);
    } catch (err) {
      console.error('复制失败:', err);
      onNotify?.('复制失败', 'error', 1000);
    }
  };

  // 空状态
  if (providers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
          <Users size={32} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          暂无密钥
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          点击左侧侧边栏的 "添加密钥" 按钮开始使用
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 pl-1">
          共 {providers.length} 个密钥
        </h2>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleRefreshAll}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <RefreshCw size={14} className="mr-2" />
          刷新所有余额
        </Button>
      </div>

      {/* 密钥卡片网格 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {providers.map((provider, index) => {
            const isActive = provider.id === activeProviderId;
            const balanceStatus = {
              balance: balances[provider.id],
              lastChecked: lastChecked[provider.id],
              isChecking: checkingIds.has(provider.id),
              error: errors[provider.id],
            };

            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <SpotlightCard
                  className={cn(
                    "h-full flex flex-col p-5 gap-4 transition-all duration-300",
                    isActive 
                      ? "bg-blue-500/10 dark:bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5" 
                      : ""
                  )}
                  spotlightColor={isActive ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.15)"}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={cn(
                          "font-semibold truncate text-lg transition-colors",
                          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
                        )}>
                          {provider.name}
                        </h3>
                        {isActive && <CheckCircle2 size={18} className="text-blue-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono bg-black/5 dark:bg-white/5 rounded-lg pl-2 pr-1 py-1 w-fit backdrop-blur-sm border border-black/5 dark:border-white/5 group/key">
                        <Key size={10} className="shrink-0" />
                        <span className="truncate max-w-[120px]">{maskApiKey(provider.apiKey)}</span>
                        <button
                          onClick={() => handleCopyKey(provider.apiKey)}
                          className="ml-1 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors opacity-0 group-hover/key:opacity-100"
                          title="复制 Key"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {onEdit && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-gray-500 hover:text-blue-500" 
                          onClick={() => onEdit(provider.id)}
                        >
                          <Edit3 size={14} />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isActive}
                        className={cn(
                          "h-8 w-8",
                          isActive 
                            ? "opacity-20 cursor-not-allowed" 
                            : "text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                        )}
                        onClick={() => onDelete(provider.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <BalanceDisplay
                      balance={balanceStatus.balance}
                      lastChecked={balanceStatus.lastChecked}
                      onRefresh={() => handleRefreshBalance(provider)}
                      isLoading={balanceStatus.isChecking}
                      error={balanceStatus.error}
                    />
                  </div>

                  <div className="pt-2 mt-auto">
                    {isActive ? (
                      <Button
                        className="w-full bg-orange-500/80 hover:bg-orange-600/80 border-orange-500/30 text-white shadow-lg shadow-orange-500/20"
                        onClick={handleDisable}
                      >
                        <Pause size={16} className="mr-2 fill-current" />
                        停止使用
                      </Button>
                    ) : (
                      <Button
                        className="w-full shadow-lg shadow-blue-500/20"
                        variant="shimmer"
                        onClick={() => handleSwitch(provider.id)}
                      >
                        <Play size={16} className="mr-2" />
                        启用
                      </Button>
                    )}
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
