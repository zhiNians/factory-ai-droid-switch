/**
 * 自定义 Hook: 管理模型状态
 */

import { useState, useEffect, useCallback } from 'react';
import DroidAPI, { ModelInfo, ReasoningLevel } from '../types/api';

export function useModels() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载模型列表和选中的模型
  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [modelsData, selectedId] = await Promise.all([
        DroidAPI.getAvailableModels(),
        DroidAPI.getSelectedModel(),
      ]);
      setModels(modelsData);
      setSelectedModelId(selectedId);
    } catch (err: any) {
      const errorMsg = err?.message || '加载模型失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // 设置选中的模型
  const selectModel = useCallback(async (modelId: string) => {
    setError(null);

    try {
      await DroidAPI.setSelectedModel(modelId);
      setSelectedModelId(modelId);
      await loadModels();
    } catch (err: any) {
      const errorMsg = err?.message || '切换模型失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadModels]);

  // 设置推理级别
  const setReasoningLevel = useCallback(async (modelId: string, level: ReasoningLevel) => {
    setError(null);

    try {
      await DroidAPI.setModelReasoningLevel(modelId, level);
      await loadModels();
    } catch (err: any) {
      const errorMsg = err?.message || '设置推理级别失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadModels]);

  // 添加自定义模型
  const addCustomModel = useCallback(async (
    id: string,
    name: string,
    provider: string,
    description?: string,
    reasoningLevel?: ReasoningLevel
  ) => {
    setError(null);

    try {
      await DroidAPI.addCustomModel(id, name, provider, description, reasoningLevel);
      await loadModels();
    } catch (err: any) {
      const errorMsg = err?.message || '添加模型失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadModels]);

  // 删除自定义模型
  const removeCustomModel = useCallback(async (modelId: string) => {
    setError(null);

    try {
      await DroidAPI.removeCustomModel(modelId);
      await loadModels();
    } catch (err: any) {
      const errorMsg = err?.message || '删除模型失败';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [loadModels]);

  // 获取当前选中的模型
  const selectedModel = models.find(m => m.id === selectedModelId) || null;

  // 初始加载
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    models,
    selectedModelId,
    selectedModel,
    loading,
    error,
    loadModels,
    selectModel,
    setReasoningLevel,
    addCustomModel,
    removeCustomModel,
  };
}
