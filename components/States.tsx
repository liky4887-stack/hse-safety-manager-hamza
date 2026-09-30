import React from 'react';
import { StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function LoadingState({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message: string; icon?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.error }]}>{message}</Text>
      {onRetry && (
        <Text style={[styles.retry, { color: colors.primary }]} onPress={onRetry}>Retry</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  iconWrap: {
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  retry: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    marginTop: 8,
  },
});
