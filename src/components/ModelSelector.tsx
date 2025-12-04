/**
 * 模型选择器组件
 */

import React, { useState } from 'react';
import { Settings, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReasoningLevel } from '../types/api';
import { useModels } from '../hooks/useModels';

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";

interface ModelSelectorProps {
  onModelChange?: (modelId: string) => void;
}

const REASONING_LEVELS: ReasoningLevel[] = ['off', 'low', 'medium', 'high'];

const REASONING_LEVEL_LABELS: Record<ReasoningLevel, string> = {
  off: '关闭',
  low: '低',
  medium: '中',
  high: '高',
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onModelChange }) => {
  const {
    models,
    selectedModelId,
    selectedModel,
    loading,
    loadModels,
    selectModel,
    setReasoningLevel,
    addCustomModel,
    removeCustomModel,
  } = useModels();

  // 待应用的选择（本地状态，未保存）
  const [pendingModelId, setPendingModelId] = useState<string | null>(null);
  const [pendingReasoningLevel, setPendingReasoningLevel] = useState<ReasoningLevel | null>(null);
  const [applying, setApplying] = useState(false);

  // 弹窗状态
  const [isManageOpen, setIsManageOpen] = useState(false);

  // 新增模型表单
  const [newModel, setNewModel] = useState({
    id: '',
    name: '',
    provider: '',
    description: '',
    reasoningLevel: 'off' as ReasoningLevel,
  });

  // 删除确认状态
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 当前显示的模型和推理级别
  const displayModelId = pendingModelId || selectedModelId;
  const displayModel = models.find((m) => m.id === displayModelId);
  const displayReasoningLevel = pendingReasoningLevel || displayModel?.reasoningLevel || 'off';

  // 检查是否有未应用的更改
  const hasChanges = () => {
    const modelChanged = pendingModelId !== null && pendingModelId !== selectedModelId;
    if (modelChanged) return true;
    const reasoningChanged = pendingReasoningLevel !== null && selectedModel && pendingReasoningLevel !== selectedModel.reasoningLevel;
    return reasoningChanged || false;
  };

  // 选择模型
  const handleSelectModel = (modelId: string) => {
    setPendingModelId(modelId);
    const model = models.find(m => m.id === modelId);
    if (model) {
      setPendingReasoningLevel(model.reasoningLevel);
    }
  };

  // 选择推理级别
  const handleSelectReasoningLevel = (level: ReasoningLevel) => {
    setPendingReasoningLevel(level);
  };

  // 应用配置
  const handleApply = async () => {
    const modelToApply = pendingModelId || selectedModelId;
    if (!modelToApply) return;

    try {
      setApplying(true);

      // 先切换模型（如果需要）
      if (pendingModelId && pendingModelId !== selectedModelId) {
        await selectModel(pendingModelId);
      }

      // 如果有待应用的推理级别，始终调用设置（后端会处理是否真正需要更新）
      if (pendingReasoningLevel) {
        await setReasoningLevel(modelToApply, pendingReasoningLevel);
      }

      await loadModels();
      setPendingModelId(null);
      setPendingReasoningLevel(null);
      onModelChange?.(modelToApply);
    } catch (err: any) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  // 添加自定义模型
  const handleAddCustomModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.id || !newModel.name || !newModel.provider) return;

    try {
      await addCustomModel(
        newModel.id,
        newModel.name,
        newModel.provider,
        newModel.description || undefined,
        newModel.reasoningLevel
      );
      setNewModel({ id: '', name: '', provider: '', description: '', reasoningLevel: 'off' });
    } catch (err: any) {
      console.error(err);
    }
  };

  // 删除模型
  const handleRemoveModel = async (modelId: string) => {
    try {
      await removeCustomModel(modelId);
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-xl border border-white/30 dark:border-white/10">
        <span className="text-sm text-gray-500 dark:text-gray-400">加载模型...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* 模型选择 Dropdown (使用 shadcn Select) */}
      <Select 
        value={displayModelId || ""} 
        onValueChange={handleSelectModel}
      >
        <SelectTrigger className="w-[200px] bg-black/5 dark:bg-white/5 border-transparent hover:border-black/5 dark:hover:border-white/5 shadow-none">
          <SelectValue placeholder="选择模型" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[300px]">
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id} className="py-3">
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-medium">{model.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono opacity-70">{model.id}</span>
                    <span>•</span>
                    <span>{model.provider}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* 推理级别 Dropdown */}
      <Select 
        value={displayReasoningLevel} 
        onValueChange={(val) => handleSelectReasoningLevel(val as ReasoningLevel)}
        disabled={!displayModel}
      >
        <SelectTrigger className="w-[100px] bg-black/5 dark:bg-white/5 border-transparent hover:border-black/5 dark:hover:border-white/5 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REASONING_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {REASONING_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 应用按钮 */}
      <AnimatePresence>
        {hasChanges() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: 'auto' }}
            exit={{ opacity: 0, scale: 0.9, width: 0 }}
            className="overflow-hidden"
          >
            <Button
              onClick={handleApply}
              disabled={applying}
              size="sm"
              className="h-9 whitespace-nowrap px-4"
            >
              {applying ? "应用中..." : "应用"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 管理按钮 & 弹窗 */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden !rounded-3xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/10 dark:border-white/10 shrink-0">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">模型管理</DialogTitle>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* 添加模型表单 */}
              <Card className="p-6 bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 shadow-none">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400">添加自定义模型</span>
                </h3>
                <form onSubmit={handleAddCustomModel} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">模型 ID <span className="text-red-500">*</span></Label>
                      <Input
                        value={newModel.id}
                        onChange={(e) => setNewModel({ ...newModel, id: e.target.value })}
                        placeholder="例如: gpt-4-turbo"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">模型名称 <span className="text-red-500">*</span></Label>
                      <Input
                        value={newModel.name}
                        onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                        placeholder="例如: GPT-4 Turbo"
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">提供商 <span className="text-red-500">*</span></Label>
                      <Input
                        value={newModel.provider}
                        onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                        placeholder="例如: OpenAI"
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">推理级别</Label>
                      <Select
                        value={newModel.reasoningLevel}
                        onValueChange={(val) => setNewModel({ ...newModel, reasoningLevel: val as ReasoningLevel })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REASONING_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {REASONING_LEVEL_LABELS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground ml-1">描述 (可选)</Label>
                    <Input
                      value={newModel.description}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                      placeholder="简要描述这个模型的特点和用途"
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2">
                    <Plus className="w-4 h-4 mr-2" />
                    添加模型
                  </Button>
                </form>
              </Card>

              {/* 模型列表 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 px-1 text-gray-900 dark:text-gray-100">已配置模型</h3>
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="group p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10 flex items-start justify-between gap-4 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{model.name}</span>
                          <span className="text-xs font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">{model.id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                           <span className="flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                             {model.provider}
                           </span>
                           {model.isBuiltin && (
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium">内置</span>
                           )}
                           {model.reasoningLevel !== 'off' && (
                              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium">
                                推理: {REASONING_LEVEL_LABELS[model.reasoningLevel]}
                              </span>
                           )}
                        </div>
                        {model.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed line-clamp-2">{model.description}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center self-center pl-2 h-8">
                      {!model.isBuiltin && (
                        deleteConfirmId === model.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">确定删除?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveModel(model.id);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              是
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              否
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(model.id);
                            }}
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-500/10 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelSelector;
