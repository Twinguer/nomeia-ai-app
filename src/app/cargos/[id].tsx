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
import { Brand } from '@/constants/brand';
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.primaryDark} />
          <Text style={styles.backText}>Voltar para Rankings</Text>
        </Pressable>

        {generalQuery.data ? (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {generalQuery.data.titulo || generalQuery.data.orgao}
            </Text>
            {generalQuery.data.banca ? (
              <View style={styles.bancaPill}>
                <Text style={styles.bancaPillText}>{generalQuery.data.banca}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {showStatePicker ? (
          <>
            <Text style={styles.sectionTitle}>Selecione um Estado</Text>
            <FlatList
              data={[...ESTADOS_BRASILEIROS]}
              keyExtractor={(uf) => uf}
              numColumns={3}
              columnWrapperStyle={styles.stateRow}
              contentContainerStyle={styles.stateGrid}
              renderItem={({ item: uf }) => (
                <Pressable
                  style={styles.stateCard}
                  onPress={() => setSelectedState(uf)}>
                  <Text style={styles.stateText}>{uf}</Text>
                </Pressable>
              )}
            />
          </>
        ) : generalQuery.isLoading || cargosQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Brand.primary} />
            <Text style={styles.loadingText}>Carregando cargos...</Text>
          </View>
        ) : cargosQuery.isError ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{(cargosQuery.error as Error).message}</Text>
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
                tintColor={Brand.primary}
              />
            }
            ListHeaderComponent={
              generalQuery.data?.isUnified && selectedState ? (
                <View style={styles.breadcrumb}>
                  <Pressable onPress={() => setSelectedState('')}>
                    <Text style={styles.breadcrumbLink}>Estados</Text>
                  </Pressable>
                  <Text style={styles.breadcrumbSep}> / </Text>
                  <Text style={styles.breadcrumbCurrent}>{selectedState}</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <Text style={styles.empty}>Nenhum cargo encontrado para este filtro.</Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.background },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontWeight: '600', color: Brand.primaryDark },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Brand.text, marginBottom: 8 },
  bancaPill: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bancaPillText: { fontSize: 12, fontWeight: '600', color: Brand.primaryDark },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: Brand.text,
  },
  stateGrid: { paddingHorizontal: 12, paddingBottom: 24 },
  stateRow: { gap: 8, marginBottom: 8 },
  stateCard: {
    flex: 1,
    backgroundColor: Brand.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stateText: { fontSize: 16, fontWeight: '700', color: Brand.text },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: Brand.textMuted },
  error: { color: Brand.danger, textAlign: 'center', padding: 24 },
  empty: { textAlign: 'center', color: Brand.textMuted, marginTop: 32 },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breadcrumbLink: { color: Brand.primary, fontWeight: '600' },
  breadcrumbSep: { color: Brand.textMuted },
  breadcrumbCurrent: { fontWeight: '700', color: Brand.text },
});
