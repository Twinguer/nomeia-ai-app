import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CargoListCard } from '@/components/CargoListCard';
import { UserMenu } from '@/components/UserMenu';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ESTADOS_BRASILEIROS, getGeneralCard, listCargos } from '@/services/cargosService';

export default function CargosScreen() {
  const { id, state } = useLocalSearchParams<{ id: string; state?: string }>();
  const generalId = String(id);
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const [selectedState, setSelectedState] = useState(state ?? '');

  useEffect(() => {
    if (state) setSelectedState(state);
  }, [state]);

  const generalQuery = useQuery({
    queryKey: ['general-card', generalId],
    queryFn: () => getGeneralCard(generalId),
    enabled: Boolean(generalId),
  });

  const cargosQuery = useQuery({
    queryKey: ['cargos', generalId, selectedState],
    queryFn: () =>
      listCargos(
        generalId,
        generalQuery.data?.isUnified && selectedState ? selectedState : undefined,
        generalQuery.data?.watermarkImageUrl
      ),
    enabled:
      Boolean(generalId) &&
      !!generalQuery.data &&
      (!generalQuery.data.isUnified || !!selectedState),
  });

  const showStatePicker = generalQuery.data?.isUnified && !selectedState;

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTitle: () => null,
          headerTintColor: colors.primaryDark,
          headerStyle: { backgroundColor: colors.surface },
          headerLeft: () => <UserMenu />,
        }}
      />
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
          <Text style={[styles.backText, { color: colors.primaryDark }]}>Voltar para Rankings</Text>
        </Pressable>

        {generalQuery.data ? (
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {generalQuery.data.titulo || generalQuery.data.orgao}
            </Text>
            {generalQuery.data.banca ? (
              <View style={[styles.bancaPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.bancaPillText, { color: colors.primaryDark }]}>
                  {generalQuery.data.banca}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {showStatePicker ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Selecione um Estado</Text>
            <FlatList
              data={[...ESTADOS_BRASILEIROS]}
              keyExtractor={(uf) => uf}
              numColumns={3}
              columnWrapperStyle={styles.stateRow}
              contentContainerStyle={styles.stateGrid}
              renderItem={({ item: uf }) => (
                <Pressable
                  style={[
                    styles.stateCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedState(uf)}>
                  <Text style={[styles.stateText, { color: colors.text }]}>{uf}</Text>
                </Pressable>
              )}
            />
          </>
        ) : generalQuery.isLoading || cargosQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Carregando cargos...</Text>
          </View>
        ) : cargosQuery.isError ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: colors.danger }]}>
              {(cargosQuery.error as Error).message}
            </Text>
          </View>
        ) : (
          <FlatList
            data={cargosQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CargoListCard item={item} />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={cargosQuery.isRefetching}
                onRefresh={() => cargosQuery.refetch()}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              generalQuery.data?.isUnified && selectedState ? (
                <View style={styles.breadcrumb}>
                  <Pressable onPress={() => setSelectedState('')}>
                    <Text style={[styles.breadcrumbLink, { color: colors.primary }]}>Estados</Text>
                  </Pressable>
                  <Text style={[styles.breadcrumbSep, { color: colors.textMuted }]}> / </Text>
                  <Text style={[styles.breadcrumbCurrent, { color: colors.text }]}>{selectedState}</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Nenhum cargo encontrado para este filtro.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontWeight: '600' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  bancaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bancaPillText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  stateGrid: { paddingHorizontal: 12, paddingBottom: 24 },
  stateRow: { gap: 8, marginBottom: 8 },
  stateCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stateText: { fontSize: 16, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: {},
  error: { textAlign: 'center', padding: 24 },
  empty: { textAlign: 'center', marginTop: 32 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breadcrumbLink: { fontWeight: '600' },
  breadcrumbSep: {},
  breadcrumbCurrent: { fontWeight: '700' },
});
