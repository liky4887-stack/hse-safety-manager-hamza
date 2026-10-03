import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { HighlightedText } from '@/components/HighlightedText';
import { ROLES, DEPARTMENTS } from '@/config/departments';
import type { UserRole } from '@/types';

// Login only offers these two roles. Higher roles are assigned via admin tools.
const LOGIN_ROLES = ROLES.filter((r) => r.id === 'employee' || r.id === 'supervisor');

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
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string>('');
  const [lookingUp, setLookingUp] = React.useState(false);
  const [foundProfile, setFoundProfile] = React.useState(false);
  const [locked, setLocked] = React.useState(false);

  const trimmedName = name.trim();
  const showRole = trimmedName.length > 0;
  const showDept = showRole && selectedRole !== null;
  const showSubcat = showDept && selectedDept === 'drilling';
  const canLogin =
    showDept &&
    selectedDept.length > 0 &&
    (!showSubcat || selectedSubcategory.length > 0);

  // Auto-lookup profile after 600ms of no typing
  React.useEffect(() => {
    // Reset EVERYTHING on every name change — prevents leaked state
    // from a previously-recognized profile.
    setSelectedRole(null);
    setSelectedDept('');
    setSelectedSubcategory('');
    setFoundProfile(false);
    setLocked(false);

    if (trimmedName.length < 1) {
      return;
    }

    const handle = setTimeout(async () => {
      setLookingUp(true);
      const profile = await lookupProfile(trimmedName);
      setLookingUp(false);
      if (profile) {
        setSelectedRole(profile.role);
        setSelectedDept(profile.department);
        setSelectedSubcategory(profile.subcategory ?? '');
        setFoundProfile(true);
        setLocked(true);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [trimmedName, lookupProfile]);

  const handleLogin = async () => {
    if (!canLogin) return;
    const sub = selectedDept === 'drilling' ? selectedSubcategory : null;
    await saveProfile(trimmedName, selectedRole!, selectedDept, sub);
    await login(trimmedName, selectedRole!, selectedDept, sub);
    router.replace('/(tabs)');
  };

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
            // Center the group while only the name is shown;
            // switch to top alignment once the other steps appear.
            justifyContent: showRole ? 'flex-start' : 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand header */}
        <View style={styles.header}>
          <Text style={[styles.companyName, { color: colors.textSecondary }]}>{t.company}</Text>
          <HighlightedText size={26} lineHeight={40} fontFamily="Thmanyah-Display" style={styles.appName}>
            {t.appName}
          </HighlightedText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.tagline, { color: colors.textTertiary }]}>{t.splashTagline}</Text>
        </View>

        {/* Step 1: Name */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.enterName}</Text>
          <View
            style={[
              styles.inputWrap,
              {
                backgroundColor: colors.surface,
                borderColor: foundProfile ? colors.primary : colors.border,
              },
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
              autoFocus
            />
            {lookingUp && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          {foundProfile && (
            <View style={styles.hintRow}>
              <Text style={[styles.hint, { color: colors.success }]}>
                {lang === 'ar'
                  ? 'تم التعرف عليك — لا يمكن تغيير القسم أو الدور'
                  : 'Recognized — role and department are locked'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Step 2: Role — only employee / supervisor */}
        {showRole && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.selectRole}</Text>
            <View style={styles.rolesGrid}>
              {LOGIN_ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => !locked && setSelectedRole(role.id)}
                    activeOpacity={locked ? 1 : 0.85}
                  disabled={locked}
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
                      numberOfLines={1}
                    >
                      {lang === 'ar' ? role.nameAr : role.nameEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 3: Department — appears once role is chosen */}
        {showDept && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.department}</Text>
            <View style={styles.deptGrid}>
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDept === dept.id;
                return (
                  <TouchableOpacity
                    key={dept.id}
                    onPress={() => !locked && setSelectedDept(dept.id)}
                    activeOpacity={locked ? 1 : 0.85}
                    disabled={locked}
                    style={[
                      styles.deptChip,
                      {
                        backgroundColor: isSelected ? colors.primary + '14' : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                        opacity: locked && !isSelected ? 0.4 : 1,
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
          </Animated.View>
        )}

        {/* Step 3b: Drilling group picker */}
        {showSubcat && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {lang === 'ar' ? 'المجموعة' : 'Group'}
            </Text>
            <View style={styles.deptGrid}>
              {(DEPARTMENTS.find((d) => d.id === 'drilling')?.subcategories ?? []).map((sub) => {
                const isSelected = selectedSubcategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => !locked && setSelectedSubcategory(sub.id)}
                    activeOpacity={locked ? 1 : 0.85}
                    disabled={locked}
                    style={[
                      styles.deptChip,
                      {
                        backgroundColor: isSelected ? colors.primary + '14' : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                        opacity: locked && !isSelected ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.deptText, { color: isSelected ? colors.primary : colors.text }]}
                      numberOfLines={1}
                    >
                      {lang === 'ar' ? sub.nameAr : sub.nameEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Step 4: Login button — once everything is filled */}
        {canLogin && (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.buttonWrap}>
            <LiquidGlassButton title={t.enter} onPress={handleLogin} size="lg" />
          </Animated.View>
        )}

        {/* Progressive helper text */}
        {!canLogin && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              {!showRole
                ? (lang === 'ar' ? 'أدخل اسمك للمتابعة' : 'Enter your name to continue')
                : !selectedRole
                ? (lang === 'ar' ? 'اختر دورك للمتابعة' : 'Select your role to continue')
                : !selectedDept
                ? (lang === 'ar' ? 'اختر القسم للمتابعة' : 'Select your department to continue')
                : (lang === 'ar' ? 'اختر المجموعة للمتابعة' : 'Select your group to continue')}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  companyName: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 26,
    lineHeight: 40,
    textAlign: 'center',
  },
  divider: {
    width: 44,
    height: 2,
    borderRadius: 1,
    marginVertical: 6,
    opacity: 0.6,
  },
  tagline: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    gap: 0,
  },
  sectionLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputWrap: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    minHeight: 24,
    flex: 1,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  hint: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  rolesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    minHeight: 64,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  deptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: 8,
  },
  helperText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
});
