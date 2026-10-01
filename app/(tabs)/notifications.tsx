import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { EmptyState } from '@/components/States';
import { ROLES } from '@/config/departments';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const notifications = useStore((s) => s.notifications);
  const user = useStore((s) => s.user);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllNotificationsRead);
  const deleteOne = useStore((s) => s.deleteNotification);
  const clearAll = useStore((s) => s.clearAllNotifications);
  const hydrateNotifications = useStore((s) => s.hydrateNotifications);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const handlePress = (id: string, reportId: string) => {
    markRead(id);
    if (reportId) router.push(`/report/details/${reportId}`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrateNotifications();
    setRefreshing(false);
  };

  const hasUnread = notifications.some((n) => !n.read);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabel = (role: string | null | undefined) => {
    if (!role) return '';
    if (role === 'all') return lang === 'ar' ? 'الجميع' : 'Everyone';
    const r = ROLES.find((x) => x.id === role);
    return r ? (lang === 'ar' ? r.nameAr : r.nameEn) : role;
  };

  const renderItem = ({ item }: { item: typeof notifications[0] }) => (
    <View>
      <LiquidGlassCard
        style={[
          styles.notifCard,
          !item.read && { borderColor: colors.primary, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.notifRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handlePress(item.id, item.reportId)}
            style={styles.notifTapArea}
          >
            {/* Header row: sender + role */}
            <View style={styles.senderRow}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: item.read ? colors.bgSecondary : colors.primary + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: item.read ? colors.textSecondary : colors.primary },
                  ]}
                >
                  {item.senderName ? item.senderName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.senderInfo}>
                <Text
                  style={[styles.senderName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.senderName || (lang === 'ar' ? 'غير معروف' : 'Unknown')}
                </Text>
                {!!item.senderRole && (
                  <Text
                    style={[styles.senderRole, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {roleLabel(item.senderRole)}
                  </Text>
                )}
              </View>
              {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>

            {/* Title */}
            <Text
              style={[styles.notifTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {/* Body */}
            <Text
              style={[styles.notifBody, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.body}
            </Text>

            {/* Time */}
            <Text style={[styles.notifTime, { color: colors.textTertiary }]}>
              {new Date(item.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
            </Text>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>{t.notifications}</Text>
            {!!user && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {roleLabel(user.role)}
                {user.department ? ` · ${user.department}` : ''}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {hasUnread && (
              <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  {lang === 'ar' ? 'تعليم الكل' : 'Mark all'}
                </Text>
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

        {/* Unread counter */}
        {unreadCount > 0 && (
          <View style={[styles.unreadBar, { backgroundColor: colors.primary + '14' }]}>
            <Text style={[styles.unreadBarText, { color: colors.primary }]}>
              {lang === 'ar'
                ? `${unreadCount} إشعار جديد`
                : `${unreadCount} new`}
            </Text>
          </View>
        )}

        {/* List or empty */}
        {notifications.length === 0 ? (
          <EmptyState
            title={t.noNotifications}
            message={lang === 'ar'
              ? 'ستظهر هنا التقارير الجديدة الواردة من فئاتك'
              : 'New reports from your team will appear here'}
          />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: { fontFamily: 'Cairo-Bold', fontSize: 24, lineHeight: 36 },
  subtitle: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 6 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontFamily: 'Cairo-Medium', fontSize: 13, lineHeight: 20 },
  unreadBar: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  unreadBarText: { fontFamily: 'Cairo-Bold', fontSize: 12, lineHeight: 18 },
  list: { gap: 10 },
  notifCard: { minHeight: 88 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  notifTapArea: { flex: 1, gap: 4 },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Cairo-Bold', fontSize: 15, lineHeight: 22 },
  senderInfo: { flex: 1 },
  senderName: { fontFamily: 'Cairo-Bold', fontSize: 14, lineHeight: 20 },
  senderRole: { fontFamily: 'Cairo-Regular', fontSize: 11, lineHeight: 16 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 12 },
  notifTitle: { fontFamily: 'Cairo-Bold', fontSize: 14, lineHeight: 22 },
  notifBody: { fontFamily: 'Cairo-Regular', fontSize: 13, lineHeight: 20 },
  notifTime: { fontFamily: 'Cairo-Regular', fontSize: 11, lineHeight: 18, marginTop: 4 },
  deleteBtn: { paddingHorizontal: 6, paddingVertical: 4, marginTop: 2 },
  deleteX: { fontFamily: 'Cairo-Bold', fontSize: 24, lineHeight: 28 },
});
