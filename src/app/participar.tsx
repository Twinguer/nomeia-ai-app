import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnswerSheetMobile } from '@/components/participation/AnswerSheetMobile';
import { ParticipationSetup } from '@/components/participation/ParticipationSetup';
import { UserMenu } from '@/components/UserMenu';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkParticipation,
  getConcursoForParticipation,
} from '@/services/participationService';

export default function ParticiparScreen() {
  const { concursoId } = useLocalSearchParams<{ concursoId: string; title?: string }>();
  const router = useRouter();
  const { session, user } = useAuth();
  const { colors } = useAppTheme();
  const [rankingKey, setRankingKey] = useState<string | null>(null);

  const concursoQuery = useQuery({
    queryKey: ['concurso-participation', concursoId],
    queryFn: () => getConcursoForParticipation(String(concursoId)),
    enabled: !!concursoId && !!session,
  });

  const participationQuery = useQuery({
    queryKey: ['participation', concursoId, user?.id],
    queryFn: () => checkParticipation(String(concursoId), user!.id),
    enabled: !!concursoId && !!user?.id,
  });

  if (!session) return <Redirect href="/login" />;
  if (!concursoId) return null;

  const effectiveRankingKey =
    rankingKey ?? (participationQuery.data?.isParticipating ? participationQuery.data.rankingKey : null);

  const handleDone = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTitle: () => null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerLeft: () => <UserMenu />,
        }}
      />
      <SafeAreaView
        style={[styles.flex, { backgroundColor: colors.background }]}
        edges={['bottom']}>
        {concursoQuery.isLoading || participationQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : concursoQuery.data && user ? (
          effectiveRankingKey ? (
            <AnswerSheetMobile
              concurso={concursoQuery.data}
              rankingKey={effectiveRankingKey}
              userId={user.id}
              onSaved={handleDone}
            />
          ) : (
            <ParticipationSetup
              concurso={concursoQuery.data}
              userId={user.id}
              onParticipated={(key) => setRankingKey(key)}
            />
          )
        ) : null}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
