import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardWatermark } from '@/components/CardWatermark';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { RankingCardItem } from '@/types/ranking';
import { formatRankingDate } from '@/utils/formatDate';

type Props = {
  item: RankingCardItem;
  requiresAuth?: boolean;
};

export function RankingListCard({ item, requiresAuth }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const status = item.status || 'Em andamento';
  const isActive = !status || status === 'Em andamento';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
        pressed && styles.pressed,
      ]}
      onPress={() => {
        if (requiresAuth) {
          router.push('/login');
          return;
        }
        if (item.isGeneralCard) {
          router.push(`/cargos/${item.id}` as Href);
          return;
        }
        router.push(`/ranking/${item.id}`);
      }}>
      <CardWatermark uri={item.watermarkImageUrl} />
      <View style={styles.content}>
      <View style={styles.topRow}>
        {item.banca ? (
          <View style={styles.bancaBadge}>
            <Text style={styles.bancaText}>{item.banca}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.statusCol}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isActive ? colors.primaryLight : colors.background },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: isActive ? colors.primaryDark : colors.textMuted },
              ]}>
              {status}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatRankingDate(item.examDate)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {item.concursoTitle}
      </Text>
      {item.cargoTitle ? (
        <Text style={[styles.cargo, { color: colors.primaryDark }]} numberOfLines={2}>
          {item.cargoTitle}
        </Text>
      ) : null}

      {item.localidade ? (
        <View style={styles.localRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.localText, { color: colors.textMuted }]} numberOfLines={1}>
            {item.localidade}
          </Text>
        </View>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.participants}>
          <Ionicons name="people" size={16} color={colors.primary} />
          <Text style={[styles.participantsText, { color: colors.primaryDark }]}>
            {item.participantCount.toLocaleString('pt-BR')} participantes
          </Text>
        </View>
        <View style={styles.cta}>
          <Ionicons name="trophy" size={16} color={colors.primary} />
          <Text style={[styles.ctaText, { color: colors.primary }]}>Ver Ranking</Text>
        </View>
      </View>

      {(item.creatorName || item.isAdminCreated) && (
        <Text style={[styles.creator, { color: colors.textMuted }]} numberOfLines={1}>
          Criado por: {item.isAdminCreated ? 'Admin' : item.creatorName}
        </Text>
      )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ translateY: -1 }],
  },
  content: {
    padding: 18,
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bancaBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bancaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  cargo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  localText: {
    flex: 1,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  participantsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  creator: {
    marginTop: 8,
    fontSize: 11,
  },
});
