import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppThemeProvider, useAppTheme } from '@/contexts/AppThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Brand } from '@/constants/brand';
import { isSupabaseConfigured } from '@/lib/env';

function RootNavigator() {
  const { loading } = useAuth();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen
        name="cargos/[id]"
        options={{
          headerShown: true,
          title: 'Cargos',
          headerTintColor: colors.primaryDark,
          headerStyle: { backgroundColor: colors.surface },
        }}
      />
      <Stack.Screen
        name="ranking/[id]"
        options={{
          headerShown: true,
          title: 'Classificação',
          headerTintColor: colors.primaryDark,
          headerStyle: { backgroundColor: colors.surface },
        }}
      />
      <Stack.Screen name="notifications" options={{ headerShown: true }} />
      <Stack.Screen name="participar" options={{ headerShown: true }} />
    </Stack>
  );
}

/** Evita rodar auth/Supabase durante SSR no web. */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function ThemedStatusBar() {
  const { colors } = useAppTheme();
  return <StatusBar style={colors.isDark ? 'light' : 'dark'} />;
}

function ConfigRequired() {
  return (
    <View style={styles.configBox}>
      <Text style={styles.configTitle}>Configuração necessária</Text>
      <Text style={styles.configText}>
        Crie o arquivo .env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
        (mesmos valores do projeto web).
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  if (!isSupabaseConfigured()) {
    return (
      <SafeAreaProvider>
        <ConfigRequired />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ClientOnly>
          <AppThemeProvider>
            <AuthProvider>
              <ThemedStatusBar />
              <RootNavigator />
            </AuthProvider>
          </AppThemeProvider>
        </ClientOnly>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  configBox: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Brand.background,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
    marginBottom: 12,
  },
  configText: {
    fontSize: 15,
    lineHeight: 22,
    color: Brand.textMuted,
  },
});
