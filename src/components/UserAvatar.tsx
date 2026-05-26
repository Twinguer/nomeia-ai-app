import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';

export const USER_AVATAR_SIZE = 40;

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  style?: ViewStyle;
};

/** Avatar circular (foto ou iniciais). */
export function UserAvatar({ name, avatarUrl, size = USER_AVATAR_SIZE, style }: Props) {
  const { colors } = useAppTheme();
  const radius = size / 2;

  return (
    <View
      style={[
        styles.clip,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: colors.border,
        },
        style,
      ]}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: colors.primaryLight, borderRadius: radius }]}>
          <Text
            style={[
              styles.initials,
              { color: colors.primaryDark, fontSize: size * 0.35 },
            ]}>
            {userInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  fallback: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
