import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ShieldCheck, AlertTriangle, MapPin, Clock, User, Wrench,
  CheckCircle, FileText, ChevronLeft, ChevronRight, Camera,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { LiquidGlassButton } from '@/components/LiquidGlassButton';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { getDepartmentById, getSubcategoryById } from '@/config/departments';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, lang, rtl } = useI18n();
  const report = useStore((s) => s.reports.find((r) => r.id === id));
  const user = useStore((s) => s.user);
  const updateReportStatus = useStore((s) => s.updateReportStatus);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!report) {
    return (
      <GlassBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={{ color: colors.text, fontFamily: 'Cairo-Bold', fontSize: 18 }}>{t.noReports}</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontFamily: 'Cairo-Bold' }}>{t.back}</Text>
          </TouchableOpacity>
        </View>
      </GlassBackground>
    );
  }

  const dept = report.department ? getDepartmentById(report.department) : null;
  const sub = report.department && report.subcategory ? getSubcategoryById(report.department, report.subcategory) : null;

  const canUpdateStatus =
    user?.role === 'technician' || user?.role === 'hse_officer' || user?.role === 'admin';

  const handleStatusUpdate = (status: 'in_progress' | 'closed') => {
    updateReportStatus(report.id, status);
  };

  const openInMaps = () => {
    if (report.location) {
      const url = `https://maps.google.com/?q=${report.location.latitude},${report.location.longitude}`;
      Linking.openURL(url);
    }
  };

  const BackIcon = rtl ? ChevronRight : ChevronLeft;
  const statusLabel = report.status === 'open' ? t.open : report.status === 'in_progress' ? t.inProgress : t.closed;

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <BackIcon size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={[styles.headerIcon, { backgroundColor: report.type === 'safe' ? colors.successLight : colors.errorLight }]}>
            {report.type === 'safe' ? (
              <ShieldCheck size={24} color={colors.success} />
            ) : (
              <AlertTriangle size={24} color={colors.error} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {report.type === 'safe' ? t.reportSafe : t.reportUnsafe}
            </Text>
            <StatusBadge status={report.status} label={statusLabel} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LiquidGlassCard style={styles.sectionCard}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.description}</Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>{report.description}</Text>
          </LiquidGlassCard>
        </Animated.View>

        {report.correctiveAction && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <LiquidGlassCard style={styles.sectionCard}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t.correctiveAction}</Text>
              <Text style={[styles.sectionContent, { color: colors.text }]}>{report.correctiveAction}</Text>
            </LiquidGlassCard>
          </Animated.View>
        )}

        {report.photoUri && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t.photo}</Text>
            <ExpoImage
              source={report.photoUri}
              style={styles.photo}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </Animated.View>
        )}

        {report.location && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)}>
            <LiquidGlassCard style={styles.sectionCard}>
              <View style={styles.locationHeader}>
                <MapPin size={18} color={colors.primary} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, flex: 1 }]}>{t.location}</Text>
                <TouchableOpacity onPress={openInMaps}>
                  <Text style={[styles.link, { color: colors.primary }]}>{t.openInMaps}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionContent, { color: colors.text }]}>{report.location.address}</Text>
              <Text style={[styles.coords, { color: colors.textTertiary }]}>
                {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
              </Text>
            </LiquidGlassCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <LiquidGlassCard style={styles.metaCard}>
            {report.category && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.classification}</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {report.category === 'condition' ? t.unsafeConditionShort : t.unsafeAct}
                </Text>
              </View>
            )}
            {dept && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.department}</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {lang === 'ar' ? dept.nameAr : dept.nameEn}
                </Text>
              </View>
            )}
            {sub && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.subcategory}</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {lang === 'ar' ? sub.nameAr : sub.nameEn}
                </Text>
              </View>
            )}
            {report.priority && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.priority}</Text>
                <PriorityBadge
                  priority={report.priority}
                  label={
                    report.priority === 'low' ? t.priorityLow :
                    report.priority === 'medium' ? t.priorityMedium :
                    report.priority === 'high' ? t.priorityHigh : t.priorityCritical
                  }
                />
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.createdBy}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{report.createdByName}</Text>
            </View>
            {report.assignedToName && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.assignedTo}</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{report.assignedToName}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.createdAt}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {new Date(report.createdAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
              </Text>
            </View>
            {report.closedAt && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t.closedAt}</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {new Date(report.closedAt).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                </Text>
              </View>
            )}
          </LiquidGlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(500)}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 8 }]}>{t.timeline}</Text>
          <LiquidGlassCard style={styles.timelineCard}>
            {report.timeline.map((event, i) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: i === 0 ? colors.primary : colors.success }]} />
                {i < report.timeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: colors.text }]}>{event.label}</Text>
                  <Text style={[styles.timelineTime, { color: colors.textTertiary }]}>
                    {new Date(event.timestamp).toLocaleString(lang === 'ar' ? 'ar' : 'en')}
                  </Text>
                  <Text style={[styles.timelineActor, { color: colors.textSecondary }]}>{event.actor}</Text>
                </View>
              </View>
            ))}
          </LiquidGlassCard>
        </Animated.View>

        {canUpdateStatus && report.status !== 'closed' && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actions}>
            {report.status === 'open' && (
              <LiquidGlassButton
                title={t.markInProgress}
                onPress={() => handleStatusUpdate('in_progress')}
                variant="secondary"
                icon={<Wrench size={20} color="#FFFFFF" />}
              />
            )}
            <View style={{ height: 8 }} />
            <LiquidGlassButton
              title={report.type === 'safe' ? t.verifyDocument : t.markClosed}
              onPress={() => handleStatusUpdate('closed')}
              variant="primary"
              icon={<CheckCircle size={20} color="#FFFFFF" />}
            />
          </Animated.View>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: { position: 'absolute', top: 0, left: 0, zIndex: 10 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, gap: 4 },
  title: { fontFamily: 'Cairo-Bold', fontSize: 18 },
  sectionCard: { gap: 4 },
  sectionLabel: { fontFamily: 'Cairo-Medium', fontSize: 13 },
  sectionContent: { fontFamily: 'Cairo-Regular', fontSize: 15 },
  photo: { width: '100%', height: 220, borderRadius: 16 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  link: { fontFamily: 'Cairo-Bold', fontSize: 13 },
  coords: { fontFamily: 'Cairo-Regular', fontSize: 12, marginTop: 4 },
  metaCard: { gap: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontFamily: 'Cairo-Medium', fontSize: 13 },
  metaValue: { fontFamily: 'Cairo-Regular', fontSize: 14 },
  timelineCard: { gap: 0, paddingVertical: 16 },
  timelineItem: { flexDirection: 'row', minHeight: 48 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { position: 'absolute', left: 5, top: 16, width: 2, bottom: -8 },
  timelineContent: { marginLeft: 12, flex: 1, gap: 2 },
  timelineLabel: { fontFamily: 'Cairo-Bold', fontSize: 14 },
  timelineTime: { fontFamily: 'Cairo-Regular', fontSize: 11 },
  timelineActor: { fontFamily: 'Cairo-Regular', fontSize: 12 },
  actions: { marginTop: 8, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
