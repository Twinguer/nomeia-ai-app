import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';

export type RankingInfoTab = 'stats' | 'concurso';

type Props = {
  /** Aba exibida ao abrir a tela (padrão: estatísticas). */
  initialTab?: RankingInfoTab;
  statsContent: React.ReactNode;
  concursoContent: React.ReactNode;
};

export function RankingInfoTabs({
  initialTab = 'stats',
  statsContent,
  concursoContent,
}: Props) {
  const { colors } = useAppTheme();
  const [active, setActive] = useState<RankingInfoTab>(initialTab);

  return (
    <View style={styles.wrap}>
      <View style={[styles.tabBar, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TabButton
          label="Estatísticas"
          selected={active === 'stats'}
          onPress={() => setActive('stats')}
          colors={colors}
        />
        <TabButton
          label="Concurso"
          selected={active === 'concurso'}
          onPress={() => setActive('concurso')}
          colors={colors}
        />
      </View>
      <View style={styles.panel}>{active === 'stats' ? statsContent : concursoContent}</View>
    </View>
  );
}

function TabButton({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        selected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}>
      <Text
        style={[
          styles.tabLabel,
          { color: selected ? colors.primaryDark : colors.textMuted },
          selected && styles.tabLabelActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  panel: {
    minHeight: 0,
  },
});
