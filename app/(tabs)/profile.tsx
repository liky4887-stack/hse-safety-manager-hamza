import React, { useRef } from 'react';
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

const roleIcons: Record<string, (c: string) => React.ReactNode> = {
  user: (c) => <User size={20} color={c} />,
  'hard-hat': (c) => <HardHat size={20} color={c} />,
  'shield-check': (c) => <ShieldCheck size={20} color={c} />,
  wrench: (c) => <Wrench size={20} color={c} />,
  settings: (c) => <SettingsIcon size={20} color={c} />,
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

  // ── Hidden dashboard access ──
  // Triple-tap the name within 1.5s OR long-press for 800ms opens the dashboard login.
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const openDashboard = () => {
    tapCountRef.current = 0;
    router.push('/dashboard/index');
  };

  const handleSecretTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 1500) {
      tapCountRef.current = 0;
    }
    tapCountRef.current += 1;
    lastTapRef.current = now;

    if (tapCountRef.current >= 3) {
      openDashboard();
    }
  };

  const role = ROLES.find((r) => r.id === user.role);
  const dept = DEPARTMENTS.find((d) => d.id === user.department);
  const ForwardIcon = rtl ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const themeOptions: { id: ThemeMode; label: string; renderIcon: (c: string) => React.ReactNode }[] = [
    { id: 'light',  label: t.light,  renderIcon: (c) => <Sun size={18} color={c} /> },
    { id: 'dark',   label: t.dark,   renderIcon: (c) => <Moon size={18} color={c} /> },
    { id: 'system', label: t.system, renderIcon: (c) => <SettingsIcon size={18} color={c} /> },
  ];

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.textOnPrimary }]}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <TouchableOpacity
            onPress={handleSecretTap}
            onLongPress={openDashboard}
            delayLongPress={800}
            activeOpacity={1}
          >
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          </TouchableOpacity>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            {role && roleIcons[role.icon]?.(colors.primary)}
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
                <Globe size={18} color={lang === 'ar' ? colors.textOnPrimary : colors.text} />
                <Text style={[styles.langText, { color: lang === 'ar' ? colors.textOnPrimary : colors.text }]}>{t.arabic}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLang('en')}
                style={[styles.langOption, lang === 'en' && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
              >
                <Globe size={18} color={lang === 'en' ? colors.textOnPrimary : colors.text} />
                <Text style={[styles.langText, { color: lang === 'en' ? colors.textOnPrimary : colors.text }]}>{t.english}</Text>
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
                  {opt.renderIcon(themeMode === opt.id ? colors.textOnPrimary : colors.text)}
                  <Text style={[styles.themeText, { color: themeMode === opt.id ? colors.textOnPrimary : colors.text }]}>
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
            icon={<LogOut size={20} color={colors.textOnPrimary} />}
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
