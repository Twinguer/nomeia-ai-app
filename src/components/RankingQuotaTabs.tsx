import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { QUOTA_TABS, type QuotaTabKey } from '@/utils/rankingDisplay';

type Props = {
  active: QuotaTabKey;
  onChange: (tab: QuotaTabKey) => void;
  available?: QuotaTabKey[];
};

export function RankingQuotaTabs({ active, onChange, available }: Props) {
  const { colors } = useAppTheme();
  const tabs = available
    ? QUOTA_TABS.filter((t) => available.includes(t.key))
    : QUOTA_TABS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: isActive ? '#fff' : colors.textMuted },
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  tab: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
});
