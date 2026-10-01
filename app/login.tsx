import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { HighlightedText } from '@/components/HighlightedText';
import { ROLES, DEPARTMENTS } from '@/config/departments';
import type { UserRole } from '@/types';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t, lang, rtl } = useI18n();
  const login = useStore((s) => s.login);
  const saveProfile = useStore((s) => s.saveProfile);
  const lookupProfile = useStore((s) => s.lookupProfile);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [selectedDept, setSelectedDept] = React.useState<string>('');
  const [lookingUp, setLookingUp] = React.useState(false);
  const [foundProfile, setFoundProfile] = React.useState(false);

  // Auto-lookup profile when name settles
  React.useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      setFoundProfile(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLookingUp(true);
      const profile = await lookupProfile(trimmed);
      setLookingUp(false);
      if (profile) {
        setSelectedRole(profile.role);
        setSelectedDept(profile.department);
        setFoundProfile(true);
      } else {
        setFoundProfile(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [name, lookupProfile]);

  const handleLogin = async () => {
    if (!name.trim() || !selectedRole || !selectedDept) return;
    const cleanName = name.trim();
    await saveProfile(cleanName, selectedRole, selectedDept);
    await login(cleanName, selectedRole, selectedDept);
    router.replace('/(tabs)');
  };

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.companyName, { color: colors.textSecondary }]}>{t.company}</Text>
          <HighlightedText
            size={26}
            lineHeight={40}
            fontFamily="Thmanyah-Display"
            style={styles.appName}
          >
            {t.appName}
          </HighlightedText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.tagline, { color: colors.textTertiary }]}>{t.splashTagline}</Text>
        </View>

        {/* ── Name first (this drives the lookup) ── */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.enterName}</Text>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t.enterName}
              placeholderTextColor={colors.textTertiary}
              textAlign={rtl ? 'right' : 'left'}
              autoCapitalize="words"
            />
            {lookingUp && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          {foundProfile && (
            <Text style={[styles.hint, { color: colors.success }]}>
              {lang === 'ar' ? 'تم التعرف عليك — تم تعبئة البيانات تلقائياً' : 'Recognized — fields auto-filled'}
            </Text>
          )}
        </View>

        {/* ── Role ── */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.selectRole}</Text>
          <View style={styles.rolesGrid}>
            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  onPress={() => setSelectedRole(role.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: isSelected ? colors.primary + '14' : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.roleText, { color: isSelected ? colors.primary : colors.text }]}
                    numberOfLines={2}
                  >
                    {lang === 'ar' ? role.nameAr : role.nameEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Department ── */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.department}</Text>
          <View style={styles.deptGrid}>
            {DEPARTMENTS.map((dept) => {
              const isSelected = selectedDept === dept.id;
              return (
                <TouchableOpacity
                  key={dept.id}
                  onPress={() => setSelectedDept(dept.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: isSelected ? colors.primary + '14' : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.deptText, { color: isSelected ? colors.primary : colors.text }]}
                    numberOfLines={1}
                  >
                    {lang === 'ar' ? dept.nameAr : dept.nameEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Submit (always visible, disabled until complete) ── */}
        <View style={styles.buttonWrap}>
          <LiquidGlassButton
            title={t.enter}
            onPress={handleLogin}
            size="lg"
            disabled={!name.trim() || !selectedRole || !selectedDept}
          />
        </View>

        {(!name.trim() || !selectedRole || !selectedDept) && (
          <Text style={[styles.helperText, { color: colors.textTertiary }]}>
            {!name.trim()
              ? (lang === 'ar' ? 'أدخل اسمك للمتابعة' : 'Enter your name to continue')
              : !selectedRole
              ? (lang === 'ar' ? 'اختر دورك للمتابعة' : 'Select your role to continue')
              : (lang === 'ar' ? 'اختر القسم للمتابعة' : 'Select your department to continue')}
          </Text>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 22, gap: 22 },
  header: { alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12 },
  companyName: {
    fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22,
    textAlign: 'center', letterSpacing: 0.5,
  },
  appName: { fontFamily: 'Cairo-Bold', fontSize: 26, lineHeight: 38, textAlign: 'center' },
  divider: { width: 44, height: 2, borderRadius: 1, marginVertical: 8, opacity: 0.6 },
  tagline: { fontFamily: 'Cairo-Regular', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  sectionLabel: {
    fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22,
    marginBottom: 10, letterSpacing: 0.3,
  },
  inputWrap: {
    minHeight: 54, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, justifyContent: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  input: {
    fontFamily: 'Cairo-Regular', fontSize: 16, lineHeight: 24,
    padding: 0, minHeight: 24, flex: 1,
  },
  hint: {
    fontFamily: 'Cairo-Regular', fontSize: 12, lineHeight: 18,
    marginTop: 6, textAlign: 'center',
  },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: {
    flexGrow: 1, flexBasis: '30%', minWidth: 96, minHeight: 56,
    paddingVertical: 16, paddingHorizontal: 10, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  roleText: {
    fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22, textAlign: 'center',
  },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deptChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  deptText: {
    fontFamily: 'Cairo-Medium', fontSize: 13, lineHeight: 20, textAlign: 'center',
  },
  buttonWrap: { marginTop: 4 },
});
