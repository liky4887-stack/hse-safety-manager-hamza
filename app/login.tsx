import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ShieldCheck, HardHat, Wrench, Settings, User, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { ROLES } from '@/config/departments';
import { DEPARTMENTS } from '@/config/departments';
import type { UserRole } from '@/types';

const roleIcons: Record<string, React.ReactNode> = {
  user: <User size={28} color="#1A7A9C" />,
  'hard-hat': <HardHat size={28} color="#2D8F6B" />,
  'shield-check': <ShieldCheck size={28} color="#0A5C7A" />,
  wrench: <Wrench size={28} color="#E89B2F" />,
  settings: <Settings size={28} color="#D94848" />,
};

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t, lang, rtl } = useI18n();
  const login = useStore((s) => s.login);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [selectedDept, setSelectedDept] = React.useState<string>('');

  const handleLogin = async () => {
    if (!name.trim() || !selectedRole || !selectedDept) return;
    await login(name.trim(), selectedRole, selectedDept);
    router.replace('/(tabs)');
  };

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <ShieldCheck size={48} color={colors.textOnPrimary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.companyName, { color: colors.text }]}>{t.company}</Text>
          <Text style={[styles.appName, { color: colors.primary }]}>{t.appName}</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>{t.splashTagline}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.selectRole}</Text>
          <View style={styles.rolesGrid}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
                style={{ flex: 1 }}
              >
                <LiquidGlassCard
                  style={[
                    styles.roleCard,
                    selectedRole === role.id && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.roleContent}>
                    {roleIcons[role.icon]}
                    <Text style={[styles.roleText, { color: colors.text }]}>
                      {lang === 'ar' ? role.nameAr : role.nameEn}
                    </Text>
                  </View>
                </LiquidGlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {selectedRole && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.department}</Text>
            <View style={styles.deptGrid}>
              {DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  onPress={() => setSelectedDept(dept.id)}
                  activeOpacity={0.7}
                >
                  <LiquidGlassCard
                    style={[
                      styles.deptChip,
                      selectedDept === dept.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                  >
                    <Text style={[styles.deptText, { color: colors.text }]}>
                      {lang === 'ar' ? dept.nameAr : dept.nameEn}
                    </Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {selectedRole && selectedDept && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.enterName}</Text>
            <LiquidGlassCard style={styles.inputCard}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder={t.enterName}
                placeholderTextColor={colors.textTertiary}
                textAlign={rtl ? 'right' : 'left'}
              />
            </LiquidGlassCard>
          </Animated.View>
        )}

        {name.trim() && selectedRole && selectedDept && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.buttonWrap}>
            <LiquidGlassButton title={t.enter} onPress={handleLogin} size="lg" />
          </Animated.View>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
  gap: 16,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
  },
  appName: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  tagline: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
  },
  sectionLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleCard: {
    minHeight: 80,
  },
  roleContent: {
    alignItems: 'center',
    gap: 8,
  },
  roleText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptChip: {
    minHeight: 44,
  },
  deptText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  inputCard: {
    minHeight: 56,
  },
  input: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    padding: 0,
  },
  buttonWrap: {
    marginTop: 8,
  },
});
