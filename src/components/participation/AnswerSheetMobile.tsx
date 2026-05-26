import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { useAppTheme } from '@/contexts/AppThemeContext';
import type { ConcursoParticipationDetail } from '@/types/participation';
import {
  fetchExistingAnswers,
  saveAnswersAndRecalculate,
} from '@/services/participationService';
import { getAnswerOptions, getTotalObjectiveQuestions } from '@/utils/examStructure';

type Props = {
  concurso: ConcursoParticipationDetail;
  rankingKey: string;
  userId: string;
  onSaved: () => void;
};

export function AnswerSheetMobile({ concurso, rankingKey, userId, onSaved }: Props) {
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [subjectives, setSubjectives] = useState<Record<string, number>>({});
  const [editCount, setEditCount] = useState(0);
  const [bookletId, setBookletId] = useState('');
  const [saving, setSaving] = useState(false);

  const totalQuestions = useMemo(() => getTotalObjectiveQuestions(concurso), [concurso]);
  const options = useMemo(() => getAnswerOptions(concurso.exam_type), [concurso.exam_type]);

  const existingQuery = useQuery({
    queryKey: ['existing-answers', userId, rankingKey],
    queryFn: () => fetchExistingAnswers(userId, rankingKey),
  });

  useEffect(() => {
    if (!existingQuery.data) return;
    setAnswers(existingQuery.data.answers);
    setSubjectives(existingQuery.data.subjectives);
    setEditCount(existingQuery.data.editCount);
    const b =
      existingQuery.data.selectedBookletId ??
      concurso.exam_booklets?.[0]?.id ??
      '';
    setBookletId(b);
  }, [existingQuery.data, concurso.exam_booklets]);

  const questionNumbers = useMemo(() => {
    const n = Math.max(totalQuestions, 0);
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [totalQuestions]);

  const setAnswer = (q: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [q]: value }));
  };

  const handleSave = async () => {
    if (!bookletId && (concurso.exam_booklets?.length ?? 0) > 0) {
      Alert.alert('Caderno', 'Caderno de prova não definido.');
      return;
    }
    const effectiveBooklet = bookletId || concurso.exam_booklets?.[0]?.id || 'default';
    setSaving(true);
    try {
      await saveAnswersAndRecalculate(userId, rankingKey, concurso, {
        answers,
        subjectives,
        editCount,
        selectedBookletId: effectiveBooklet,
      });
      await queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      await queryClient.invalidateQueries({ queryKey: ['participation', concurso.id] });
      Alert.alert('Salvo', 'Suas respostas foram salvas e a nota recalculada.', [
        { text: 'OK', onPress: onSaved },
      ]);
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (existingQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Cartão de respostas</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Edição {editCount + 1} · {questionNumbers.length} questões objetivas
      </Text>

      {concurso.subjects?.discr ? (
        <SubjectiveField
          label="Discursiva"
          value={String(subjectives.discursive ?? '')}
          onChange={(v) => setSubjectives((s) => ({ ...s, discursive: parseScore(v) }))}
          colors={colors}
        />
      ) : null}
      {concurso.subjects?.case1 ? (
        <SubjectiveField
          label="Estudo de caso 1"
          value={String(subjectives.case_study_1 ?? '')}
          onChange={(v) => setSubjectives((s) => ({ ...s, case_study_1: parseScore(v) }))}
          colors={colors}
        />
      ) : null}
      {concurso.subjects?.case2 ? (
        <SubjectiveField
          label="Estudo de caso 2"
          value={String(subjectives.case_study_2 ?? '')}
          onChange={(v) => setSubjectives((s) => ({ ...s, case_study_2: parseScore(v) }))}
          colors={colors}
        />
      ) : null}
      {concurso.subjects?.case3 ? (
        <SubjectiveField
          label="Estudo de caso 3"
          value={String(subjectives.case_study_3 ?? '')}
          onChange={(v) => setSubjectives((s) => ({ ...s, case_study_3: parseScore(v) }))}
          colors={colors}
        />
      ) : null}

      {questionNumbers.length === 0 ? (
        <Text style={{ color: colors.textMuted, marginVertical: 16 }}>
          Este concurso não possui questões objetivas configuradas. Salve apenas as notas
          subjetivas, se houver.
        </Text>
      ) : (
        questionNumbers.map((q) => (
          <View key={q} style={[styles.row, { borderColor: colors.border }]}>
            <Text style={[styles.qNum, { color: colors.text }]}>{q}</Text>
            <View style={styles.opts}>
              {options.map((opt) => {
                const selected = answers[q] === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setAnswer(q, opt)}
                    style={[
                      styles.opt,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primaryLight : colors.surface,
                      },
                    ]}>
                    <Text
                      style={{
                        color: selected ? colors.primaryDark : colors.text,
                        fontWeight: selected ? '800' : '500',
                      }}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      {saving ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <View style={{ marginTop: 20 }}>
          <PrimaryButton title="Salvar gabarito" onPress={handleSave} />
        </View>
      )}
    </ScrollView>
  );
}

function parseScore(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function SubjectiveField({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={styles.subjective}>
      <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  subjective: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    gap: 8,
  },
  qNum: { width: 32, fontWeight: '700', fontSize: 14 },
  opts: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  opt: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
});
