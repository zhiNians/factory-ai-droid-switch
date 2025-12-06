import { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  RotateCcw, 
  FolderOpen, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Search,
  FileText,
  Sparkles,
  CheckCircle2,
  PenTool,
  LayoutTemplate,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemPrompt, PromptTemplate } from '../hooks/useSystemPrompt';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';

interface SystemPromptEditorProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
}

export const SystemPromptEditor = ({ onNotify }: SystemPromptEditorProps) => {
  const { 
    content, 
    filePath, 
    templates,
    activeTemplateId,
    loading, 
    saving, 
    saveContent,
    applyTemplate,
    addTemplate,
    removeTemplate,
  } = useSystemPrompt();
  
  const [localContent, setLocalContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  // Initialize local content
  useEffect(() => {
    if (!loading) {
      setLocalContent(content);
      // If there is an active template, select it initially, unless we have local edits?
      // Actually, if content matches active template, select it.
      if (activeTemplateId) {
        setSelectedTemplateId(activeTemplateId);
      }
    }
  }, [content, activeTemplateId, loading]);

  // Detect if current content matches the selected template
  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId), 
    [templates, selectedTemplateId]
  );

  const isModified = useMemo(() => {
    if (selectedTemplate) {
      return localContent !== selectedTemplate.content;
    }
    return localContent !== content;
  }, [localContent, content, selectedTemplate]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const lowerQuery = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) || 
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.category?.toLowerCase().includes(lowerQuery)
    );
  }, [templates, searchQuery]);

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, PromptTemplate[]> = {
      'Built-in': [],
      'Custom': []
    };
    
    filteredTemplates.forEach(t => {
      if (t.isBuiltin) groups['Built-in'].push(t);
      else groups['Custom'].push(t);
    });
    
    return groups;
  }, [filteredTemplates]);

  // Handlers
  const handleTemplateClick = (template: PromptTemplate) => {
    setSelectedTemplateId(template.id);
    setLocalContent(template.content);
  };

  const handleSaveToAgents = async () => {
    try {
      // If a template is selected and content matches, apply it (to track ID)
      if (selectedTemplateId && localContent === selectedTemplate?.content) {
        await applyTemplate(selectedTemplateId);
        onNotify?.(`已应用模板: ${selectedTemplate.name}`, 'success');
      } else {
        // Otherwise just save content
        await saveContent(localContent);
        onNotify?.('系统提示词已保存', 'success');
      }
    } catch (error: any) {
      onNotify?.(error?.message || '保存失败', 'error');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      onNotify?.('请输入模板名称', 'error');
      return;
    }
    try {
      const newTemplate = await addTemplate(
        newTemplateName.trim(), 
        localContent, 
        newTemplateDesc || '用户自定义模板', 
        '自定义'
      );
      setShowSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setSelectedTemplateId(newTemplate.id);
      onNotify?.('模板已保存', 'success');
    } catch (error: any) {
      onNotify?.(error?.message || '保存模板失败', 'error');
    }
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个模板吗？')) {
      try {
        await removeTemplate(id);
        if (selectedTemplateId === id) {
          setSelectedTemplateId(null);
          setLocalContent(content); // Revert to current file content
        }
        onNotify?.('模板已删除', 'success');
      } catch (error: any) {
        onNotify?.(error?.message || '删除失败', 'error');
      }
    }
  };

  const handleOpenFolder = async () => {
    if (!filePath) return;
    try {
      await revealItemInDir(filePath);
    } catch (error) {
      onNotify?.('打开文件夹失败', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p>加载系统提示词...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md">
        <div className="p-4 border-b border-gray-200 dark:border-white/5 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-100/50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black/40 transition-colors"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-6">
            {/* Custom Templates */}
            {groupedTemplates['Custom'].length > 0 && (
              <div className="space-y-2">
                <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  我的模板
                </h3>
                <div className="space-y-1">
                  {groupedTemplates['Custom'].map(template => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isActive={selectedTemplateId === template.id}
                      isApplied={activeTemplateId === template.id}
                      onClick={() => handleTemplateClick(template)}
                      onDelete={(e) => handleDeleteTemplate(e, template.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Built-in Templates */}
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                推荐模板
              </h3>
              <div className="space-y-1">
                {groupedTemplates['Built-in'].map(template => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    isActive={selectedTemplateId === template.id}
                    isApplied={activeTemplateId === template.id}
                    onClick={() => handleTemplateClick(template)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t border-gray-200 dark:border-white/5">
           <Button 
             variant="outline" 
             className="w-full justify-start gap-2 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-dashed"
             onClick={() => setShowSaveDialog(true)}
           >
             <Plus size={16} />
             保存当前内容为新模板
           </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0C0C0C]">
        {/* Toolbar */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0C0C0C]/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              selectedTemplate ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {selectedTemplate ? <LayoutTemplate size={18} /> : <PenTool size={18} />}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {selectedTemplate ? selectedTemplate.name : '正在编辑 AGENTS.md'}
              </h2>
              <p className="text-xs text-gray-500 truncate">
                {selectedTemplate?.description || '自定义编辑模式'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalContent(content)}
                disabled={!isModified && !selectedTemplateId} // Disable only if absolutely no change from file
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
             >
                <RotateCcw size={16} className="mr-2" />
                重置
             </Button>
             
             <Button
                onClick={handleSaveToAgents}
                disabled={saving}
                className={cn(
                  "min-w-[100px] transition-all duration-300",
                  isModified 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20"
                )}
             >
                {saving ? (
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <>
                     <Save size={16} className="mr-2" />
                     {selectedTemplateId && localContent === selectedTemplate?.content ? '应用模板' : '保存修改'}
                   </>
                )}
             </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative group">
          <Textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            className="absolute inset-0 w-full h-full p-6 resize-none border-0 focus-visible:ring-0 rounded-none bg-transparent font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200"
            spellCheck={false}
          />
          
          {/* Floating info for built-in templates */}
          {selectedTemplate?.isBuiltin && isModified && (
             <div className="absolute bottom-6 right-6 pointer-events-none">
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-800/50 shadow-sm backdrop-blur-sm flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   已修改内置模板内容 (保存将覆盖 AGENTS.md)
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 px-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#0C0C0C] text-xs text-gray-500">
           <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group"
              >
                <FolderOpen size={12} />
                <span className="max-w-[300px] truncate">{filePath}</span>
                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
           </div>
           <div className="flex items-center gap-4 font-mono">
              <span>{localContent.length} chars</span>
              {isModified ? (
                <span className="text-amber-500 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                   Unsaved
                </span>
              ) : (
                <span className="text-green-500 flex items-center gap-1">
                   <CheckCircle2 size={12} />
                   Saved
                </span>
              )}
           </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>保存为新模板</DialogTitle>
            <DialogDescription>
              将当前编辑的内容保存为一个新的模板，以便稍后重复使用。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">模板名称</Label>
              <Input
                id="name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="例如: Python Web 开发"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">描述 (可选)</Label>
              <Input
                id="desc"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                placeholder="简要描述这个模板的用途..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>取消</Button>
            <Button onClick={handleSaveAsTemplate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-component for Template List Item
const TemplateItem = ({ 
  template, 
  isActive, 
  isApplied, 
  onClick, 
  onDelete 
}: { 
  template: PromptTemplate;
  isActive: boolean;
  isApplied: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-xl transition-all duration-200 group relative border",
        isActive 
          ? "bg-white dark:bg-white/10 border-blue-200 dark:border-blue-500/30 shadow-sm" 
          : "bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
             <span className={cn(
               "font-medium text-sm truncate",
               isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
             )}>
               {template.name}
             </span>
             {isApplied && (
               <div className="px-1.5 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold">
                 ACTIVE
               </div>
             )}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate pr-4">
            {template.description || '无描述'}
          </p>
        </div>
        
        {isActive && (
          <motion.div 
             layoutId="activeIndicator"
             className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full" 
          />
        )}
      </div>

      {/* Actions */}
      {!template.isBuiltin && onDelete && (
        <div 
          onClick={onDelete}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-all"
          title="删除模板"
        >
          <Trash2 size={14} />
        </div>
      )}
    </button>
  );
};
