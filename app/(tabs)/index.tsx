import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t.welcome}</Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
        </View>

        <View style={styles.cardsCol}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/report/safe')}
            style={styles.cardTouch}
          >
            <LiquidGlassCard style={styles.bigCard}>
              <View style={styles.cardCenter}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {lang === 'ar' ? t.safeCondition : 'Safe Condition'}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                  {lang === 'ar' ? t.safeDesc : 'Report a safe condition or behavior'}
                </Text>
              </View>
            </LiquidGlassCard>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/report/unsafe')}
            style={styles.cardTouch}
          >
            <LiquidGlassCard style={styles.bigCard}>
              <View style={styles.cardCenter}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {lang === 'ar' ? t.unsafeCondition : 'Unsafe Condition'}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                  {lang === 'ar' ? t.unsafeDesc : 'Report an unsafe condition or act'}
                </Text>
              </View>
            </LiquidGlassCard>
          </TouchableOpacity>
        </View>

        <LiquidGlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{myReports.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.myReports}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{openCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.open}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{closedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.closed}</Text>
            </View>
          </View>
        </LiquidGlassCard>

        {recentReports.length > 0 && (
          <View>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {lang === 'ar' ? 'أحدث التقارير' : 'Recent Reports'}
              </Text>
              <Text
                style={[styles.seeAll, { color: colors.primary }]}
                onPress={() => router.push('/(tabs)/reports')}
              >
                {lang === 'ar' ? 'عرض الكل' : 'See all'}
              </Text>
            </View>
            {recentReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/report/details/${report.id}`)}
              >
                <LiquidGlassCard style={styles.recentCard}>
                  <View style={styles.recentRow}>
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
            ))}
          </View>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 18 },
  greeting: { fontFamily: 'Cairo-Regular', fontSize: 14, lineHeight: 22 },
  userName: { fontFamily: 'Cairo-Bold', fontSize: 28, lineHeight: 40 },
  cardsCol: { gap: 12 },
  cardTouch: { width: '100%' },
  bigCard: { minHeight: 96 },
  cardCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'Cairo-Bold', fontSize: 18, lineHeight: 28, textAlign: 'center',
  },
  cardDesc: {
    fontFamily: 'Cairo-Regular', fontSize: 13, lineHeight: 20, textAlign: 'center',
  },
  statsCard: { minHeight: 80 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 36, opacity: 0.6 },
  statValue: { fontFamily: 'Cairo-Bold', fontSize: 22, lineHeight: 32 },
  statLabel: {
    fontFamily: 'Cairo-Regular', fontSize: 12, lineHeight: 18, textAlign: 'center',
  },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  sectionTitle: { fontFamily: 'Cairo-Bold', fontSize: 18, lineHeight: 28 },
  seeAll: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22 },
  recentCard: { minHeight: 64, marginBottom: 8 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentInfo: { flex: 1, gap: 2 },
  recentTitle: { fontFamily: 'Cairo-Medium', fontSize: 14, lineHeight: 22 },
  recentDate: { fontFamily: 'Cairo-Regular', fontSize: 12, lineHeight: 18 },
});
