import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { getSupabase } from '@/lib/supabase';
import { PasswordValidator } from '@/utils/passwordValidator';

WebBrowser.maybeCompleteAuthSession();

const LOCKOUT_KEY = 'auth_lockout_end';
const ATTEMPTS_KEY = 'auth_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LOCKOUT_KEY).then((raw) => {
      if (!raw) return;
      const end = parseInt(raw, 10);
      if (end > Date.now()) {
        setIsLocked(true);
        setLockoutEnd(end);
      } else {
        AsyncStorage.multiRemove([LOCKOUT_KEY, ATTEMPTS_KEY]);
      }
    });
  }, []);

  const applyLockout = useCallback(async () => {
    const end = Date.now() + LOCKOUT_MS;
    await AsyncStorage.setItem(LOCKOUT_KEY, String(end));
    setIsLocked(true);
    setLockoutEnd(end);
  }, []);

  const handleLogin = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; emailNotConfirmed?: boolean; error?: string }> => {
      if (isLocked && lockoutEnd) {
        const mins = Math.ceil((lockoutEnd - Date.now()) / 60000);
        return {
          success: false,
          error: `Conta bloqueada. Tente novamente em ${mins} minuto(s).`,
        };
      }

      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        return { success: false, error: 'Por favor, forneça um email válido.' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }

      setIsLoading(true);
      try {
        const { data, error } = await getSupabase().auth.signInWithPassword({
          email: trimmed,
          password,
        });

        if (error) {
          const attemptsRaw = await AsyncStorage.getItem(ATTEMPTS_KEY);
          const attempts = (parseInt(attemptsRaw ?? '0', 10) || 0) + 1;
          await AsyncStorage.setItem(ATTEMPTS_KEY, String(attempts));
          if (attempts >= MAX_ATTEMPTS) {
            await applyLockout();
            return {
              success: false,
              error: 'Muitas tentativas. Conta bloqueada por 15 minutos.',
            };
          }

          if (
            error.message?.toLowerCase().includes('email not confirmed') ||
            error.message?.toLowerCase().includes('not confirmed')
          ) {
            return { success: false, emailNotConfirmed: true, error: error.message };
          }
          return { success: false, error: error.message };
        }

        await AsyncStorage.multiRemove([ATTEMPTS_KEY, LOCKOUT_KEY]);
        setIsLocked(false);
        setLockoutEnd(null);

        if (data.session) {
          return { success: true };
        }
        return { success: false, error: 'Não foi possível iniciar sessão.' };
      } finally {
        setIsLoading(false);
      }
    },
    [isLocked, lockoutEnd, applyLockout]
  );

  const resendConfirmationEmail = useCallback(async (email: string): Promise<boolean> => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) return false;
    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email: trimmed,
    });
    return !error;
  }, []);

  const handleSignup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      nickname?: string
    ): Promise<{ success: boolean; error?: string; needsWebVerification?: boolean }> => {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      const nick = nickname?.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

      if (!EMAIL_RE.test(trimmedEmail)) {
        return { success: false, error: 'Por favor, forneça um email válido.' };
      }
      if (trimmedName.length < 2) {
        return { success: false, error: 'O nome deve ter pelo menos 2 caracteres.' };
      }
      const pw = PasswordValidator.validate(password);
      if (!pw.isValid) {
        return { success: false, error: pw.errors[0] ?? 'Senha não atende aos requisitos.' };
      }
      if (nick && (nick.length < 3 || !/^[a-z0-9_.]{3,20}$/.test(nick))) {
        return {
          success: false,
          error: 'Nickname inválido (3–20 caracteres: a-z, 0-9, _ ou .).',
        };
      }

      setIsLoading(true);
      try {
        const redirectTo =
          Platform.OS === 'web'
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/`
            : makeRedirectUri({ scheme: 'nomeia-rankings' });

        const { error } = await getSupabase().auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
              ...(nick ? { nickname: nick } : {}),
            },
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          if (error.message?.includes('captcha') || error.message?.includes('security')) {
            return {
              success: false,
              needsWebVerification: true,
              error: 'É necessário concluir o cadastro no site com verificação de segurança.',
            };
          }
          return { success: false, error: error.message };
        }

        return {
          success: true,
          error: 'Verifique seu email para confirmar o cadastro.',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signInWithProvider = useCallback(async (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    setIsLoading(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'nomeia-rankings' });
      const { data, error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        return { success: false, error: error?.message ?? 'OAuth indisponível' };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const hash = result.url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            await getSupabase().auth.setSession({ access_token, refresh_token });
            return { success: true };
          }
        }
      }
      return { success: false, error: 'Login social cancelado ou falhou.' };
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  }, []);

  const openWebAuth = useCallback(() => {
    Linking.openURL('https://www.nomeiai.com.br/auth');
  }, []);

  const openForgotPassword = useCallback(() => {
    Linking.openURL('https://www.nomeiai.com.br/auth/forgot-password');
  }, []);

  return {
    isLoading,
    isLocked,
    lockoutEnd,
    loadingProvider,
    handleLogin,
    handleSignup,
    resendConfirmationEmail,
    signInWithProvider,
    openWebAuth,
    openForgotPassword,
  };
}
