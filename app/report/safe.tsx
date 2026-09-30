import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { LoadingState } from '@/components/States';

export default function SafeReportScreen() {
  const { colors } = useTheme();
  const { t, lang, rtl } = useI18n();
  const createReport = useStore((s) => s.createReport);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await createReport({ type: 'safe', description: description.trim(), photoUri });
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => router.replace('/(tabs)'), 2000);
    } catch { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <GlassBackground>
        <View style={[styles.thankYouContainer, { paddingTop: insets.top }]}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.thankYouContent}>
            <Text style={[styles.thankYouTitle, { color: colors.text }]}>{t.thankYou}</Text>
            <Text style={[styles.thankYouMsg, { color: colors.textSecondary }]}>{t.thankYouMsg}</Text>
          </Animated.View>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backArrow, { color: colors.primary }]}>{rtl ? '→' : '←'}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{t.reportSafe}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t.writeNote} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <LiquidGlassCard style={styles.inputCard}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={description} onChangeText={setDescription}
                placeholder={t.writeNotePlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline numberOfLines={5}
                textAlignVertical="top"
              />
            </LiquidGlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.attachPhoto} ({t.optional})</Text>
            {photoUri ? (
              <View style={styles.photoWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={[styles.removePhoto, { backgroundColor: colors.error }]}
                  onPress={() => setPhotoUri(null)}
                >
                  <Text style={styles.removePhotoText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <TouchableOpacity onPress={takePhoto} activeOpacity={0.7} style={{ flex: 1 }}>
                  <LiquidGlassCard style={styles.photoOption}>
                    <Text style={[styles.photoOptionText, { color: colors.text }]}>{t.takePhoto}</Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7} style={{ flex: 1 }}>
                  <LiquidGlassCard style={styles.photoOption}>
                    <Text style={[styles.photoOptionText, { color: colors.text }]}>{t.chooseFromGallery}</Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.submitWrap}>
            {submitting ? (
              <LoadingState message={t.submitting} />
            ) : (
              <LiquidGlassButton
                title={t.submit}
                onPress={handleSubmit}
                size="lg"
                disabled={!description.trim()}
              />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 8,
    position: 'relative',
  },
  backBtn: { position: 'absolute', top: 6, start: 0, padding: 6, zIndex: 10 },
  backArrow: { fontFamily: 'Cairo-Bold', fontSize: 22, lineHeight: 28 },
  title: { fontFamily: 'Cairo-Bold', fontSize: 22, lineHeight: 32, textAlign: 'center' },
  label: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22, marginBottom: 8 },
  inputCard: { minHeight: 120 },
  textArea: { fontFamily: 'Cairo-Regular', fontSize: 16, minHeight: 100, padding: 0 },
  photoWrap: { position: 'relative' },
  photoPreview: { width: '100%', height: 200, borderRadius: 16 },
  removePhoto: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#FFFFFF', fontSize: 20, lineHeight: 22, fontFamily: 'Cairo-Bold' },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoOption: { minHeight: 60, alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  photoOptionText: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  submitWrap: { marginTop: 16 },
  thankYouContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thankYouContent: { alignItems: 'center', gap: 16, paddingHorizontal: 24 },
  thankYouTitle: { fontFamily: 'Cairo-Bold', fontSize: 28, lineHeight: 40, textAlign: 'center' },
  thankYouMsg: { fontFamily: 'Cairo-Regular', fontSize: 16, lineHeight: 26, textAlign: 'center' },
});
