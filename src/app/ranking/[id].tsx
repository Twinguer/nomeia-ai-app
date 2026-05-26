import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConcursoInfoHeader } from '@/components/ConcursoInfoHeader';
import { RankingInfoTabs } from '@/components/RankingInfoTabs';
import { RankingStackHeaderRight } from '@/components/RankingStackHeaderRight';
import { UserMenu } from '@/components/UserMenu';
import { RankingQuotaTabs } from '@/components/RankingQuotaTabs';
import { RankingStatsCard } from '@/components/RankingStatsCard';
import { RankingTable } from '@/components/RankingTable';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { getConcursoDetail } from '@/services/concursosService';
import { fetchUserRankings } from '@/services/rankingService';
import {
  enrichRankingsForDisplay,
  filterRankingsByTab,
  type QuotaTabKey,
} from '@/utils/rankingDisplay';

const PAGE_SIZE = 500;

export default function RankingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const concursoId = String(id);
  const { session, user } = useAuth();
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<QuotaTabKey>('ac');

  const concursoQuery = useQuery({
    queryKey: ['concurso-detail', concursoId],
    queryFn: () => getConcursoDetail(concursoId),
    enabled: Boolean(concursoId),
  });

  const rankingsQuery = useQuery({
    queryKey: ['rankings', concursoId],
    queryFn: () => fetchUserRankings(concursoId, undefined, 0, PAGE_SIZE),
    enabled: Boolean(concursoId) && !!session,
  });

  const enrichedRankings = useMemo(() => {
    const raw = rankingsQuery.data ?? [];
    return enrichRankingsForDisplay(raw, concursoQuery.data?.exam_type);
  }, [rankingsQuery.data, concursoQuery.data?.exam_type]);

  const displayRankings = useMemo(() => {
    return filterRankingsByTab(enrichedRankings, activeTab);
  }, [enrichedRankings, activeTab]);

  const concursoTitle =
    concursoQuery.data?.titulo ?? concursoQuery.data?.orgao ?? undefined;

  if (!session) {
    return <Redirect href="/login" />;
  }

  const listHeader = <RankingQuotaTabs active={activeTab} onChange={setActiveTab} />;

  const infoTabs =
    concursoQuery.data != null ? (
      <RankingInfoTabs
        initialTab="stats"
        statsContent={
          <RankingStatsCard
            concursoId={concursoId}
            participantCount={concursoQuery.data.participantCount}
            rankings={displayRankings}
            allRankings={enrichedRankings}
            userId={user?.id}
          />
        }
        concursoContent={<ConcursoInfoHeader concurso={concursoQuery.data} />}
      />
    ) : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTitle: () => null,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerBackVisible: false,
          headerLeft: () => <UserMenu />,
          headerRight: () => (
            <RankingStackHeaderRight concursoId={concursoId} concursoTitle={concursoTitle} />
          ),
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}>
        {rankingsQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : rankingsQuery.isError ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: colors.danger }]}>
              {(rankingsQuery.error as Error).message}
            </Text>
            <Text style={[styles.errorHint, { color: colors.textMuted }]}>
              Usuários Free só veem rankings em que participam. Assinantes Pro veem todos.
            </Text>
          </View>
        ) : Platform.OS === 'web' ? (
          <ScrollView
            style={styles.webScroll}
            contentContainerStyle={styles.webScrollContent}
            showsVerticalScrollIndicator>
            {infoTabs}
            <RankingTable
              rankings={displayRankings}
              concurso={concursoQuery.data ?? undefined}
              activeTab={activeTab}
              highlightUserId={user?.id}
              listHeader={listHeader}
            />
          </ScrollView>
        ) : (
          <>
            {infoTabs}
            <RankingTable
              rankings={displayRankings}
              concurso={concursoQuery.data ?? undefined}
              activeTab={activeTab}
              highlightUserId={user?.id}
              refreshing={rankingsQuery.isRefetching}
              onRefresh={() => rankingsQuery.refetch()}
              listHeader={listHeader}
            />
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webScroll: { flex: 1 },
  webScrollContent: { paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    textAlign: 'center',
    fontSize: 15,
  },
  errorHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
