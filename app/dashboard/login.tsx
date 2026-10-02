import React from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';

export default function DashboardLogin() {
  const { colors } = useTheme();
  const { lang, rtl } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const loginDashboard = useStore((s) => s.loginDashboard);

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    const result = await loginDashboard(username.trim(), password);

    setLoading(false);

    if (!result.ok) {
      setError(
        result.error === 'invalid'
          ? (lang === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password')
          : (lang === 'ar' ? 'تعذّر الاتصال بالخادم' : 'Connection error')
      );
      return;
    }

    router.replace('/dashboard/index');
  };

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              {
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 300, // generous — keyboard pushes content up
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {lang === 'ar' ? 'دخول لوحة التحكم' : 'Dashboard Login'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {lang === 'ar' ? 'مخصص للمسؤولين المصرح لهم فقط' : 'Authorized personnel only'}
              </Text>
            </Animated.View>

            {/* Username */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={rtl ? 'right' : 'left'}
                  placeholder="admin"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="next"
                />
              </View>
            </Animated.View>

            {/* Password with show/hide */}
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign={rtl ? 'right' : 'left'}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.eyeText, { color: colors.primary }]}>
                    {showPassword
                      ? (lang === 'ar' ? 'إخفاء' : 'Hide')
                      : (lang === 'ar' ? 'إظهار' : 'Show')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Error */}
            {!!error && (
              <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
            )}

            {/* Submit */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <View style={{ marginTop: 24 }}>
                  <LiquidGlassButton
                    title={lang === 'ar' ? 'دخول' : 'Sign in'}
                    onPress={handleLogin}
                    size="lg"
                    disabled={!canSubmit}
                  />
                </View>
              )}
            </Animated.View>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)/profile')}
              style={styles.cancelWrap}
            >
              <Text style={[styles.cancel, { color: colors.textTertiary }]}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  title: { fontFamily: 'Cairo-Bold', fontSize: 26, lineHeight: 40, textAlign: 'center' },
  subtitle: { fontFamily: 'Cairo-Regular', fontSize: 14, lineHeight: 22, marginTop: 4, textAlign: 'center' },
  label: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  inputWrap: {
    minHeight: 52,
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
  eyeBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  eyeText: { fontFamily: 'Cairo-Bold', fontSize: 12, lineHeight: 20 },
  error: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingWrap: { alignItems: 'center', marginTop: 32 },
  cancelWrap: { alignItems: 'center', marginTop: 24, paddingVertical: 8 },
  cancel: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22 },
});
