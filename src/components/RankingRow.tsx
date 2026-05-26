import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import type { Ranking } from '@/services/rankingService';
import {
  formatRankingScore,
  getQuotaTagForName,
  type QuotaTabKey,
} from '@/utils/rankingDisplay';

type RowRanking = Ranking & { quotaPosition: number; eliminated: boolean };

type Props = {
  entry: RowRanking;
  activeTab: QuotaTabKey;
  highlight?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function RankingRow({ entry, activeTab, highlight }: Props) {
  const { colors } = useAppTheme();
  const eliminated = entry.eliminated;
  const red = colors.danger;
  const textColor = eliminated ? red : colors.text;
  const isAmplaTab = activeTab === 'ac';
  const colAc = eliminated
    ? 'E'
    : entry.position > 0
      ? `${entry.position}º`
      : '—';
  const colQuota = eliminated
    ? 'E'
    : entry.quotaPosition > 0
      ? `${entry.quotaPosition}º`
      : '—';
  const quotaTag = getQuotaTagForName(entry.reservationType, isAmplaTab);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: highlight && !eliminated ? colors.primaryLight : colors.surface,
          borderBottomColor: colors.border,
        },
      ]}>
      <Text style={[styles.position, { color: eliminated ? red : textColor }]}>
        {colAc}
      </Text>

      {!isAmplaTab ? (
        <Text style={[styles.positionQuota, { color: eliminated ? red : textColor }]}>
          {colQuota}
        </Text>
      ) : null}

      <View style={styles.candidate}>
        {entry.avatarUrl ? (
          <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.border }]}>
            <Text style={[styles.avatarInitials, { color: colors.textMuted }]}>
              {initials(entry.name)}
            </Text>
          </View>
        )}
        <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
          {entry.name}
          {quotaTag ? (
            <Text style={[styles.quotaTag, { color: eliminated ? red : colors.primaryDark }]}>
              {' '}
              {quotaTag}
            </Text>
          ) : null}
        </Text>
      </View>

      <Text style={[styles.score, { color: eliminated ? red : textColor }]}>
        {formatRankingScore(entry.score)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  position: {
    width: 36,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  positionQuota: {
    width: 36,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  candidate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  quotaTag: {
    fontSize: 15,
    fontWeight: '600',
  },
  score: {
    width: 56,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
});
