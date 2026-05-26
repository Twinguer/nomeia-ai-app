import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import type { RankingCardItem } from '@/types/ranking';

type Props = {
  concurso: RankingCardItem;
  requiresAuth?: boolean;
};

export function ConcursoCard({ concurso, requiresAuth }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => {
        if (requiresAuth) {
          router.push('/login');
          return;
        }
        router.push(`/ranking/${concurso.id}`);
      }}>
      <Text style={styles.title} numberOfLines={2}>
        {concurso.concursoTitle}
      </Text>
      {concurso.cargoTitle || concurso.banca ? (
        <Text style={styles.meta} numberOfLines={1}>
          {concurso.cargoTitle ?? ''}
          {concurso.banca ? ` · ${concurso.banca}` : ''}
        </Text>
      ) : null}
      {concurso.localidade ? (
        <Text style={styles.localidade} numberOfLines={1}>
          {concurso.localidade}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.badge}>{concurso.status ?? 'Em andamento'}</Text>
        <Text style={styles.inscritos}>{concurso.participantCount} inscritos</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  pressed: {
    opacity: 0.92,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: Brand.textMuted,
    marginBottom: 4,
  },
  localidade: {
    fontSize: 13,
    color: Brand.textMuted,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.primaryDark,
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  inscritos: {
    fontSize: 12,
    color: Brand.textMuted,
  },
});
