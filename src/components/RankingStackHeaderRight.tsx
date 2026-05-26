import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { RankingOverflowMenu } from '@/components/RankingOverflowMenu';
import { useAppTheme } from '@/contexts/AppThemeContext';

type Props = {
  concursoId: string;
  concursoTitle?: string;
};

/** Voltar + menu ⋮ no lado direito do cabeçalho (classificação). */
export function RankingStackHeaderRight({ concursoId, concursoTitle }: Props) {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Ionicons name="chevron-back" size={26} color={colors.primaryDark} />
      </Pressable>
      <RankingOverflowMenu concursoId={concursoId} concursoTitle={concursoTitle} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  back: {
    marginRight: 2,
    marginLeft: -4,
  },
});
