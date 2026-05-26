import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseStorageKey } from '@/services/paymentService';

export const NOMEIA_WEB_ORIGIN = 'https://www.nomeiai.com.br';

const MAX_REDIRECT_CORRECTIONS = 4;

type Props = {
  targetUrl: string;
  onTitleChange?: (title: string) => void;
};

function normalizeTargetUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('nomeiai.com.br')) {
      throw new Error('URL fora do domínio Nomeia Aí');
    }
    if (!parsed.hostname.startsWith('www.')) {
      parsed.hostname = `www.${parsed.hostname}`;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function targetPathname(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/$/, '') || '/';
  } catch {
    return url;
  }
}

function sessionToStorageJson(session: Session): string {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: session.user,
  });
}

/** Rotas SPA para as quais o site redireciona antes da sessão hidratar (ex.: participar → auth → /). */
function isSpaDriftPath(pathname: string, expectedPath: string): boolean {
  const current = pathname.replace(/\/$/, '') || '/';
  const expected = expectedPath.replace(/\/$/, '') || '/';
  if (current === expected) return false;
  if (current === '/' || current === '/index.html') return true;
  if (current === '/auth') return true;
  if (current.startsWith('/auth/') && !current.includes('reset-password')) return true;
  return false;
}

export function AuthenticatedWebView({ targetUrl, onTitleChange }: Props) {
  const { colors } = useAppTheme();
  const webRef = useRef<WebView>(null);
  const [pageReady, setPageReady] = useState(false);
  const redirectCorrectionsRef = useRef(0);
  const lastCorrectionAtRef = useRef(0);

  const resolvedUrl = useMemo(() => normalizeTargetUrl(targetUrl), [targetUrl]);
  const expectedPath = useMemo(() => targetPathname(resolvedUrl), [resolvedUrl]);

  const sessionQuery = useQuery({
    queryKey: ['webview-session'],
    queryFn: async () => {
      const { data, error } = await getSupabase().auth.getSession();
      if (error || !data.session) throw new Error('Sessão não encontrada');
      return data.session;
    },
  });

  const buildSessionScripts = useCallback(
    (session: Session) => {
      const storageKey = getSupabaseStorageKey();
      const sessionPayload = sessionToStorageJson(session);
      const target = resolvedUrl;
      const path = expectedPath;

      const persistSession = `
        try {
          localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(sessionPayload)});
          window.__NOMEIA_APP_EMBED__ = true;
        } catch (e) {}
      `;

      const goToTargetIfDrifted = `
        try {
          var expected = ${JSON.stringify(path)};
          var current = (window.location.pathname || '/').replace(/\\/$/, '') || '/';
          var expectedNorm = expected.replace(/\\/$/, '') || '/';
          if (current !== expectedNorm) {
            window.location.replace(${JSON.stringify(target)});
          }
        } catch (e) {}
      `;

      return {
        beforeContentLoaded: `(function(){ ${persistSession} true; })();`,
        ensureTarget: `(function(){ ${persistSession} ${goToTargetIfDrifted} true; })();`,
      };
    },
    [expectedPath, resolvedUrl]
  );

  const correctDriftIfNeeded = useCallback(
    (url: string | undefined) => {
      if (!url || !sessionQuery.data) return;

      let pathname: string;
      try {
        pathname = new URL(url).pathname;
      } catch {
        return;
      }

      if (!isSpaDriftPath(pathname, expectedPath)) {
        if (pathname.replace(/\/$/, '') === expectedPath.replace(/\/$/, '')) {
          setPageReady(true);
        }
        return;
      }

      const now = Date.now();
      if (now - lastCorrectionAtRef.current < 350) return;
      if (redirectCorrectionsRef.current >= MAX_REDIRECT_CORRECTIONS) return;

      redirectCorrectionsRef.current += 1;
      lastCorrectionAtRef.current = now;

      const scripts = buildSessionScripts(sessionQuery.data);
      webRef.current?.injectJavaScript(scripts.ensureTarget);
    },
    [buildSessionScripts, expectedPath, sessionQuery.data]
  );

  const handleLoadEnd = useCallback(() => {
    if (!sessionQuery.data) return;
    const scripts = buildSessionScripts(sessionQuery.data);
    webRef.current?.injectJavaScript(scripts.ensureTarget);
    setPageReady(true);
  }, [buildSessionScripts, sessionQuery.data]);

  const handleNavigationStateChange = useCallback(
    (nav: { url?: string; title?: string }) => {
      if (nav.title) onTitleChange?.(nav.title);
      correctDriftIfNeeded(nav.url);
    },
    [correctDriftIfNeeded, onTitleChange]
  );

  const beforeContentLoaded = useMemo(() => {
    if (!sessionQuery.data) return undefined;
    return buildSessionScripts(sessionQuery.data).beforeContentLoaded;
  }, [buildSessionScripts, sessionQuery.data]);

  if (sessionQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (sessionQuery.isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger, textAlign: 'center', paddingHorizontal: 24 }}>
          {(sessionQuery.error as Error).message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {!pageReady ? (
        <View style={[styles.overlay, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      <WebView
        ref={webRef}
        source={{ uri: resolvedUrl }}
        injectedJavaScriptBeforeContentLoaded={beforeContentLoaded}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        originWhitelist={['https://*', 'http://*']}
        setSupportMultipleWindows={Platform.OS === 'android' ? false : undefined}
        style={styles.flex}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
