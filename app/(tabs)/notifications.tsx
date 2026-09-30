import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, BellOff, CheckCheck, FileText } from 'lucide-react-native';
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

  const renderItem = ({ item, index }: { item: typeof notifications[0]; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => handlePress(item.id, item.reportId)}>
        <LiquidGlassCard
          style={[
            styles.notifCard,
            !item.read && { borderColor: colors.primary, borderWidth: 1.5 },
          ]}
        >
          <View style={styles.notifRow}>
            <View style={[styles.notifIcon, { backgroundColor: item.read ? colors.bgSecondary : colors.primary + '20' }]}>
              <Bell size={20} color={item.read ? colors.textTertiary : colors.primary} />
            </View>
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
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </View>
        </LiquidGlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <GlassBackground>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.notifications}</Text>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
              <CheckCheck size={18} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>{t.markAllRead}</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <EmptyState
            title={t.noNotifications}
            message={t.noNotificationsMsg}
            icon={<BellOff size={48} color={colors.textTertiary} />}
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  notifCard: {
    minHeight: 72,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifInfo: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 14,
  },
  notifBody: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
  },
  notifTime: {
    fontFamily: 'Cairo-Regular',
    fontSize: 11,
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
