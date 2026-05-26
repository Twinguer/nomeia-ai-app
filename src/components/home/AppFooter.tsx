import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';

const SITE = 'https://www.nomeiai.com.br';

async function openUrl(url: string) {
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
}

function FooterLink({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Pressable onPress={onPress} style={styles.linkRow}>
      <Text style={[styles.linkText, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

export function AppFooter() {
  const { colors } = useAppTheme();
  const year = new Date().getFullYear();

  return (
    <View>
      <View style={styles.instagramBand}>
        <Text style={styles.instagramTitle}>Siga a gente no Instagram</Text>
        <Text style={styles.instagramSub}>
          Dicas exclusivas, novidades e interações com a comunidade
        </Text>
        <Pressable
          style={styles.instagramBtn}
          onPress={() => openUrl('https://instagram.com/nomeia.ai')}>
          <Ionicons name="logo-instagram" size={20} color="#DB2777" />
          <Text style={styles.instagramBtnText}>@nomeia.ai</Text>
        </Pressable>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Image
          source={require('../../../assets/images/footer-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: colors.text }]}>Contatos</Text>
          <Pressable
            style={styles.contactRow}
            onPress={() => openUrl('mailto:contato@nomeiai.com.br')}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.contactText, { color: colors.textMuted }]}>
              contato@nomeiai.com.br
            </Text>
          </Pressable>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <Text style={[styles.contactText, { color: colors.textMuted }]}>São Paulo</Text>
          </View>
          <Pressable
            style={styles.contactRow}
            onPress={() => openUrl('https://instagram.com/nomeia.ai')}>
            <Ionicons name="logo-instagram" size={18} color={colors.textMuted} />
            <Text style={[styles.contactText, { color: colors.primary }]}>@nomeia.ai</Text>
          </Pressable>
        </View>

        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: colors.text }]}>Suporte</Text>
          <FooterLink label="FAQ" onPress={() => openUrl(`${SITE}/faq`)} colors={colors} />
          <FooterLink
            label="Contato"
            onPress={() => openUrl('mailto:contato@nomeiai.com.br')}
            colors={colors}
          />
          <FooterLink
            label="Termos de Uso"
            onPress={() => openUrl(`${SITE}/termos-de-uso`)}
            colors={colors}
          />
          <FooterLink
            label="Política de Privacidade"
            onPress={() => openUrl(`${SITE}/politica-de-privacidade`)}
            colors={colors}
          />
        </View>

        <Text style={[styles.copy, { color: colors.textMuted }]}>
          © {year} Nomeia Aí. Todos os direitos reservados.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  instagramBand: {
    backgroundColor: '#C13584',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instagramTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  instagramSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 320,
  },
  instagramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  instagramBtnText: {
    color: '#DB2777',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    gap: 24,
  },
  logo: {
    width: 180,
    height: 80,
    alignSelf: 'flex-start',
  },
  column: {
    gap: 10,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  linkRow: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
  },
  copy: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
