import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CardWatermark } from '@/components/CardWatermark';
import { Brand } from '@/constants/brand';
import type { CargoCardItem } from '@/types/ranking';
import { formatRankingDate } from '@/utils/formatDate';

type Props = {
  item: CargoCardItem;
};

export function CargoListCard({ item }: Props) {
  const router = useRouter();
  const status = item.status || 'Em andamento';
  const isActive = !status || status === 'Em andamento';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/ranking/${item.id}`)}>
      <CardWatermark uri={item.watermarkImageUrl} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.cargoLabel}>Cargo</Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.cargo}
            </Text>
          </View>
          <View style={styles.statusCol}>
            <View style={[styles.statusBadge, isActive && styles.statusActive]}>
              <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
                {status}
              </Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={Brand.textMuted} />
              <Text style={styles.dateText}>{formatRankingDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        {item.localidade ? (
          <View style={styles.localRow}>
            <Ionicons name="location-outline" size={14} color={Brand.textMuted} />
            <Text style={styles.localText} numberOfLines={1}>
              {item.localidade}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.participants}>
            <Ionicons name="people" size={16} color={Brand.primary} />
            <Text style={styles.participantsText}>
              {item.participantCount.toLocaleString('pt-BR')} participantes
            </Text>
          </View>
          <View style={styles.cta}>
            <Ionicons name="trophy" size={16} color={Brand.primary} />
            <Text style={styles.ctaText}>Ver Ranking</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    overflow: 'hidden',
    shadowColor: '#0f172a',
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
    color: Brand.textMuted,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.text,
    flex: 1,
    maxWidth: 220,
  },
  statusCol: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Brand.background,
  },
  statusActive: { backgroundColor: Brand.primaryLight },
  statusText: { fontSize: 11, fontWeight: '600', color: Brand.textMuted },
  statusTextActive: { color: Brand.primaryDark },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: Brand.textMuted },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  localText: { flex: 1, fontSize: 12, color: Brand.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  participants: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  participantsText: { fontSize: 13, fontWeight: '600', color: Brand.primaryDark },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaText: { fontSize: 13, fontWeight: '700', color: Brand.primary },
});
