import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { EmptyState } from '@/components/States';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const deleteOne = useStore((s) => s.deleteNotification);
  const clearAll = useStore((s) => s.clearAllNotifications);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const handlePress = (id: string, reportId: string) => {
    markRead(id);
    router.push(`/report/details/${reportId}`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = ({ item }: { item: typeof notifications[0]; index: number }) => (
    <View>
      <LiquidGlassCard
        style={[
          styles.notifCard,
          !item.read && { borderColor: colors.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.notifRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handlePress(item.id, item.reportId)}
            style={styles.notifTapArea}
          >
            <View style={styles.notifInfo}>
              <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
                {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteOne(item.id)}
            style={styles.deleteBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.deleteX, { color: colors.textTertiary }]}>×</Text>
          </TouchableOpacity>
        </View>
      </LiquidGlassCard>
    </View>
  );

  return (
    <GlassBackground>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.notifications}</Text>
          <View style={styles.headerActions}>
            {hasUnread && (
              <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.primary }]}>{t.markAllRead}</Text>
              </TouchableOpacity>
            )}
            {notifications.length > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.error }]}>
                  {lang === 'ar' ? 'مسح الكل' : 'Clear all'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {notifications.length === 0 ? (
          <EmptyState
            title={t.noNotifications}
            message={t.noNotificationsMsg}
          />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          />
        )}
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: 'Cairo-Bold', fontSize: 24, lineHeight: 36 },
  headerActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontFamily: 'Cairo-Medium', fontSize: 13, lineHeight: 20 },
  list: { gap: 10 },
  notifCard: { minHeight: 72 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifTapArea: { flex: 1 },
  notifInfo: { gap: 2 },
  notifTitle: { fontFamily: 'Cairo-Bold', fontSize: 14, lineHeight: 22 },
  notifBody: { fontFamily: 'Cairo-Regular', fontSize: 13, lineHeight: 20 },
  notifTime: { fontFamily: 'Cairo-Regular', fontSize: 11, lineHeight: 18, marginTop: 2 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteX: { fontFamily: 'Cairo-Bold', fontSize: 24, lineHeight: 28 },
});
