import React from 'react';
import { Monitor, Zap, Grid, Box, Wand2, Gauge, Sparkles, Snowflake, CloudRain } from 'lucide-react';
import { useBackground, BackgroundType, BackgroundTheme, BackgroundDensity, BackgroundSpeed } from '../contexts/BackgroundContext';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { cn } from '../lib/utils';

export const BackgroundSettings = () => {
  const { settings, updateSettings, resetSettings } = useBackground();

  const bgTypes: { id: BackgroundType; label: string; icon: any; desc: string }[] = [
    { id: 'starry', label: '星空连接', icon: Zap, desc: '经典连线粒子' },
    { id: 'particles', label: '浮游粒子', icon: Box, desc: '上升的气泡' },
    { id: 'matrix', label: '雨落', icon: CloudRain, desc: '自然雨滴效果' },
    { id: 'snow', label: '落雪', icon: Snowflake, desc: '冬日静谧氛围' },
    { id: 'grid', label: '数码网格', icon: Grid, desc: '赛博朋克风格' },
    { id: 'gradient', label: '流光渐变', icon: Monitor, desc: '纯净呼吸背景' },
  ];

  const themes: { id: BackgroundTheme; label: string; color: string }[] = [
    { id: 'default', label: 'Slate', color: 'bg-slate-500' },
    { id: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { id: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { id: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { id: 'green', label: 'Green', color: 'bg-green-500' },
    { id: 'red', label: 'Red', color: 'bg-red-500' },
    { id: 'pink', label: 'Pink', color: 'bg-pink-500' },
    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
    { id: 'yellow', label: 'Yellow', color: 'bg-yellow-500' },
  ];

  const densities: { id: BackgroundDensity; label: string }[] = [
    { id: 'low', label: '简约' },
    { id: 'medium', label: '平衡' },
    { id: 'high', label: '丰富' },
  ];

  const speeds: { id: BackgroundSpeed; label: string }[] = [
    { id: 'slow', label: '舒缓' },
    { id: 'normal', label: '标准' },
    { id: 'fast', label: '活跃' },
  ];

  // 简单的分段控制器组件
  const SegmentedControl = <T extends string>({ 
    options, 
    value, 
    onChange 
  }: { 
    options: { id: T; label: string }[], 
    value: T, 
    onChange: (val: T) => void 
  }) => (
    <div className="flex p-1 bg-black/5 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
            value === opt.id
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 总开关 */}
      <div className="flex items-center justify-between p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl border border-blue-500/10">
        <div className="space-y-0.5">
          <Label className="text-base font-medium text-gray-900 dark:text-gray-100">启用背景动效</Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">开启以获得沉浸式视觉体验</p>
        </div>
        <Switch 
          checked={settings.enabled} 
          onCheckedChange={(checked) => updateSettings({ enabled: checked })} 
        />
      </div>

      <div className={cn("space-y-8 transition-all duration-300", !settings.enabled && "opacity-50 pointer-events-none filter grayscale-[0.5]")}>
        {/* 类型选择 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">动效风格</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bgTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => updateSettings({ type: type.id })}
                className={cn(
                  "cursor-pointer relative flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-200 group",
                  settings.type === type.id
                    ? "bg-blue-500/5 border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                    : "bg-white/50 dark:bg-white/5 border-transparent hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/5 dark:hover:border-white/10"
                )}
              >
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        settings.type === type.id ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    )}>
                      <type.icon size={18} />
                    </div>
                    {settings.type === type.id && (
                       <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    )}
                </div>
                <div>
                    <span className={cn(
                        "block text-sm font-medium transition-colors",
                        settings.type === type.id ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"
                    )}>{type.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{type.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 主题颜色 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">色彩氛围</Label>
          <div className="flex flex-wrap gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateSettings({ theme: theme.id })}
                className={cn(
                    "group relative w-10 h-10 rounded-full flex items-center justify-center transition-all outline-none",
                    settings.theme === theme.id ? "scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                )}
                title={theme.label}
              >
                {/* 选中时的外圈 */}
                <span className={cn(
                    "absolute inset-0 rounded-full border-2 opacity-0 transition-all duration-300",
                    settings.theme === theme.id 
                      ? "border-gray-400 dark:border-gray-500 scale-125 opacity-100" 
                      : "border-transparent scale-100"
                )} />
                
                {/* 颜色主体 */}
                <span className={cn(
                    "w-full h-full rounded-full shadow-sm transition-transform duration-300",
                    theme.color,
                    settings.theme === theme.id ? "scale-100" : "scale-90"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* 参数调节 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-gray-400" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">粒子密度</Label>
            </div>
            <SegmentedControl 
              options={densities} 
              value={settings.density} 
              onChange={(v) => updateSettings({ density: v })} 
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Gauge size={14} className="text-gray-400" />
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">动效速度</Label>
            </div>
            <SegmentedControl 
              options={speeds} 
              value={settings.speed} 
              onChange={(v) => updateSettings({ speed: v })} 
            />
          </div>
        </div>

        {/* 底部操作 */}
        <div className="pt-2">
          <Button 
              variant="ghost" 
              onClick={resetSettings}
              className="w-full text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              size="sm"
          >
              <Wand2 className="mr-2 h-3.5 w-3.5" />
              恢复默认配置
          </Button>
        </div>
      </div>
    </div>
  );
};