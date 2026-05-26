import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RankingListCard } from '@/components/RankingListCard';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { listConcursos } from '@/services/concursosService';
import type { RankingCardItem } from '@/types/ranking';

type Props = {
  onRenderCard: (item: RankingCardItem) => React.ReactElement;
};

export function RankingsSection({ onRenderCard }: Props) {
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['rankings-home'],
    queryFn: listConcursos,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return query.data ?? [];
    return (query.data ?? []).filter(
      (c) =>
        c.concursoTitle.toLowerCase().includes(term) ||
        (c.cargoTitle?.toLowerCase().includes(term) ?? false) ||
        (c.banca?.toLowerCase().includes(term) ?? false) ||
        (c.localidade?.toLowerCase().includes(term) ?? false)
    );
  }, [query.data, search]);

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Rankings Disponíveis</Text>
      {!session ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Faça login para abrir a classificação completa
        </Text>
      ) : null}

      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.search, { color: colors.text }]}
          placeholder="Buscar por órgão, banca ou local..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando rankings...
          </Text>
        </View>
      ) : query.isError ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {(query.error as Error).message}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => query.refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum ranking disponível</Text>
        </View>
      ) : (
        <View style={styles.list}>{filtered.map((item) => onRenderCard(item))}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  search: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 16,
  },
  list: {
    gap: 0,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: { fontSize: 15 },
  errorText: { textAlign: 'center', fontSize: 15 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
});
