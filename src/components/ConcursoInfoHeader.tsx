import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import type { ConcursoDetail } from '@/types/ranking';
import { formatDetailDate } from '@/utils/formatDate';

type Props = {
  concurso: ConcursoDetail;
};

export function ConcursoInfoHeader({ concurso }: Props) {
  const { colors } = useAppTheme();
  const creator =
    concurso.creatorName ||
    (concurso.isAdminCreated ? 'Administrador' : 'Usuário');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.grid}>
        <InfoRow icon="calendar-outline" label="Data" value={formatDetailDate(concurso.created_at)} />
        <InfoRow
          icon="location-outline"
          label="Localidade"
          value={concurso.localidade || 'Não informado'}
        />
        <InfoRow
          icon="people-outline"
          label="Participantes"
          value={concurso.participantCount.toLocaleString('pt-BR')}
        />
        <InfoRow
          icon="briefcase-outline"
          label="Vagas"
          value={concurso.vagas != null ? String(concurso.vagas) : 'Não informado'}
        />
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.creator, { color: colors.textMuted }]}>Criado por: {creator}</Text>
        <Text style={[styles.banca, { color: colors.primary }]}>{concurso.banca || 'N/A'}</Text>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={[styles.infoText, { color: colors.text }]}>
        <Text style={{ color: colors.textMuted }}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  grid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  creator: {
    fontSize: 11,
    flex: 1,
  },
  banca: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
