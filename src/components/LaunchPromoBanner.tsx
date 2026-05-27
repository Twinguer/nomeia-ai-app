import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { isLaunchProPromoActive, LAUNCH_PROMO_COPY } from '@/domain/launchPromo';

type Props = {
  compact?: boolean;
};

export function LaunchPromoBanner({ compact = false }: Props) {
  const { colors } = useAppTheme();

  if (!isLaunchProPromoActive()) {
    return null;
  }

  if (compact) {
    return (
      <Text style={[styles.compact, { color: colors.primaryDark }]}>
        <Ionicons name="sparkles" size={14} color={colors.primaryDark} />{' '}
        {LAUNCH_PROMO_COPY.bannerCompact}
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
      ]}>
      <View style={styles.bannerRow}>
        <Ionicons name="sparkles" size={18} color={colors.primaryDark} />
        <Text style={[styles.bannerText, { color: colors.text }]}>
          Promo de lançamento: cadastre-se e use o{' '}
          <Text style={styles.bannerStrong}>Aluno Pro completo grátis</Text>{' '}
          {LAUNCH_PROMO_COPY.durationLabel.toLowerCase()}. Depois, o plano gratuito continua
          disponível.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    fontSize: 13,
    lineHeight: 18,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bannerStrong: {
    fontWeight: '700',
  },
});
