import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/UserAvatar';
import { useNotifications } from '@/hooks/useNotifications';
import { fetchUserProfileMenu, resolveUserDisplayName } from '@/services/profileService';
import { getAvatarUrl } from '@/utils/avatarUtils';
import { NOMEIA_PORTAL_URL } from '@/constants/brand';

export function UserMenu() {
  const router = useRouter();
  const { session, user, signOut } = useAuth();
  const { colors, toggleDarkMode } = useAppTheme();
  const themeIsDark = colors.isDark;
  const [open, setOpen] = useState(false);

  const { unreadCount } = useNotifications();

  const profileQuery = useQuery({
    queryKey: ['user-profile-menu', user?.id],
    queryFn: () => fetchUserProfileMenu(user!.id),
    enabled: !!user?.id,
  });

  if (!session || !user) {
    return (
      <Pressable
        style={[styles.loginBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => router.push('/login')}>
        <Text style={[styles.loginText, { color: colors.text }]}>Fazer Login</Text>
      </Pressable>
    );
  }

  const metadataName = user.user_metadata?.name as string | undefined;
  const displayName = resolveUserDisplayName(profileQuery.data ?? undefined, {
    name: metadataName,
  });
  const avatarUrl = getAvatarUrl(profileQuery.data?.avatarUrl);

  return (
    <>
      <Pressable style={styles.headerRow} onPress={() => setOpen(true)} hitSlop={8}>
        <View style={styles.avatarWrap}>
          <UserAvatar name={displayName} avatarUrl={avatarUrl} />
          {unreadCount > 0 ? (
            <View style={[styles.unreadDot, { backgroundColor: colors.danger }]}>
              <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.menuName, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.menuEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            <MenuItem
              icon="notifications-outline"
              label={unreadCount > 0 ? `Notificações (${unreadCount})` : 'Notificações'}
              colors={colors}
              onPress={() => {
                setOpen(false);
                router.push('/notifications');
              }}
            />

            <MenuItem
              icon="globe-outline"
              label="Ir ao Portal"
              colors={colors}
              onPress={() => {
                setOpen(false);
                router.push('/portal');
              }}
            />

            <MenuItem
              icon="lock-closed-outline"
              label="Trocar Senha"
              colors={colors}
              onPress={() => {
                setOpen(false);
                Linking.openURL(`${NOMEIA_PORTAL_URL}/auth/reset-password`);
              }}
            />

            <View style={[styles.themeRow, { borderColor: colors.border }]}>
              <View style={styles.themeLabel}>
                <Ionicons
                  name={themeIsDark ? 'moon' : 'sunny-outline'}
                  size={18}
                  color={colors.textMuted}
                />
                <Text style={[styles.themeText, { color: colors.text }]}>Modo Escuro</Text>
              </View>
              <Switch
                value={themeIsDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <MenuItem
              icon="log-out-outline"
              label="Sair"
              colors={colors}
              danger
              onPress={async () => {
                setOpen(false);
                await signOut();
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  colors,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: { text: string; danger: string };
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.text} />
      <Text style={[styles.menuItemText, { color: danger ? colors.danger : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  loginText: { fontSize: 14, fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    maxWidth: '100%',
    paddingRight: 4,
  },
  avatarWrap: {
    position: 'relative',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 16,
  },
  menu: {
    width: 260,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    padding: 14,
    borderBottomWidth: 1,
  },
  menuName: { fontSize: 15, fontWeight: '700' },
  menuEmail: { fontSize: 12, marginTop: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemText: { fontSize: 15, fontWeight: '500' },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  themeLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeText: { fontSize: 14, fontWeight: '500' },
});
