import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { HomeLogoHero } from '@/components/home/HomeLogoHero';
import { WebHomeSections } from '@/components/home/WebHomeSections';
import { useAppTheme } from '@/contexts/AppThemeContext';

/** Home: apenas logo no topo; carrossel e CTA abaixo. */
export default function HomeTabScreen() {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}>
      <HomeLogoHero />
      <WebHomeSections skipHero />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
});
