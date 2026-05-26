import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserMenu } from '@/components/UserMenu';
import { useAppTheme } from '@/contexts/AppThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications, type Notification } from '@/hooks/useNotifications';

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

function NotificationItem({
  item,
  colors,
  onPress,
}: {
  item: Notification;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: item.is_read ? colors.surface : colors.primaryLight,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}>
      <View style={styles.cardRow}>
        <Ionicons
          name={item.is_read ? 'notifications-outline' : 'notifications'}
          size={22}
          color={colors.primary}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>Nova</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.cardMessage, { color: colors.textMuted }]}>{item.message}</Text>
          <Text style={[styles.cardTime, { color: colors.textMuted }]}>
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useAppTheme();
  const { notifications, isLoading, refetch, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();

  if (!session) {
    router.replace('/login');
    return null;
  }

  const handlePress = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    const concursoId =
      (n.metadata?.concurso_id as string | undefined) ||
      (n.metadata?.concursoId as string | undefined);
    if (concursoId) {
      router.push(`/ranking/${concursoId}`);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTitle: () => null,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primaryDark,
          headerLeft: () => <UserMenu />,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}>
        {unreadCount > 0 ? (
          <Pressable
            style={[styles.markAll, { borderColor: colors.border }]}
            onPress={() => markAllAsRead()}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar todas como lidas
            </Text>
          </Pressable>
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem item={item} colors={colors} onPress={() => handlePress(item)} />
            )}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
            }
            contentContainerStyle={notifications.length === 0 ? styles.listEmpty : undefined}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Nenhuma notificação.
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  markAllText: { fontSize: 14, fontWeight: '600' },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardMessage: { fontSize: 14, lineHeight: 20 },
  cardTime: { fontSize: 12, marginTop: 8 },
  listEmpty: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  empty: { textAlign: 'center', fontSize: 15 },
});
