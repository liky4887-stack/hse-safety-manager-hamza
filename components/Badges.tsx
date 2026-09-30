import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/colors';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'closed';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { colors } = useTheme();
  const colors_map: Record<string, [string, string]> = {
    open: [colors.error, colors.errorLight],
    in_progress: [colors.warning, colors.warningLight],
    closed: [colors.success, colors.successLight],
  };
  const [fg, bg] = colors_map[status] || [colors.textSecondary, colors.bgSecondary];
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: fg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  label: string;
}

export function PriorityBadge({ priority, label }: PriorityBadgeProps) {
  const { colors } = useTheme();
  const colors_map: Record<string, string> = {
    low: colors.success,
    medium: colors.info,
    high: colors.warning,
    critical: colors.error,
  };
  const fg = colors_map[priority] || colors.textSecondary;
  return (
    <View style={[styles.badge, { borderColor: fg, backgroundColor: fg + '15' }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: 'Cairo-Bold',
    fontSize: 12,
  },
});
