import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  User, LogOut, Globe, Moon, Sun, Settings as SettingsIcon,
  ShieldCheck, HardHat, Wrench, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { DEPARTMENTS, ROLES } from '@/config/departments';
import type { ThemeMode } from '@/types';

const roleIcons: Record<string, React.ReactNode> = {
  user: <User size={20} color="#1A7A9C" />,
  'hard-hat': <HardHat size={20} color="#2D8F6B" />,
  'shield-check': <ShieldCheck size={20} color="#0A5C7A" />,
  wrench: <Wrench size={20} color="#E89B2F" />,
  settings: <SettingsIcon size={20} color="#D94848" />,
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t, lang, rtl, setLang } = useI18n();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!user) {
    return (
      <GlassBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={{ color: colors.text, fontFamily: 'Cairo-Bold', fontSize: 18 }}>{t.login}</Text>
          <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontFamily: 'Cairo-Bold' }}>{t.login}</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  const role = ROLES.find((r) => r.id === user.role);
  const dept = DEPARTMENTS.find((d) => d.id === user.department);
  const ForwardIcon = rtl ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const themeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: t.light, icon: <Sun size={18} color={colors.text} /> },
    { id: 'dark', label: t.dark, icon: <Moon size={18} color={colors.text} /> },
    { id: 'system', label: t.system, icon: <SettingsIcon size={18} color={colors.text} /> },
  ];

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            {role && roleIcons[role.icon]}
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {lang === 'ar' ? role?.nameAr : role?.nameEn}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.userInfo}</Text>
          <LiquidGlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.department}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {dept ? (lang === 'ar' ? dept.nameAr : dept.nameEn) : '-'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.role}</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {role ? (lang === 'ar' ? role.nameAr : role.nameEn) : '-'}
              </Text>
            </View>
            {user.email ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.email}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
                </View>
              </>
            ) : null}
            {user.phone ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t.phone}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{user.phone}</Text>
                </View>
              </>
            ) : null}
          </LiquidGlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.language}</Text>
          <LiquidGlassCard style={styles.toggleCard}>
            <View style={styles.langRow}>
              <TouchableOpacity
                onPress={() => setLang('ar')}
                style={[styles.langOption, lang === 'ar' && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Globe size={18} color={lang === 'ar' ? '#FFFFFF' : colors.text} />
                <Text style={[styles.langText, { color: lang === 'ar' ? '#FFFFFF' : colors.text }]}>{t.arabic}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLang('en')}
                style={[styles.langOption, lang === 'en' && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Globe size={18} color={lang === 'en' ? '#FFFFFF' : colors.text} />
                <Text style={[styles.langText, { color: lang === 'en' ? '#FFFFFF' : colors.text }]}>{t.english}</Text>
              </TouchableOpacity>
            </View>
          </LiquidGlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.themeMode}</Text>
          <LiquidGlassCard style={styles.toggleCard}>
            <View style={styles.themeRow}>
              {themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setThemeMode(opt.id)}
                  style={[
                    styles.themeOption,
                    themeMode === opt.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                  {opt.icon}
                  <Text style={[styles.themeText, { color: themeMode === opt.id ? '#FFFFFF' : colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </LiquidGlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.logoutWrap}>
          <LiquidGlassButton
            title={t.logout}
            onPress={handleLogout}
            variant="danger"
            size="lg"
            icon={<LogOut size={20} color="#FFFFFF" />}
          />
        </Animated.View>
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  profileHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 13,
  },
  sectionLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    marginBottom: 8,
  },
  infoCard: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
  },
  infoValue: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  toggleCard: {
    gap: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  langText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 14,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  themeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 13,
  },
  logoutWrap: {
    marginTop: 8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
