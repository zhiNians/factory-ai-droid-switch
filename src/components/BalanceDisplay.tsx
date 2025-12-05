/**
 * 余额显示组件
 */

import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { BalanceInfo } from '../types/api';
import { formatM, formatRelativeTime, formatDateTime } from '../lib/format';

interface BalanceDisplayProps {
  balance?: BalanceInfo;
  lastChecked?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  lastChecked,
  onRefresh,
  isLoading = false,
  error,
}) => {
  // 获取进度条颜色
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500 dark:bg-red-600";
    if (percent >= 80) return "bg-orange-500 dark:bg-orange-600";
    if (percent >= 50) return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-green-500 dark:bg-green-600";
  };

  // 获取状态颜色
  const getStatusColor = (percent: number, exceeded: boolean) => {
    if (exceeded) return "text-red-600 dark:text-red-400";
    if (percent >= 90) return "text-orange-600 dark:text-orange-400";
    if (percent >= 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  // 加载中状态（骨架屏）
  if (isLoading) {
    return (
      <div className="mt-2 p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl space-y-3 backdrop-blur-sm animate-pulse min-h-[190px] flex flex-col justify-between">
        <div>
          {/* 标题行骨架 */}
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-16 bg-gray-300 dark:bg-white/10 rounded"></div>
            <div className="h-4 w-4 bg-gray-300 dark:bg-white/10 rounded"></div>
          </div>
          
          {/* 进度条骨架 */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between">
              <div className="h-3 w-8 bg-gray-300 dark:bg-white/10 rounded"></div>
              <div className="h-3 w-12 bg-gray-300 dark:bg-white/10 rounded"></div>
            </div>
            <div className="h-1.5 w-full bg-gray-300 dark:bg-white/10 rounded-full"></div>
          </div>

          {/* 详细信息骨架 */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="h-3 w-20 bg-gray-300 dark:bg-white/10 rounded"></div>
            <div className="h-3 w-20 bg-gray-300 dark:bg-white/10 rounded"></div>
          </div>
        </div>
        
        <div>
          {/* 到期时间骨架 */}
          <div className="h-3 w-32 bg-gray-300 dark:bg-white/10 rounded mb-1"></div>

          {/* 底部时间骨架 */}
          <div className="h-3 w-24 bg-gray-300 dark:bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="mt-2 p-3 bg-red-500/10 dark:bg-red-900/20 border border-red-500/20 rounded-xl backdrop-blur-sm min-h-[190px] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle size={16} />
            <span>查询失败: {error}</span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 hover:bg-red-500/10 rounded transition-colors"
              title="重新查询"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 未查询状态
  if (!balance) {
    return (
      <div className="mt-2 p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl backdrop-blur-sm min-h-[190px] flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            暂无余额信息
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
              查询余额
            </button>
          )}
        </div>
      </div>
    );
  }

  const percentUsed = balance.percentUsed;
  const exceeded = balance.exceeded;

  return (
    <div className="mt-2 p-3 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl space-y-3 backdrop-blur-sm min-h-[190px] flex flex-col">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            余额信息
          </span>
          {exceeded ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg">
              <AlertTriangle size={12} />
              已超额
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-lg">
              <CheckCircle size={12} />
              正常
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            title="刷新余额"
          >
            <RefreshCw
              size={14}
              className={isLoading ? "animate-spin text-blue-500" : "text-gray-500 dark:text-gray-400"}
            />
          </button>
        )}
      </div>

      {/* 进度条 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${getStatusColor(percentUsed, exceeded)}`}>
            {percentUsed.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            剩余 {formatM(balance.remaining)} ({Math.max(0, 100 - percentUsed).toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-black/5 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor(percentUsed)}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-2 gap-2 text-xs border-t border-black/5 dark:border-white/5 pt-2">
        <div>
          <span className="text-gray-500 dark:text-gray-400">已使用: </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{formatM(balance.used)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">总配额: </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{formatM(balance.allowance)}</span>
        </div>
      </div>

      {/* 底部信息区 (自动推到底部) */}
      <div className="mt-auto space-y-1">
        {/* 到期时间 */}
        {balance.expiryDate && (
          <div className="text-xs">
            <span className="text-gray-500 dark:text-gray-400">到期时间: </span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{formatDateTime(balance.expiryDate)}</span>
          </div>
        )}

        {/* 超额信息 */}
        {exceeded && balance.overage > 0 && (
          <div className="text-xs text-red-600 dark:text-red-400">
            <span className="font-medium">超额使用: </span>
            {balance.overage.toLocaleString()} tokens
          </div>
        )}

        {/* 最后更新时间 */}
        {lastChecked && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            最后更新: {formatRelativeTime(lastChecked)}
          </div>
        )}
      </div>
    </div>
  );
};
