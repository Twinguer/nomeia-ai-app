import { type Href, Redirect } from 'expo-router';
import React from 'react';

import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { session } = useAuth();

  if (session) {
    return <Redirect href={'/(tabs)' as Href} />;
  }

  return <AuthScreen />;
}
