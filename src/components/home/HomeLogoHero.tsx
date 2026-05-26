import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;

import { useAppTheme } from '@/contexts/AppThemeContext';

/** Topo da Home: somente a logo da marca (sem textos). */
export function HomeLogoHero() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.hero, { backgroundColor: colors.heroGradientStart }]}>
      <Image
        source={require('../../../assets/images/footer-logo.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Nomeia Aí"
      />
    </View>
  );
}

const LOGO_W = Math.min(SCREEN_W - 40, 420);
const LOGO_H = LOGO_W * 0.48;

const styles = StyleSheet.create({
  hero: {
    minHeight: LOGO_H + 64,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
    alignSelf: 'center',
  },
});
