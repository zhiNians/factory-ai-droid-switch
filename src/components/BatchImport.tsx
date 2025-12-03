/**
 * 批量导入组件
 */

import React, { useState } from 'react';
import { Upload, AlertCircle, Info } from 'lucide-react';
import { parseBatchApiKeys, ValidationErrors } from '../lib/validation';
import { maskApiKey } from '../lib/format';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

interface BatchImportProps {
  onImport: (keys: string[], namePrefix: string) => Promise<void>;
  onClose: () => void;
}

export const BatchImport: React.FC<BatchImportProps> = ({
  onImport,
  onClose,
}) => {
  const [keysText, setKeysText] = useState('');
  const [namePrefix, setNamePrefix] = useState('Droid');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setKeysText(text);
    setError('');
    const parsed = parseBatchApiKeys(text);
    setPreview(parsed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!keysText.trim()) {
      setError('请输入至少一个 API Key');
      return;
    }

    const keys = parseBatchApiKeys(keysText);

    if (keys.length === 0) {
      setError(ValidationErrors.NO_VALID_KEYS);
      return;
    }

    setIsSubmitting(true);

    try {
      await onImport(keys, namePrefix.trim() || 'Droid');
      onClose();
    } catch (err: any) {
      setError(err?.message || '导入失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden !rounded-3xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/10 dark:border-white/10 shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">批量导入 API Keys</DialogTitle>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <ScrollArea className="h-full" viewportClassName="h-full w-full rounded-[inherit] p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 使用说明 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2 font-medium text-sm">
                  <Info size={16} />
                  <span>批量导入说明</span>
                </div>
                <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 space-y-1 ml-1 list-disc list-inside">
                  <li>每行一个 API Key，或使用逗号、分号分隔</li>
                  <li>所有 API Key 必须以 fk- 开头</li>
                  <li>重复的 API Key 会自动去重</li>
                </ul>
              </div>

              {/* 名称前缀 */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">名称前缀</Label>
                <div className="relative z-10">
                  <Input
                    type="text"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder="Droid"
                    className="bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus-visible:ring-blue-500/50 relative z-10"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  将生成: {namePrefix} 1, {namePrefix} 2, {namePrefix} 3, ...
                </p>
              </div>

              {/* API Keys 输入 */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">API Keys</Label>
                <div className="relative z-10">
                  <Textarea
                    value={keysText}
                    onChange={handleTextChange}
                    placeholder={`fk-xxxxxx\nfk-yyyyyy\nfk-zzzzzz\n\n或使用逗号、分号分隔：\nfk-xxxxxx, fk-yyyyyy, fk-zzzzzz`}
                    rows={8}
                    className="font-mono resize-y bg-white/50 dark:bg-black/20 border-white/30 dark:border-white/10 focus-visible:ring-blue-500/50 relative z-10"
                  />
                </div>
              </div>

              {/* 预览 */}
              {preview.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      将导入 {preview.length} 个密钥
                    </span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {preview.map((key, index) => (
                      <div key={index} className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-2">
                        <span className="opacity-60 w-4 text-right">{index + 1}.</span>
                        <span>{namePrefix} {index + 1}</span>
                        <span className="opacity-40">→</span>
                        <span>{maskApiKey(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
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
                  disabled={preview.length === 0 || isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? '导入中...' : `导入 ${preview.length > 0 ? `${preview.length} 个` : ''}`}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
