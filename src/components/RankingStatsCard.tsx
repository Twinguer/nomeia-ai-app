import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import type { Ranking } from '@/services/rankingService';
import { fetchRankingStats } from '@/services/rankingService';
import { formatRankingScore, getLastClassifiedScore } from '@/utils/rankingDisplay';

type Props = {
  concursoId: string;
  participantCount: number;
  /** Participantes da cota ativa (para última nota classificada). */
  rankings: Ranking[];
  /** Todos os participantes (para posição do usuário em qualquer cota). */
  allRankings?: Ranking[];
  userId?: string;
};

export function RankingStatsCard({
  concursoId,
  participantCount,
  rankings,
  allRankings,
  userId,
}: Props) {
  const { colors } = useAppTheme();

  const statsQuery = useQuery({
    queryKey: ['ranking-stats', concursoId],
    queryFn: () => fetchRankingStats(concursoId),
    enabled: !!concursoId,
  });

  const userEntry = userId
    ? (allRankings ?? rankings).find((r) => r.userId === userId)
    : undefined;
  const stats = statsQuery.data;
  const lastClassifiedScore = getLastClassifiedScore(
    rankings as Array<{ score: number; eliminated?: boolean }>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {statsQuery.isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : null}

      <View style={styles.grid}>
        <StatItem
          label="Participantes"
          value={String(participantCount || stats?.total_participants || 0)}
          colors={colors}
        />
        {stats ? (
          <>
            <StatItem label="Nota média" value={formatRankingScore(stats.avg_score)} colors={colors} />
            <StatItem label="Nota máxima" value={formatRankingScore(stats.max_score)} colors={colors} />
            <StatItem
              label="Provável nota de corte"
              value={
                lastClassifiedScore != null
                  ? formatRankingScore(lastClassifiedScore)
                  : '—'
              }
              colors={colors}
            />
          </>
        ) : null}
      </View>

      {userEntry ? (
        <View style={[styles.userBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Text style={[styles.userLabel, { color: colors.text }]}>
            Sua posição:{' '}
            <Text style={styles.userValue}>
              {(userEntry as Ranking & { eliminated?: boolean }).eliminated
                ? 'E'
                : userEntry.position > 0
                  ? `${userEntry.position}º`
                  : '—'}
            </Text>
            {' · '}
            <Text style={styles.userValue}>{formatRankingScore(userEntry.score)} pts</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function StatItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.background }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  loader: { alignSelf: 'flex-end', marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    minWidth: '47%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 10,
  },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  userBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  userLabel: { fontSize: 14 },
  userValue: { fontWeight: '700' },
});
