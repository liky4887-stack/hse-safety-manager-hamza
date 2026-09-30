import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { AlertTriangle, Camera, Image as ImageIcon, X, CheckCircle, MapPin, ChevronLeft, ChevronRight, FileText, Wrench } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { LoadingState } from '@/components/States';
import { DEPARTMENTS } from '@/config/departments';
import type { UnsafeCategory, Priority, ReportStatus, ReportLocation } from '@/types';

const STEPS = 5;

export default function UnsafeReportScreen() {
  const { colors } = useTheme();
  const { t, lang, rtl } = useI18n();
  const createReport = useStore((s) => s.createReport);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<UnsafeCategory | null>(null);
  const [description, setDescription] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [department, setDepartment] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus>('open');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const captureLocation = async () => {
    setLocating(true);
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const addressStr = addr
        ? `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.country || ''}`.trim()
        : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: addressStr,
      });
    } catch {
      // silently fail
    }
    setLocating(false);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return category !== null;
      case 2: return description.trim().length > 0 && correctiveAction.trim().length > 0;
      case 3: return department !== null;
      case 4: return subcategory !== null;
      case 5: return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createReport({
        type: 'unsafe',
        category: category ?? undefined,
        description: description.trim(),
        correctiveAction: correctiveAction.trim(),
        photoUri,
        department,
        subcategory,
        status,
        priority,
        location,
      });
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => router.replace('/(tabs)'), 2000);
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

  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <GlassBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={styles.backBtn}>
              <BackIcon size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={[styles.headerIcon, { backgroundColor: colors.errorLight }]}>
              <AlertTriangle size={24} color={colors.error} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t.reportUnsafe}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
              <Animated.View
                entering={FadeInRight.duration(300)}
                style={[styles.progressFill, { width: `${(step / STEPS) * 100}%`, backgroundColor: colors.error }]}
              />
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t.step} {step} {t.of} {STEPS}
            </Text>
          </Animated.View>

          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(400)} key="step1">
              <Text style={[styles.stepTitle, { color: colors.text }]}>{t.classification}</Text>
              <View style={styles.classOptions}>
                <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => setCategory('condition')}>
                  <LiquidGlassCard style={[styles.classCard, category === 'condition' && { borderColor: colors.error, borderWidth: 2 }]}>
                    <View style={[styles.classIcon, { backgroundColor: colors.errorLight }]}>
                      <AlertTriangle size={28} color={colors.error} />
                    </View>
                    <Text style={[styles.classTitle, { color: colors.text }]}>
                      {lang === 'ar' ? 'حالة غير آمنة' : 'Unsafe Condition'}
                    </Text>
                    <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
                      {lang === 'ar' ? 'خطر في المكان أو المعدات' : 'Hazard in place or equipment'}
                    </Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => setCategory('act')}>
                  <LiquidGlassCard style={[styles.classCard, category === 'act' && { borderColor: colors.error, borderWidth: 2 }]}>
                    <View style={[styles.classIcon, { backgroundColor: colors.warningLight }]}>
                      <Wrench size={28} color={colors.warning} />
                    </View>
                    <Text style={[styles.classTitle, { color: colors.text }]}>
                      {lang === 'ar' ? 'تصرف غير آمن' : 'Unsafe Act'}
                    </Text>
                    <Text style={[styles.classDesc, { color: colors.textSecondary }]}>
                      {lang === 'ar' ? 'سلوك أو إجراء خطر' : 'Hazardous behavior or action'}
                    </Text>
                  </LiquidGlassCard>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(400)} key="step2" style={{ gap: 16 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{t.reportDetails}</Text>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t.description} <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <LiquidGlassCard style={styles.inputCard}>
                  <TextInput
                    style={[styles.textArea, { color: colors.text }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t.writeNotePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </LiquidGlassCard>
              </View>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t.correctiveAction} <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <LiquidGlassCard style={styles.inputCard}>
                  <TextInput
                    style={[styles.textArea, { color: colors.text }]}
                    value={correctiveAction}
                    onChangeText={setCorrectiveAction}
                    placeholder={t.correctiveActionPlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </LiquidGlassCard>
              </View>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t.attachPhoto} ({t.optional})</Text>
                {photoUri ? (
                  <View style={styles.photoWrap}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    <TouchableOpacity style={[styles.removePhoto, { backgroundColor: colors.error }]} onPress={() => setPhotoUri(null)}>
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.photoActions}>
                    <TouchableOpacity onPress={takePhoto} activeOpacity={0.7} style={{ flex: 1 }}>
                      <LiquidGlassCard style={styles.photoOption}>
                        <Camera size={22} color={colors.primary} />
                        <Text style={[styles.photoOptionText, { color: colors.text }]}>{t.takePhoto}</Text>
                      </LiquidGlassCard>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} activeOpacity={0.7} style={{ flex: 1 }}>
                      <LiquidGlassCard style={styles.photoOption}>
                        <ImageIcon size={22} color={colors.primary} />
                        <Text style={[styles.photoOptionText, { color: colors.text }]}>{t.chooseFromGallery}</Text>
                      </LiquidGlassCard>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t.gpsLocation} ({t.optional})</Text>
                {location ? (
                  <LiquidGlassCard style={styles.locationCard}>
                    <View style={styles.locationRow}>
                      <MapPin size={20} color={colors.success} />
                      <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={2}>{location.address}</Text>
                      <TouchableOpacity onPress={() => setLocation(null)}>
                        <X size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </LiquidGlassCard>
                ) : (
                  <TouchableOpacity onPress={captureLocation} activeOpacity={0.7}>
                    <LiquidGlassCard style={styles.locationBtn}>
                      <MapPin size={20} color={colors.primary} />
                      <Text style={[styles.locationBtnText, { color: colors.primary }]}>
                        {locating ? t.capturingLocation : t.gpsLocation}
                      </Text>
                    </LiquidGlassCard>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeInDown.duration(400)} key="step3">
              <Text style={[styles.stepTitle, { color: colors.text }]}>{t.responsibleDept}</Text>
              <View style={styles.deptGrid}>
                {DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setDepartment(dept.id);
                      setSubcategory(null);
                    }}
                    style={{ flexBasis: '48%', flexGrow: 1 }}
                  >
                    <LiquidGlassCard style={[styles.deptCard, department === dept.id && { borderColor: colors.primary, borderWidth: 2 }]}>
                      <Text style={[styles.deptText, { color: colors.text }]}>
                        {lang === 'ar' ? dept.nameAr : dept.nameEn}
                      </Text>
                    </LiquidGlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {step === 4 && department && (
            <Animated.View entering={FadeInDown.duration(400)} key="step4">
              <Text style={[styles.stepTitle, { color: colors.text }]}>{t.subcategory}</Text>
              <View style={styles.subGrid}>
                {DEPARTMENTS.find((d) => d.id === department)?.subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    activeOpacity={0.7}
                    onPress={() => setSubcategory(sub.id)}
                  >
                    <LiquidGlassCard style={[styles.subCard, subcategory === sub.id && { borderColor: colors.primary, borderWidth: 2 }]}>
                      <Text style={[styles.subText, { color: colors.text }]}>
                        {lang === 'ar' ? sub.nameAr : sub.nameEn}
                      </Text>
                    </LiquidGlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {step === 5 && (
            <Animated.View entering={FadeInDown.duration(400)} key="step5" style={{ gap: 16 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{t.status} & {t.priority}</Text>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t.status}</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => setStatus('closed')}>
                    <LiquidGlassCard style={[styles.statusCard, status === 'closed' && { borderColor: colors.success, borderWidth: 2 }]}>
                      <CheckCircle size={24} color={colors.success} />
                      <Text style={[styles.statusText, { color: colors.text }]}>{t.closed}</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        {lang === 'ar' ? 'تم الحل في الموقع' : 'Resolved on site'}
                      </Text>
                    </LiquidGlassCard>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={{ flex: 1 }} onPress={() => setStatus('open')}>
                    <LiquidGlassCard style={[styles.statusCard, status === 'open' && { borderColor: colors.error, borderWidth: 2 }]}>
                      <AlertTriangle size={24} color={colors.error} />
                      <Text style={[styles.statusText, { color: colors.text }]}>{t.open}</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        {lang === 'ar' ? 'يتطلب تدخلاً' : 'Needs intervention'}
                      </Text>
                    </LiquidGlassCard>
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t.selectPriority}</Text>
                <View style={styles.priorityRow}>
                  {([
                    { id: 'low', label: t.priorityLow, color: colors.success },
                    { id: 'medium', label: t.priorityMedium, color: colors.info },
                    { id: 'high', label: t.priorityHigh, color: colors.warning },
                    { id: 'critical', label: t.priorityCritical, color: colors.error },
                  ] as const).map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      style={{ flex: 1 }}
                      onPress={() => setPriority(p.id)}
                    >
                      <LiquidGlassCard style={[styles.priorityCard, priority === p.id && { borderColor: p.color, borderWidth: 2 }]}>
                        <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                        <Text style={[styles.priorityText, { color: colors.text }]}>{p.label}</Text>
                      </LiquidGlassCard>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {submitting ? (
            <LoadingState message={t.submitting} />
          ) : (
            <View style={styles.navButtons}>
              {step > 1 && (
                <View style={{ flex: 1 }}>
                  <LiquidGlassButton
                    title={t.back}
                    onPress={() => setStep(step - 1)}
                    variant="ghost"
                    size="md"
                    fullWidth={false}
                  />
                </View>
              )}
              <View style={{ flex: 2 }}>
                {step < STEPS ? (
                  <LiquidGlassButton
                    title={t.next}
                    onPress={() => canProceed() && setStep(step + 1)}
                    size="md"
                    disabled={!canProceed()}
                    icon={<ForwardIcon size={20} color="#FFFFFF" />}
                  />
                ) : (
                  <LiquidGlassButton
                    title={t.submit}
                    onPress={handleSubmit}
                    size="md"
                    icon={<CheckCircle size={20} color="#FFFFFF" />}
                  />
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { position: 'absolute', top: 0, left: 0, zIndex: 10 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Cairo-Bold', fontSize: 20, flex: 1, textAlign: 'center' },
  progressWrap: { gap: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  stepText: { fontFamily: 'Cairo-Regular', fontSize: 12, textAlign: 'center' },
  stepTitle: { fontFamily: 'Cairo-Bold', fontSize: 18, marginBottom: 4 },
  classOptions: { flexDirection: 'row', gap: 12 },
  classCard: { minHeight: 160, alignItems: 'center', padding: 20 },
  classIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  classTitle: { fontFamily: 'Cairo-Bold', fontSize: 16, marginBottom: 4 },
  classDesc: { fontFamily: 'Cairo-Regular', fontSize: 12, textAlign: 'center' },
  label: { fontFamily: 'Cairo-Medium', fontSize: 14, marginBottom: 8 },
  inputCard: { minHeight: 80 },
  textArea: { fontFamily: 'Cairo-Regular', fontSize: 16, minHeight: 60, padding: 0 },
  photoWrap: { position: 'relative' },
  photoPreview: { width: '100%', height: 180, borderRadius: 16 },
  removePhoto: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoOption: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  photoOptionText: { fontFamily: 'Cairo-Medium', fontSize: 12, textAlign: 'center' },
  locationCard: { minHeight: 48 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { flex: 1, fontFamily: 'Cairo-Regular', fontSize: 13 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  locationBtnText: { fontFamily: 'Cairo-Bold', fontSize: 14 },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  deptCard: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  deptText: { fontFamily: 'Cairo-Medium', fontSize: 14, textAlign: 'center' },
  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subCard: { minHeight: 48, flexBasis: '48%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  subText: { fontFamily: 'Cairo-Medium', fontSize: 14, textAlign: 'center' },
  statusRow: { flexDirection: 'row', gap: 12 },
  statusCard: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  statusText: { fontFamily: 'Cairo-Bold', fontSize: 16 },
  statusDesc: { fontFamily: 'Cairo-Regular', fontSize: 11, textAlign: 'center' },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityCard: { alignItems: 'center', gap: 6, paddingVertical: 14 },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  priorityText: { fontFamily: 'Cairo-Medium', fontSize: 12, textAlign: 'center' },
  navButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  thankYouContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thankYouContent: { alignItems: 'center', gap: 16 },
  thankYouIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  thankYouTitle: { fontFamily: 'Cairo-Bold', fontSize: 28 },
  thankYouMsg: { fontFamily: 'Cairo-Regular', fontSize: 16, textAlign: 'center' },
});
