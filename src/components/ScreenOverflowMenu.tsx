import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/contexts/AppThemeContext';

export type OverflowMenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

type Props = {
  items: OverflowMenuItem[];
  /** Cor do ícone ⋮ (padrão: primaryDark do tema) */
  iconColor?: string;
};

export function ScreenOverflowMenu({ items, iconColor }: Props) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const tint = iconColor ?? colors.primaryDark;

  const visibleItems = items.filter((item) => !item.disabled);

  if (visibleItems.length === 0) return null;

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setOpen(true)}
        hitSlop={12}
        accessibilityLabel="Mais opções"
        accessibilityRole="button">
        <Ionicons name="ellipsis-vertical" size={22} color={tint} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}>
            {visibleItems.map((item, index) => (
              <Pressable
                key={item.id}
                style={[
                  styles.menuItem,
                  index < visibleItems.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
                disabled={item.loading}
                onPress={() => {
                  setOpen(false);
                  item.onPress();
                }}>
                {item.loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.danger ? colors.danger : colors.text}
                  />
                )}
                <Text
                  style={[
                    styles.menuItemText,
                    { color: item.danger ? colors.danger : colors.text },
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  menu: {
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
});
