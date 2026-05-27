import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthenticatedWebView } from '@/components/AuthenticatedWebView';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { NOMEIA_PORTAL_URL } from '@/constants/brand';

export default function PortalScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Portal',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}>
        <AuthenticatedWebView targetUrl={NOMEIA_PORTAL_URL} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
