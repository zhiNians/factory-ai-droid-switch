import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description?: string;
  category?: string;
  isBuiltin: boolean;
  createdAt?: string;
}

export function useSystemPrompt() {
  const [content, setContent] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const [promptContent, path, allTemplates, activeId] = await Promise.all([
        invoke<string>('get_user_system_prompt'),
        invoke<string>('get_agents_md_file_path'),
        invoke<PromptTemplate[]>('get_all_prompt_templates'),
        invoke<string | null>('get_active_template_id'),
      ]);
      setContent(promptContent);
      setFilePath(path);
      setTemplates(allTemplates);
      setActiveTemplateId(activeId);
    } catch (error) {
      console.error('加载系统提示词失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveContent = useCallback(async (newContent: string) => {
    try {
      setSaving(true);
      await invoke('set_user_system_prompt', { content: newContent });
      setContent(newContent);
      setActiveTemplateId(null);
      return true;
    } catch (error) {
      console.error('保存系统提示词失败:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  const applyTemplate = useCallback(async (templateId: string) => {
    try {
      setSaving(true);
      await invoke('apply_prompt_template', { id: templateId });
      await loadContent();
    } catch (error) {
      console.error('应用模板失败:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [loadContent]);

  const addTemplate = useCallback(async (
    name: string, 
    templateContent: string, 
    description?: string, 
    category?: string
  ) => {
    try {
      const newTemplate = await invoke<PromptTemplate>('add_prompt_template', {
        name,
        content: templateContent,
        description,
        category,
      });
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      console.error('添加模板失败:', error);
      throw error;
    }
  }, []);

  const removeTemplate = useCallback(async (templateId: string) => {
    try {
      await invoke('remove_prompt_template', { id: templateId });
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (activeTemplateId === templateId) {
        setActiveTemplateId(null);
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      throw error;
    }
  }, [activeTemplateId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  return {
    content,
    setContent,
    filePath,
    templates,
    activeTemplateId,
    loading,
    saving,
    saveContent,
    applyTemplate,
    addTemplate,
    removeTemplate,
    reload: loadContent,
  };
}
