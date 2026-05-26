import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Storage em memória para SSR/Node (sem window). */
const memoryStore = new Map<string, string>();

const memoryStorage = {
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
};

export function getSupabaseAuthStorage() {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }

  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => localStorage.getItem(key),
      setItem: async (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      removeItem: async (key: string) => {
        localStorage.removeItem(key);
      },
    };
  }

  return AsyncStorage;
}

export function canPersistAuthSession(): boolean {
  return typeof window !== 'undefined';
}
