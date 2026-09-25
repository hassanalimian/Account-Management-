import React, { createContext, useContext, useState, useEffect } from 'react';

export interface IconSizeContextType {
  iconSize: number; // 50 to 150 (%)
  setIconSize: (size: number) => void;
  resetIconSize: () => void;
  scale: number; // multiplier decimal: 0.5 to 1.5
}

const STORAGE_KEY = 'accounting_erp_icon_size';
const DEFAULT_SIZE = 100;

const IconSizeContext = createContext<IconSizeContextType | undefined>(undefined);

export const IconSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [iconSize, setIconSizeState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= 50 && val <= 150) {
          return val;
        }
      }
    } catch {
      // LocalStorage might be disabled or unavailable in some environments
    }
    return DEFAULT_SIZE;
  });

  const setIconSize = (size: number) => {
    const clamped = Math.min(150, Math.max(50, Math.round(size)));
    setIconSizeState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // ignore
    }
  };

  const resetIconSize = () => {
    setIconSize(DEFAULT_SIZE);
  };

  const scale = iconSize / 100;

  useEffect(() => {
    // Inject and update CSS variables globally on document root
    document.documentElement.style.setProperty('--app-icon-scale', String(scale));
    document.documentElement.style.setProperty('--app-icon-size-percent', `${iconSize}%`);
  }, [scale, iconSize]);

  return (
    <IconSizeContext.Provider
      value={{
        iconSize,
        setIconSize,
        resetIconSize,
        scale,
      }}
    >
      {children}
    </IconSizeContext.Provider>
  );
};

export const useIconSize = (): IconSizeContextType => {
  const context = useContext(IconSizeContext);
  if (!context) {
    throw new Error('useIconSize must be used within an IconSizeProvider');
  }
  return context;
};
