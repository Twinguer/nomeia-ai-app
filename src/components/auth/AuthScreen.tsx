import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { useAuthActions } from '@/hooks/useAuthActions';
import { PasswordValidator } from '@/utils/passwordValidator';

type Tab = 'login' | 'signup';

export function AuthScreen() {
  const router = useRouter();
  const {
    isLoading,
    isLocked,
    lockoutEnd,
    loadingProvider,
    handleLogin,
    handleSignup,
    resendConfirmationEmail,
    signInWithProvider,
    openWebAuth,
    openForgotPassword,
  } = useAuthActions();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const pwValidation = PasswordValidator.validate(password);
  const lockoutMins =
    lockoutEnd && lockoutEnd > Date.now()
      ? Math.ceil((lockoutEnd - Date.now()) / 60000)
      : 0;

  async function onLogin() {
    setError(null);
    setInfo(null);
    const result = await handleLogin(email, password);
    if (result.success) return;
    if (result.emailNotConfirmed) {
      setShowResend(true);
      setError('Email não confirmado. Reenvie o email de confirmação.');
      return;
    }
    setError(result.error ?? 'Falha no login');
  }

  async function onSignup() {
    setError(null);
    setInfo(null);
    if (password !== confirmPassword) {
      setError('Senhas não conferem');
      return;
    }
    const result = await handleSignup(email, password, name, nickname || undefined);
    if (result.needsWebVerification) {
      Alert.alert(
        'Verificação de segurança',
        'Para criar conta com a mesma proteção do site, conclua o cadastro em nomeiai.com.br.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir site', onPress: openWebAuth },
        ]
      );
      return;
    }
    if (result.success) {
      setInfo(result.error ?? 'Cadastro realizado. Verifique seu email.');
      setTab('login');
      return;
    }
    setError(result.error ?? 'Erro ao criar conta');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/images/footer-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, tab === 'login' && styles.tabActive]}
                onPress={() => {
                  setTab('login');
                  setError(null);
                }}>
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                  Login
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, tab === 'signup' && styles.tabActive]}
                onPress={() => {
                  setTab('signup');
                  setError(null);
                }}>
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                  Cadastro
                </Text>
              </Pressable>
            </View>

            {isLocked && lockoutMins > 0 ? (
              <View style={styles.alertDanger}>
                <Text style={styles.alertTitle}>Conta temporariamente bloqueada</Text>
                <Text style={styles.alertBody}>
                  Muitas tentativas de login. Tente novamente em {lockoutMins} minutos.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.alertDanger}>
                <Text style={styles.alertBody}>{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View style={styles.alertOk}>
                <Text style={styles.alertBodyOk}>{info}</Text>
              </View>
            ) : null}

            {tab === 'login' ? (
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  placeholderTextColor={Brand.textMuted}
                  editable={!isLocked && !isLoading}
                />

                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholder="Digite sua senha"
                    placeholderTextColor={Brand.textMuted}
                    editable={!isLocked && !isLoading}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Brand.textMuted}
                    />
                  </Pressable>
                </View>

                <Pressable onPress={openForgotPassword} style={styles.forgot}>
                  <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </Pressable>

                {showResend ? (
                  <Pressable
                    style={styles.resendRow}
                    onPress={async () => {
                      const ok = await resendConfirmationEmail(email);
                      if (ok) {
                        setShowResend(false);
                        setInfo('Email de confirmação reenviado.');
                        setError(null);
                      }
                    }}>
                    <Text style={styles.resendText}>Reenviar confirmação</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[styles.primaryBtn, (isLocked || isLoading) && styles.btnDisabled]}
                  onPress={onLogin}
                  disabled={isLocked || isLoading}>
                  {isLoading && !loadingProvider ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Entrar</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nome Completo"
                  placeholderTextColor={Brand.textMuted}
                  editable={!isLoading}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="seu@email.com"
                  placeholderTextColor={Brand.textMuted}
                  editable={!isLoading}
                />

                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Digite sua senha"
                    placeholderTextColor={Brand.textMuted}
                    editable={!isLoading}
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Brand.textMuted}
                    />
                  </Pressable>
                </View>
                {password.length > 0 ? (
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${pwValidation.score}%`,
                          backgroundColor:
                            pwValidation.isValid ? Brand.primary : Brand.danger,
                        },
                      ]}
                    />
                  </View>
                ) : null}

                <Text style={styles.label}>Confirmar Senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirme sua senha"
                    placeholderTextColor={Brand.textMuted}
                    editable={!isLoading}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirmPassword((v) => !v)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Brand.textMuted}
                    />
                  </Pressable>
                </View>

                <Text style={styles.label}>Nickname (Opcional)</Text>
                <View style={styles.nickRow}>
                  <Text style={styles.nickAt}>@</Text>
                  <TextInput
                    style={[styles.input, styles.inputFlex, styles.nickInput]}
                    value={nickname}
                    onChangeText={(v) =>
                      setNickname(v.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 20))
                    }
                    placeholder="meunickname"
                    placeholderTextColor={Brand.textMuted}
                    editable={!isLoading}
                  />
                </View>

                <Pressable style={styles.webSignupHint} onPress={openWebAuth}>
                  <Text style={styles.webSignupText}>
                    Cadastro com verificação de segurança (igual ao site)
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  onPress={onSignup}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Criar conta</Text>
                  )}
                </Pressable>
              </View>
            )}

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU CONTINUE COM</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              {(['google', 'github'] as const).map((provider) => (
                <Pressable
                  key={provider}
                  style={[
                    styles.socialBtn,
                    provider === 'google' ? styles.socialGoogle : styles.socialGithub,
                  ]}
                  onPress={async () => {
                    setError(null);
                    const r = await signInWithProvider(provider);
                    if (!r.success && r.error) setError(r.error);
                  }}
                  disabled={isLoading}>
                  {loadingProvider === provider ? (
                    <ActivityIndicator color={provider === 'google' ? '#333' : '#fff'} />
                  ) : provider === 'google' ? (
                    <Text style={styles.socialLetter}>G</Text>
                  ) : (
                    <Ionicons name="logo-github" size={22} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>

            <Text style={styles.legal}>
              Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            </Text>

            <Pressable
              style={styles.outlineBtn}
              onPress={() => router.replace('/(tabs)' as Href)}>
              <Text style={styles.outlineBtnText}>Voltar para a página inicial</Text>
            </Pressable>

            <Text style={styles.footerLegal}>
              Ao criar uma conta, você concorda com nossos termos de serviço e política de
              privacidade.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0FDF9',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Brand.border,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoWrap: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 200,
    height: 128,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Brand.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Brand.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.textMuted,
  },
  tabTextActive: {
    color: Brand.text,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.text,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Brand.text,
  },
  inputFlex: {
    flex: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyeBtn: {
    padding: 10,
  },
  forgot: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    color: Brand.textMuted,
  },
  resendRow: {
    marginBottom: 8,
  },
  resendText: {
    color: Brand.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  strengthBar: {
    height: 4,
    backgroundColor: Brand.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  nickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nickAt: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    color: Brand.textMuted,
    fontSize: 16,
  },
  nickInput: {
    paddingLeft: 28,
  },
  webSignupHint: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Brand.primaryLight,
    borderRadius: 8,
  },
  webSignupText: {
    fontSize: 12,
    color: Brand.primaryDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.border,
  },
  dividerText: {
    fontSize: 10,
    color: Brand.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  socialGoogle: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB',
  },
  socialGithub: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  socialLetter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  legal: {
    fontSize: 11,
    color: Brand.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
  outlineBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  footerLegal: {
    fontSize: 12,
    color: Brand.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  alertDanger: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertTitle: {
    fontWeight: '700',
    color: Brand.danger,
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 13,
    color: '#B91C1C',
  },
  alertOk: {
    backgroundColor: Brand.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  alertBodyOk: {
    fontSize: 13,
    color: Brand.primaryDark,
  },
});
