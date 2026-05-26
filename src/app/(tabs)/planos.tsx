import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
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

import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/paymentService';

const PLANS = [
  {
    id: 'free',
    nome: 'Gratuito',
    preco: 'R$ 0',
    periodo: 'Livre',
    features: [
      'Cria rankings',
      'Participa dos rankings que criar',
      'Até 2 rankings de terceiros',
      'Vê só rankings em que participa',
      'Até 3 edições por gabarito',
    ],
  },
  {
    id: 'pro',
    nome: 'Aluno Pro',
    preco: 'R$ 14,90',
    periodo: '/mês',
    popular: true,
    features: [
      'Até 5 rankings simultâneos',
      'Visualiza todos os rankings',
      'Estatísticas completas',
      'Edições ilimitadas no gabarito',
      'Sem propaganda',
    ],
  },
] as const;

export default function PlanosTabScreen() {
  const { colors } = useAppTheme();
  const { session, user } = useAuth();
  const { isPro, isLoading, refetch, applyVoucher, validateDiscountVoucher } = useSubscription();
  const queryClient = useQueryClient();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [subscriptionVoucher, setSubscriptionVoucher] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      Alert.alert('Plano gratuito', 'Você já pode usar o plano Free. Assine o Pro para mais recursos.');
      return;
    }
    if (!session) {
      Alert.alert('Login necessário', 'Faça login para assinar o plano Pro.');
      return;
    }

    setLoadingPlan(planId);
    try {
      const checkout = await paymentService.createCheckout(planId, discountCode ?? undefined);
      const result = await WebBrowser.openAuthSessionAsync(
        checkout.url,
        'nomeia-rankings://planos'
      );

      if (result.type === 'success') {
        await paymentService.verifySubscription();
        await refetch();
        await queryClient.invalidateQueries({ queryKey: ['rankings-home'] });
        Alert.alert('Pagamento', 'Assinatura processada. Se o Pro não aparecer, aguarde alguns instantes.');
      }
    } catch (e) {
      Alert.alert('Erro', (e as Error).message || 'Não foi possível abrir o checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleApplySubscriptionVoucher = async () => {
    if (!subscriptionVoucher.trim()) return;
    setApplyingVoucher(true);
    try {
      await applyVoucher(subscriptionVoucher);
      Alert.alert('Sucesso', 'Cupom aplicado com sucesso!');
      setSubscriptionVoucher('');
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleValidateDiscount = async () => {
    if (!voucherCode.trim()) return;
    try {
      const result = (await validateDiscountVoucher(voucherCode)) as {
        valid?: boolean;
        error?: string;
      };
      if (result?.valid) {
        setDiscountCode(voucherCode.trim().toUpperCase());
        Alert.alert('Cupom', 'Desconto aplicado no checkout.');
      } else {
        Alert.alert('Cupom inválido', result?.error || 'Código não encontrado.');
      }
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: colors.text }]}>Planos</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {isLoading
          ? 'Carregando assinatura…'
          : isPro
            ? `Plano atual: Pro${user?.email ? ` · ${user.email}` : ''}`
            : 'Plano atual: Gratuito'}
      </Text>

      {PLANS.map((plan) => (
        <View
          key={plan.id}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: 'popular' in plan && plan.popular ? colors.primary : colors.border,
            },
          ]}>
          {'popular' in plan && plan.popular ? (
            <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.popularText}>Mais popular</Text>
            </View>
          ) : null}
          <Text style={[styles.planName, { color: colors.text }]}>{plan.nome}</Text>
          <Text style={[styles.planPrice, { color: colors.primaryDark }]}>
            {plan.preco}
            <Text style={[styles.planPeriod, { color: colors.textMuted }]}> {plan.periodo}</Text>
          </Text>
          {plan.features.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.textMuted }]}>{f}</Text>
            </View>
          ))}
          <Pressable
            style={[
              styles.cta,
              {
                backgroundColor:
                  plan.id === 'pro' && !isPro ? colors.primary : colors.border,
              },
            ]}
            disabled={plan.id === 'pro' && isPro}
            onPress={() => handleSubscribe(plan.id)}>
            {loadingPlan === plan.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.ctaText,
                  { color: plan.id === 'pro' && !isPro ? '#fff' : colors.textMuted },
                ]}>
                {plan.id === 'free'
                  ? 'Plano atual'
                  : isPro
                    ? 'Você é Pro'
                    : 'Assinar Pro'}
              </Text>
            )}
          </Pressable>
        </View>
      ))}

      <View style={[styles.voucherBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.voucherTitle, { color: colors.text }]}>Cupom de assinatura</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Código do cupom"
          placeholderTextColor={colors.textMuted}
          value={subscriptionVoucher}
          onChangeText={setSubscriptionVoucher}
          autoCapitalize="characters"
        />
        <Pressable
          style={[styles.cta, { backgroundColor: colors.primaryDark }]}
          onPress={handleApplySubscriptionVoucher}
          disabled={applyingVoucher}>
          {applyingVoucher ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Aplicar cupom</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.voucherBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.voucherTitle, { color: colors.text }]}>Desconto no checkout</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          placeholder="Cupom de desconto"
          placeholderTextColor={colors.textMuted}
          value={voucherCode}
          onChangeText={setVoucherCode}
          autoCapitalize="characters"
        />
        <Pressable
          style={[styles.ctaOutline, { borderColor: colors.primary }]}
          onPress={handleValidateDiscount}>
          <Text style={[styles.ctaOutlineText, { color: colors.primary }]}>Validar desconto</Text>
        </Pressable>
        {discountCode ? (
          <Text style={[styles.applied, { color: colors.primary }]}>
            Desconto ativo: {discountCode}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  heading: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 14, marginBottom: 8 },
  card: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    gap: 8,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  popularText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planName: { fontSize: 20, fontWeight: '800' },
  planPrice: { fontSize: 28, fontWeight: '800' },
  planPeriod: { fontSize: 14, fontWeight: '500' },
  featureRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureText: { flex: 1, fontSize: 14, lineHeight: 20 },
  cta: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ctaOutline: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  ctaOutlineText: { fontWeight: '600', fontSize: 15 },
  voucherBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  voucherTitle: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  applied: { fontSize: 13, fontWeight: '600' },
});
