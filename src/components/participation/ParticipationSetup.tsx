import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { ConcursoParticipationDetail, QuotaOption } from '@/types/participation';
import {
  getAvailableQuotas,
  participateInRanking,
} from '@/services/participationService';

type Props = {
  concurso: ConcursoParticipationDetail;
  userId: string;
  onParticipated: (rankingKey: string) => void;
};

export function ParticipationSetup({ concurso, userId, onParticipated }: Props) {
  const { colors } = useAppTheme();
  const quotas = useMemo(() => getAvailableQuotas(concurso), [concurso]);
  const booklets = concurso.exam_booklets ?? [];

  const [quota, setQuota] = useState<QuotaOption>(quotas[0]?.value ?? 'Ampla Concorrência');
  const [bookletId, setBookletId] = useState<string>(
    booklets.length === 1 ? booklets[0].id : ''
  );
  const [loading, setLoading] = useState(false);

  const handleParticipate = async () => {
    if (booklets.length > 0 && !bookletId) {
      Alert.alert('Caderno', 'Selecione um caderno de prova.');
      return;
    }
    setLoading(true);
    try {
      const result = await participateInRanking(
        userId,
        concurso,
        quota,
        booklets.length > 0 ? bookletId : null
      );
      if (!result.success || !result.ranking_key) {
        Alert.alert('Participação', result.error ?? 'Não foi possível participar.');
        return;
      }
      onParticipated(result.ranking_key);
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{concurso.titulo}</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Escolha a cota e o caderno (se houver) para entrar no ranking.
      </Text>

      {quotas.length > 1 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cota</Text>
          {quotas.map((q) => (
            <Pressable
              key={q.value}
              onPress={() => setQuota(q.value)}
              style={[
                styles.option,
                {
                  borderColor: quota === q.value ? colors.primary : colors.border,
                  backgroundColor:
                    quota === q.value ? colors.primaryLight : colors.surface,
                },
              ]}>
              <Text style={{ color: colors.text, fontWeight: quota === q.value ? '700' : '500' }}>
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {booklets.length > 1 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Caderno</Text>
          {booklets.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => setBookletId(b.id)}
              style={[
                styles.option,
                {
                  borderColor: bookletId === b.id ? colors.primary : colors.border,
                  backgroundColor:
                    bookletId === b.id ? colors.primaryLight : colors.surface,
                },
              ]}>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: bookletId === b.id ? '700' : '500',
                }}>
                {b.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : (
        <PrimaryButton title="Participar do ranking" onPress={handleParticipate} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  section: { marginBottom: 20, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  option: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
});
