import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, FileText, Bell, BarChart3, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { radius } from '@/theme/colors';

function TabIcon({ name, active, color, icon }: { name: string; active: boolean; color: string; icon: React.ReactNode }) {
  const scale = useSharedValue(active ? 1 : 0.9);
  scale.value = withSpring(active ? 1.05 : 0.9, { damping: 15, stiffness: 200 });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIcon, animStyle]} >
      {icon}
      <Text style={[styles.tabLabel, { color, opacity: active ? 1 : 0.7 }]} numberOfLines={1}>
        {name}
      </Text>
    </Animated.View>
  );
}

function UnreadBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { t, lang } = useI18n();
  const user = useStore((s) => s.user);
  const unreadCount = useStore((s) => s.getUnreadCount());
  const insets = useSafeAreaInsets();

  const isAdmin = user?.role === 'admin' || user?.role === 'hse_officer';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          height: 64 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingHorizontal: 12,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <View style={[styles.tabBarInner, { borderColor: colors.glassBorder }]}>
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={80}
                  tint={isDark ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBg }]} />
              )}
              <LinearGradient
                colors={[colors.glassHighlight, 'transparent']}
                style={styles.tabHighlight}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={lang === 'ar' ? t.home : 'Home'} active={focused} color={color} icon={<Home size={24} color={color} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.myReports,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={lang === 'ar' ? t.myReports : 'Reports'} active={focused} color={color} icon={<FileText size={24} color={color} />} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t.notifications,
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon name={lang === 'ar' ? t.notifications : 'Alerts'} active={focused} color={color} icon={<Bell size={24} color={color} />} />
              <UnreadBadge count={unreadCount} color={colors.error} />
            </View>
          ),
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: t.dashboard,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={lang === 'ar' ? t.dashboard : 'Dashboard'} active={focused} color={color} icon={<BarChart3 size={24} color={color} />} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={lang === 'ar' ? t.profile : 'Profile'} active={focused} color={color} icon={<User size={24} color={color} />} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 4,
  },
  tabHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    opacity: 0.5,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 10,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
});
