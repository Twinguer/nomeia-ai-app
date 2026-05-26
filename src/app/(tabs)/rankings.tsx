import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { RankingsSection } from '@/components/home/RankingsSection';
import { RankingListCard } from '@/components/RankingListCard';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function RankingsTabScreen() {
  const { colors } = useAppTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['rankings-home'] });
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}>
      <RankingsSection
        onRenderCard={(item) => (
          <RankingListCard key={item.id} item={item} requiresAuth={!session} />
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
