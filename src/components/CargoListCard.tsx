import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardWatermark } from '@/components/CardWatermark';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { CargoCardItem } from '@/types/ranking';
import { formatRankingDate } from '@/utils/formatDate';

type Props = {
  item: CargoCardItem;
};

export function CargoListCard({ item }: Props) {
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
      onPress={() => router.push(`/ranking/${item.id}`)}>
      <CardWatermark uri={item.watermarkImageUrl} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.cargoLabel, { color: colors.textMuted }]}>Cargo</Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.cargo}
            </Text>
          </View>
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
                {formatRankingDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>

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
  pressed: { opacity: 0.94 },
  content: {
    padding: 18,
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  cargoLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    maxWidth: 220,
  },
  statusCol: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11 },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  localText: { flex: 1, fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  participants: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  participantsText: { fontSize: 13, fontWeight: '600' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaText: { fontSize: 13, fontWeight: '700' },
});
