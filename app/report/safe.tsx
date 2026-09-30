import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ShieldCheck, Camera, Image as ImageIcon, X, CheckCircle, MapPin } from 'lucide-react-native';
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
  const { t, lang } = useI18n();
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
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await createReport({
        type: 'safe',
        description: description.trim(),
        photoUri,
      });
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    } catch {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <GlassBackground>
        <View style={[styles.thankYouContainer, { paddingTop: insets.top }]}>
          <Animated.View entering={FadeInUp.duration(600)} style={styles.thankYouContent}>
            <View style={[styles.thankYouIcon, { backgroundColor: colors.successLight }]}>
              <CheckCircle size={64} color={colors.success} strokeWidth={1.5} />
            </View>
            <Text style={[styles.thankYouTitle, { color: colors.text }]}>{t.thankYou}</Text>
            <Text style={[styles.thankYouMsg, { color: colors.textSecondary }]}>{t.thankYouMsg}</Text>
          </Animated.View>
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: colors.primary }]}>{lang === 'ar' ? '← ' + t.back : t.back + ' →'}</Text>
            </TouchableOpacity>
            <View style={[styles.headerIcon, { backgroundColor: colors.successLight }]}>
              <ShieldCheck size={28} color={colors.success} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t.reportSafe}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t.writeNote} <Text style={{ color: colors.error }}>*</Text></Text>
            <LiquidGlassCard style={styles.inputCard}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.writeNotePlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={5}
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
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoActions}>
                <TouchableOpacity onPress={takePhoto} activeOpacity={0.7} style={{ flex: 1 }}>
                  <LiquidGlassCard style={styles.photoOption}>
                    <Camera size={24} color={colors.primary} />
                    <Text style={[styles.photoOptionText, { color: colors.text }]}>{t.takePhoto}</Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7} style={{ flex: 1 }}>
                  <LiquidGlassCard style={styles.photoOption}>
                    <ImageIcon size={24} color={colors.primary} />
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
                icon={<ShieldCheck size={20} color="#FFFFFF" />}
              />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 22,
    flex: 1,
  },
  label: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  inputCard: {
    minHeight: 120,
  },
  textArea: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    minHeight: 100,
    padding: 0,
  },
  photoWrap: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoOption: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  photoOptionText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  submitWrap: {
    marginTop: 16,
  },
  thankYouContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thankYouContent: {
    alignItems: 'center',
    gap: 16,
  },
  thankYouIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 28,
  },
  thankYouMsg: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});
