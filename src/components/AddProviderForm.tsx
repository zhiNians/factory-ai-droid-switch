/**
 * 添加密钥表单组件
 */

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateApiKey, validateProviderName, ValidationErrors } from '../lib/validation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AddProviderFormProps {
  onAdd: (name: string, apiKey: string) => Promise<void>;
  onClose: () => void;
}

export const AddProviderForm: React.FC<AddProviderFormProps> = ({
  onAdd,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证名称
    if (!validateProviderName(name)) {
      setError(ValidationErrors.NAME_REQUIRED);
      return;
    }

    if (name.trim().length > 50) {
      setError(ValidationErrors.NAME_TOO_LONG);
      return;
    }

    // 验证 API Key
    if (!validateApiKey(apiKey)) {
      setError(ValidationErrors.API_KEY_INVALID);
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd(name.trim(), apiKey.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || '添加失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md !rounded-3xl !p-0 gap-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/10 dark:border-white/10 shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">添加密钥</DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 名称输入 */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">密钥名称 <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: Droid 1"
              autoFocus
              className="bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus-visible:ring-blue-500/50"
            />
          </div>

          {/* API Key 输入 */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">API Key <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fk-..."
              className="bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus-visible:ring-blue-500/50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              API Key 必须以 fk- 开头
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="hover:bg-black/5 dark:hover:bg-white/10"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSubmitting ? '添加中...' : '添加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
