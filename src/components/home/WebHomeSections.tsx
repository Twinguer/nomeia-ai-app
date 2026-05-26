import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppFooter } from '@/components/home/AppFooter';
import { HomeLogoHero } from '@/components/home/HomeLogoHero';
import { useAppTheme } from '@/contexts/AppThemeContext';

const FEATURES = [
  {
    image: require('../../../assets/images/img-03.png'),
    icon: 'document-text-outline' as const,
    title: 'Mantenha o foco',
    text: 'É importante que tenhamos tudo por perto, inclusive como estão os meus resultados e o dos outros candidatos.',
  },
  {
    image: require('../../../assets/images/img-04.png'),
    icon: 'trophy-outline' as const,
    title: 'Cabeça fria',
    text: 'Com o Nomeia Aí vamos para a prova sabendo quem são os nossos concorrentes e em que nível eles estão.',
  },
  {
    image: require('../../../assets/images/img-05.png'),
    icon: 'briefcase-outline' as const,
    title: 'Nomeações',
    text: 'Como estamos todos aqui, acompanhe as nomeações. Veja se quem está melhor colocado assumiu o cargo.',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

type Props = {
  /** Quando true, não renderiza o hero (logo) — use com HomeLogoHero na tela pai. */
  skipHero?: boolean;
};

export function WebHomeSections({ skipHero = false }: Props) {
  const { colors } = useAppTheme();

  return (
    <View>
      {!skipHero ? <HomeLogoHero /> : null}

      {/* Features */}
      <View style={[styles.featuresSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Siga pessoas com o mesmo propósito que o seu.
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Uma plataforma para acompanhar seus resultados. Uma comunidade para quem é concurseiro.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          decelerationRate="fast"
          snapToInterval={SCREEN_W * 0.82 + 12}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={[
                styles.featureCard,
                {
                  width: SCREEN_W * 0.82,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Image source={f.image} style={styles.featureImage} contentFit="cover" />
              <View style={styles.featureBody}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={f.icon} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.featureText, { color: colors.textMuted }]}>{f.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CTA band */}
      <View style={[styles.ctaBand, { backgroundColor: colors.primary }]}>
        <Text style={styles.ctaBandTitle}>Pronto para conquistar sua aprovação?</Text>
        <Text style={styles.ctaBandText}>
          Junte-se a nós e vamos juntos iniciar uma comunidade onde temos o mesmo propósito: a tão
          sonhada nomeação para o cargo dos sonhos!
        </Text>
      </View>

      <AppFooter />
    </View>
  );
}

const styles = StyleSheet.create({
  featuresSection: {
    paddingVertical: 28,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  carousel: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featureCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 12,
  },
  featureImage: {
    width: '100%',
    height: 140,
  },
  featureBody: {
    padding: 16,
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaBand: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaBandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaBandText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
});
