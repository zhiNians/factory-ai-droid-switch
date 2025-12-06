/**
 * Droid Switch - 主应用组件
 */

import { useState } from 'react';
import { Plus, Upload, Box, Settings, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProviderList } from './components/ProviderList';
import { AddProviderForm } from './components/AddProviderForm';
import { BatchImport } from './components/BatchImport';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ModelSelector } from './components/ModelSelector';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { DynamicBackground } from './components/ui/DynamicBackground';
import { BackgroundSettings } from './components/BackgroundSettings';
import { SystemPromptEditor } from './components/SystemPromptEditor';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { useProviders } from './hooks/useProviders';
import { useModal } from './hooks/useModal';

// Shadcn UI
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "./components/ui/dialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";

function App() {
  const {
    providers,
    activeProvider,
    loading,
    addProvider,
    removeProvider,
    switchProvider,
    disableProvider,
    loadConfig,
  } = useProviders();

  const addModal = useModal();
  const batchModal = useModal();
  const settingsModal = useModal();
  const promptModal = useModal();

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // 添加密钥
  const handleAddProvider = async (name: string, apiKey: string) => {
    try {
      await addProvider(name, apiKey);
      toast.success('密钥已添加');
    } catch (error: any) {
      const errorMessage = error?.message || '添加失败';
      toast.error(errorMessage);
      throw error;
    }
  };

  // 批量导入
  const handleBatchImport = async (keys: string[], namePrefix: string) => {
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < keys.length; i++) {
      try {
        const name = `${namePrefix} ${i + 1}`;
        await addProvider(name, keys[i]);
        successCount++;
      } catch (error) {
        console.error('添加密钥失败:', error);
        failCount++;
      }
    }

    await loadConfig();
    if (failCount === 0) {
      toast.success(`成功导入 ${successCount} 个密钥`);
    } else {
      toast.error(`导入完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
    }
  };

  // 删除密钥
  const handleDeleteProvider = async (id: string) => {
    const provider = providers.find(p => p.id === id);
    setConfirmDialog({
      isOpen: true,
      title: '删除密钥',
      message: `确定要删除密钥 "${provider?.name}" 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await removeProvider(id);
          setConfirmDialog(null);
          toast.success('密钥已删除');
        } catch (error: any) {
          const errorMessage = error?.message || '删除失败';
          toast.error(errorMessage);
        }
      },
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <BackgroundProvider>
                <div className="h-screen w-full bg-transparent transition-colors duration-500 flex overflow-hidden font-sans text-gray-900 dark:text-gray-100 selection:bg-blue-500/30 selection:text-white">
                  {/* Dynamic Background */}
                  <DynamicBackground />
                  
                  <Toaster />
        
                  {/* Sidebar */}
                  <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-20 lg:w-64 p-4 flex flex-col shrink-0 z-20 relative"
                  >
                    <Card className="h-full flex flex-col items-center lg:items-stretch p-4 gap-6 !bg-white/10 dark:!bg-black/10 !backdrop-blur-md !border-white dark:!border-white/20 !shadow-lg opacity-80">
                      <div className="flex items-center justify-center lg:justify-start gap-3 px-2 py-2 shrink-0">
                         <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <Box className="text-white relative z-10" size={20} />
                         </div>
                         <h1 className="hidden lg:block font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                            Droid
                         </h1>
                      </div>
        
                      <nav className="flex-1 flex flex-col gap-3 w-full items-center lg:items-stretch">
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <div className="w-full flex justify-center lg:block">
                               <Button 
                                  variant="ghost" 
                                  className="justify-center lg:justify-start gap-3 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 h-12 w-12 lg:w-full p-0 lg:px-4 group rounded-xl"
                                  onClick={addModal.open}
                               >
                                  <Plus size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                                  <span className="hidden lg:block font-medium truncate">添加密钥</span>
                               </Button>
                             </div>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="lg:hidden">
                             <p>添加密钥</p>
                           </TooltipContent>
                         </Tooltip>
                         
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <div className="w-full flex justify-center lg:block">
                               <Button 
                                  variant="ghost" 
                                  className="justify-center lg:justify-start gap-3 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 h-12 w-12 lg:w-full p-0 lg:px-4 group rounded-xl"
                                  onClick={batchModal.open}
                               >
                                  <Upload size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                                  <span className="hidden lg:block font-medium truncate">批量导入</span>
                               </Button>
                             </div>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="lg:hidden">
                             <p>批量导入</p>
                           </TooltipContent>
                         </Tooltip>
        
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <div className="w-full flex justify-center lg:block">
                               <Button 
                                  variant="ghost" 
                                  className="justify-center lg:justify-start gap-3 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 h-12 w-12 lg:w-full p-0 lg:px-4 group rounded-xl"
                                  onClick={promptModal.open}
                               >
                                  <FileText size={20} className="group-hover:scale-110 transition-transform shrink-0" />
                                  <span className="hidden lg:block font-medium truncate">系统提示词</span>
                               </Button>
                             </div>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="lg:hidden">
                             <p>系统提示词</p>
                           </TooltipContent>
                         </Tooltip>

                         <Tooltip>
                           <TooltipTrigger asChild>
                             <div className="w-full flex justify-center lg:block">
                               <Button 
                                  variant="ghost" 
                                  className="justify-center lg:justify-start gap-3 text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 h-12 w-12 lg:w-full p-0 lg:px-4 group rounded-xl"
                                  onClick={settingsModal.open}
                               >
                                  <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500 shrink-0" />
                                  <span className="hidden lg:block font-medium truncate">界面设置</span>
                               </Button>
                             </div>
                           </TooltipTrigger>
                           <TooltipContent side="right" className="lg:hidden">
                             <p>界面设置</p>
                           </TooltipContent>
                         </Tooltip>
                      </nav>
        
                      <div className="flex justify-center lg:justify-start px-0 lg:px-2 shrink-0 w-full">
                         <ThemeToggle />
                      </div>
                    </Card>
                  </motion.div>
        
                  {/* Main Content */}
                  <div className="flex-1 flex flex-col h-screen p-4 pl-0 gap-4 overflow-hidden">
                    {/* Top Bar */}
                    <Card className="h-28 px-6 flex items-center justify-between shrink-0 z-30 !bg-white/10 dark:!bg-black/10 !backdrop-blur-md !border-white dark:!border-white/20 !shadow-lg relative overflow-visible opacity-80">
                       <div>
                          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">密钥管理</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">管理您的 API 访问密钥</p>
                       </div>
                       <div className="flex items-center gap-4">
                           <ModelSelector />
                       </div>
                    </Card>
        
                    {/* Content Area */}
                    <div className="flex-1 relative rounded-3xl overflow-hidden flex flex-col p-1">
                       {loading && providers.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center">
                           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                           <p className="mt-4 text-gray-500 font-medium">正在加载密钥...</p>
                         </div>
                       ) : (
                         <ProviderList
                           providers={providers}
                           activeProviderId={activeProvider?.id}
                           onSwitch={switchProvider}
                           onDisable={disableProvider}
                           onDelete={handleDeleteProvider}
                           onNotify={(message, type) => {
                              if (type === 'error') toast.error(message);
                              else toast.success(message);
                           }}
                         />
                       )}
                    </div>
                  </div>
        
                  {/* Modals */}
                  {addModal.isOpen && (
                    <AddProviderForm
                      onAdd={handleAddProvider}
                      onClose={addModal.close}
                    />
                  )}
        
                  {batchModal.isOpen && (
                    <BatchImport
                      onImport={handleBatchImport}
                      onClose={batchModal.close}
                    />
                  )}
        
                                      <Dialog open={settingsModal.isOpen} onOpenChange={(open) => !open && settingsModal.close()}>
                                        <DialogContent className="max-w-md max-h-[85vh] flex flex-col !rounded-3xl !p-0 gap-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                                          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/10 dark:border-white/10 shrink-0">
                                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">界面设置</DialogTitle>
                                          </div>
                                          <div className="overflow-y-auto flex-1">
                                            <BackgroundSettings />
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                                      <Dialog open={promptModal.isOpen} onOpenChange={(open) => !open && promptModal.close()}>
                                        <DialogContent className="max-w-5xl h-[80vh] flex flex-col !rounded-3xl !p-0 gap-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden">
                                          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/10 dark:border-white/10 shrink-0">
                                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">系统提示词</DialogTitle>
                                          </div>
                                          <div className="overflow-y-auto flex-1">
                                            <SystemPromptEditor 
                                              onNotify={(message, type) => {
                                                if (type === 'error') toast.error(message);
                                                else toast.success(message);
                                              }}
                                            />
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                  {confirmDialog && (
                    <ConfirmDialog
                      isOpen={confirmDialog.isOpen}
                      title={confirmDialog.title}
                      message={confirmDialog.message}
                      onConfirm={confirmDialog.onConfirm}
                      onCancel={() => setConfirmDialog(null)}
                    />
                  )}
                </div>      </BackgroundProvider>
    </TooltipProvider>
  );
}

export default App;
