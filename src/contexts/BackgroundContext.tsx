import React, { createContext, useContext, useState, useEffect } from 'react';

export type BackgroundType = 'starry' | 'gradient' | 'grid' | 'particles' | 'matrix' | 'snow';
export type BackgroundTheme = 'default' | 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'pink' | 'cyan' | 'yellow';
export type BackgroundDensity = 'low' | 'medium' | 'high';
export type BackgroundSpeed = 'slow' | 'normal' | 'fast';

interface BackgroundSettings {
  enabled: boolean;
  type: BackgroundType;
  theme: BackgroundTheme;
  density: BackgroundDensity;
  speed: BackgroundSpeed;
}

interface BackgroundContextType {
  settings: BackgroundSettings;
  updateSettings: (newSettings: Partial<BackgroundSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: BackgroundSettings = {
  enabled: true,
  type: 'starry',
  theme: 'default',
  density: 'medium',
  speed: 'normal',
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BackgroundSettings>(() => {
    const saved = localStorage.getItem('droid-bg-settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('droid-bg-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<BackgroundSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <BackgroundContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
