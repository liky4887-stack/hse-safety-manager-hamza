import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const user = useStore((s) => s.user);
  const unreadCount = useStore((s) => s.getUnreadCount());
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin' || user?.role === 'hse_officer';
  const bottomInset = insets.bottom > 0 ? insets.bottom : 10;

  const label = (text: string, badge?: number) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <View style={styles.cell}>
        <Text
          style={[
            styles.label,
            { color, fontFamily: focused ? 'Cairo-Bold' : 'Cairo-Medium' },
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIconStyle: { display: 'none' },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          elevation: 0,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 52 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          paddingHorizontal: 4,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 13,
        },
      }}
    >
      <Tabs.Screen name="index"         options={{ title: t.home,          tabBarLabel: label(t.home) }} />
      <Tabs.Screen name="reports"       options={{ title: t.myReports,     tabBarLabel: label(t.myReports) }} />
      <Tabs.Screen name="notifications" options={{ title: t.notifications, tabBarLabel: label(t.notifications, unreadCount) }} />
      <Tabs.Screen name="dashboard"     options={{ title: t.dashboard,     href: isAdmin ? undefined : null, tabBarLabel: label(t.dashboard) }} />
      <Tabs.Screen name="profile"       options={{ title: t.profile,       tabBarLabel: label(t.profile) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -18,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: 'Cairo-Bold', fontSize: 10, color: '#FFFFFF', lineHeight: 14 },
});
