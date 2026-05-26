import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme as useSystemScheme } from 'react-native';

const STORAGE_KEY = 'nomeia_theme_mode';

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  heroGradientStart: string;
  heroGradientEnd: string;
  cardShadow: string;
  isDark: boolean;
};

const light: Omit<ThemeColors, 'isDark'> = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#D1FAE5',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  heroGradientStart: '#ECFDF5',
  heroGradientEnd: '#F8FAFC',
  cardShadow: '#0f172a',
};

const dark: Omit<ThemeColors, 'isDark'> = {
  primary: '#34D399',
  primaryDark: '#10B981',
  primaryLight: '#064E3B',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
  danger: '#F87171',
  heroGradientStart: '#0F172A',
  heroGradientEnd: '#1E293B',
  cardShadow: '#000000',
};

type Ctx = {
  colors: ThemeColors;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
};

const AppThemeContext = createContext<Ctx | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [preferDark, setPreferDark] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'dark') setPreferDark(true);
      else if (v === 'light') setPreferDark(false);
      else setPreferDark(system === 'dark');
    });
  }, [system]);

  const isDark = preferDark ?? system === 'dark';

  const setDarkMode = useCallback((value: boolean) => {
    setPreferDark(value);
    AsyncStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDark);
  }, [isDark, setDarkMode]);

  const colors = useMemo<ThemeColors>(
    () => ({ ...(isDark ? dark : light), isDark }),
    [isDark]
  );

  const value = useMemo(
    () => ({ colors, toggleDarkMode, setDarkMode }),
    [colors, toggleDarkMode, setDarkMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    return {
      colors: { ...light, isDark: false } as ThemeColors,
      toggleDarkMode: () => {},
      setDarkMode: () => {},
    };
  }
  return ctx;
}
