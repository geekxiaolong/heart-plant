import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EmotionalTheme = 'kinship' | 'romance' | 'friendship' | 'solo';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  bg: string;
  card: string;
  text: string;
  accent: string;
  gradient: string;
}

interface ThemeContextType {
  theme: EmotionalTheme;
  setTheme: (theme: EmotionalTheme) => void;
  themeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: Record<EmotionalTheme, ThemeConfig> = {
  kinship: {
    primary: '#FFBB00',
    secondary: '#FFF7E6',
    bg: '#FFFAF0',
    card: '#FFFFFF',
    text: '#4A3200',
    accent: '#FF8800',
    gradient: 'from-orange-400 to-amber-500',
  },
  romance: {
    primary: '#D946EF',
    secondary: '#FDF4FF',
    bg: '#FFF1F2',
    card: '#FFFFFF',
    text: '#4C0519',
    accent: '#E11D48',
    gradient: 'from-pink-400 to-purple-500',
  },
  friendship: {
    primary: '#22C55E',
    secondary: '#F0FDF4',
    bg: '#F7FEE7',
    card: '#FFFFFF',
    text: '#064E3B',
    accent: '#FACC15',
    gradient: 'from-green-400 to-yellow-500',
  },
  solo: {
    primary: '#2F4F4F',
    secondary: '#F1F5F9',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    accent: '#64748B',
    gradient: 'from-slate-700 to-teal-900',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<EmotionalTheme>('kinship');

  const value = {
    theme,
    setTheme,
    themeConfig: themes[theme],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useEmotionalTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEmotionalTheme must be used within a ThemeProvider');
  }
  return context;
}
