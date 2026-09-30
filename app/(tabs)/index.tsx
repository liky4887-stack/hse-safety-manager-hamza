import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { ShieldCheck, AlertTriangle, FileText, Clock, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { StatusBadge } from '@/components/Badges';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const user = useStore((s) => s.user);
  const reports = useStore((s) => s.reports);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const myReports = reports.filter((r) => r.createdBy === user?.id);
  const openCount = myReports.filter((r) => r.status !== 'closed').length;
  const closedCount = myReports.filter((r) => r.status === 'closed').length;

  const recentReports = [...myReports].slice(0, 3);

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t.welcome}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.cardsRow}>
          <TouchableOpacity
            style={styles.cardTouch}
            activeOpacity={0.8}
            onPress={() => router.push('/report/safe')}
          >
            <LiquidGlassCard style={styles.bigCard}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.successLight }]}>
                <ShieldCheck size={36} color={colors.success} strokeWidth={1.5} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {lang === 'ar' ? t.safeCondition : 'Safe Condition'}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {lang === 'ar' ? t.safeDesc : 'Report a safe condition or behavior'}
              </Text>
              <View style={[styles.cardArrow, { backgroundColor: colors.success }]}>
                <Text style={styles.cardArrowText}>+</Text>
              </View>
            </LiquidGlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardTouch}
            activeOpacity={0.8}
            onPress={() => router.push('/report/unsafe')}
          >
            <LiquidGlassCard style={styles.bigCard}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.errorLight }]}>
                <AlertTriangle size={36} color={colors.error} strokeWidth={1.5} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {lang === 'ar' ? t.unsafeCondition : 'Unsafe Condition'}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {lang === 'ar' ? t.unsafeDesc : 'Report an unsafe condition or act'}
              </Text>
              <View style={[styles.cardArrow, { backgroundColor: colors.error }]}>
                <Text style={styles.cardArrowText}>!</Text>
              </View>
            </LiquidGlassCard>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.bgSecondary }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{myReports.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.myReports}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
                <Clock size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{openCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.open}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <CheckCircle size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{closedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.closed}</Text>
            </View>
          </View>
        </Animated.View>

        {recentReports.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'ar' ? 'أحدث التقارير' : 'Recent Reports'}</Text>
              <Text
                style={[styles.seeAll, { color: colors.primary }]}
                onPress={() => router.push('/(tabs)/reports')}
              >
                {lang === 'ar' ? 'عرض الكل' : 'See all'}
              </Text>
            </View>
            {recentReports.map((report, i) => (
              <Animated.View key={report.id} entering={FadeInLeft.delay(i * 100).duration(400)}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/report/details/${report.id}`)}>
                  <LiquidGlassCard style={styles.recentCard}>
                    <View style={styles.recentRow}>
                      <View style={[styles.recentIcon, { backgroundColor: report.type === 'safe' ? colors.successLight : colors.errorLight }]}>
                        {report.type === 'safe' ? (
                          <ShieldCheck size={18} color={colors.success} />
                        ) : (
                          <AlertTriangle size={18} color={colors.error} />
                        )}
                      </View>
                      <View style={styles.recentInfo}>
                        <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
                          {report.description}
                        </Text>
                        <Text style={[styles.recentDate, { color: colors.textTertiary }]}>
                          {new Date(report.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                        </Text>
                      </View>
                      <StatusBadge
                        status={report.status}
                        label={report.status === 'open' ? t.open : report.status === 'in_progress' ? t.inProgress : t.closed}
                      />
                    </View>
                  </LiquidGlassCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  greeting: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
  },
  userName: {
    fontFamily: 'Cairo-Bold',
    fontSize: 28,
  },
  cardsRow: {
    gap: 12,
  },
  cardTouch: {
    width: '100%',
  },
  bigCard: {
    minHeight: 120,
    padding: 20,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 20,
  marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Cairo-Regular',
    fontSize: 13,
  },
  cardArrow: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 22,
  },
  statLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 11,
    textAlign: 'center',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
  },
  seeAll: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
  },
  recentCard: {
    minHeight: 64,
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
    gap: 2,
  },
  recentTitle: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
  },
  recentDate: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
  },
});
