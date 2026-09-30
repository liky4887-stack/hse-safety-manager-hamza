import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { FileText, Clock, CheckCircle, AlertTriangle, Filter } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { DEPARTMENTS } from '@/config/departments';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 72;

type DateRange = '7' | '30' | '90' | 'all';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const reports = useStore((s) => s.reports);
  const insets = useSafeAreaInsets();
  const [dateRange, setDateRange] = useState<DateRange>('30');

  const filteredReports = useMemo(() => {
    if (dateRange === 'all') return reports;
    const days = parseInt(dateRange, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return reports.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
  }, [reports, dateRange]);

  const total = filteredReports.length;
  const openCount = filteredReports.filter((r) => r.status !== 'closed').length;
  const closedCount = filteredReports.filter((r) => r.status === 'closed').length;

  const avgClosureHours = useMemo(() => {
    const closed = filteredReports.filter((r) => r.status === 'closed' && r.closedAt);
    if (closed.length === 0) return 0;
    const totalHours = closed.reduce((sum, r) => {
      const diff = new Date(r.closedAt!).getTime() - new Date(r.createdAt).getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0);
    return Math.round(totalHours / closed.length);
  }, [filteredReports]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((r) => {
      if (r.department) counts[r.department] = (counts[r.department] || 0) + 1;
    });
    return DEPARTMENTS
      .map((d) => ({
        label: lang === 'ar' ? d.nameAr : d.nameEn,
        value: counts[d.id] || 0,
        frontColor: colors.chartColors[DEPARTMENTS.indexOf(d) % colors.chartColors.length],
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredReports, lang, colors]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    filteredReports.forEach((r) => {
      if (r.priority) counts[r.priority]++;
    });
    return [
      { label: t.priorityLow, value: counts.low, color: colors.success },
      { label: t.priorityMedium, value: counts.medium, color: colors.info },
      { label: t.priorityHigh, value: counts.high, color: colors.warning },
      { label: t.priorityCritical, value: counts.critical, color: colors.error },
    ].filter((d) => d.value > 0);
  }, [filteredReports, t, colors]);

  const rangeOptions: { id: DateRange; label: string }[] = [
    { id: '7', label: t.last7Days },
    { id: '30', label: t.last30Days },
    { id: '90', label: t.last90Days },
    { id: 'all', label: t.allTime },
  ];

  return (
    <GlassBackground>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={[styles.title, { color: colors.text }]}>{t.dashboard}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.rangeRow}>
          {rangeOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setDateRange(opt.id)}
              style={[
                styles.rangeChip,
                dateRange === opt.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                { borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.rangeText, { color: dateRange === opt.id ? '#FFFFFF' : colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsGrid}>
          <LiquidGlassCard style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.bgSecondary }]}>
              <FileText size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.totalReports}</Text>
          </LiquidGlassCard>
          <LiquidGlassCard style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.warningLight }]}>
              <AlertTriangle size={22} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{openCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.openReports}</Text>
          </LiquidGlassCard>
          <LiquidGlassCard style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.successLight }]}>
              <CheckCircle size={22} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{closedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.closedReports}</Text>
          </LiquidGlassCard>
          <LiquidGlassCard style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: colors.info + '20' }]}>
              <Clock size={22} color={colors.info} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{avgClosureHours}h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t.avgClosureTime}</Text>
          </LiquidGlassCard>
        </Animated.View>

        {deptData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t.byDepartment}</Text>
            <LiquidGlassCard style={styles.chartCard}>
              <BarChart
                data={deptData}
                barWidth={CHART_WIDTH / Math.max(deptData.length, 1) - 12}
                isAnimated
                roundedTop
                roundedBottom={false}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontFamily: 'Cairo-Regular', fontSize: 10 }}
                yAxisTextStyle={{ color: colors.textTertiary, fontFamily: 'Cairo-Regular', fontSize: 10 }}
                noOfSections={Math.max(Math.ceil(Math.max(...deptData.map((d) => d.value)) / 2), 2)}
                labelsExtraHeight={4}
                showFractionalValues={false}
                spacing={8}
                labelWidth={lang === 'ar' ? 70 : 56}
                rotateLabel={lang === 'ar'}
              />
            </LiquidGlassCard>
          </Animated.View>
        )}

        {priorityData.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t.byPriority}</Text>
            <LiquidGlassCard style={styles.chartCard}>
              <View style={styles.pieWrap}>
                <PieChart
                  data={priorityData.map((d) => ({
                    value: d.value,
                    color: d.color,
                    label: d.label,
                  }))}
                  donut
                  radius={90}
                  innerRadius={50}
                  centerLabelComponent={() => (
                    <View style={styles.pieCenter}>
                      <Text style={[styles.pieCenterValue, { color: colors.text }]}>{total}</Text>
                      <Text style={[styles.pieCenterLabel, { color: colors.textSecondary }]}>{t.totalReports}</Text>
                    </View>
                  )}
                />
                <View style={styles.legendWrap}>
                  {priorityData.map((d) => (
                    <View key={d.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{d.label}</Text>
                      <Text style={[styles.legendValue, { color: colors.text }]}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LiquidGlassCard>
          </Animated.View>
        )}

        {total === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noReports}</Text>
          </View>
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
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rangeText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 28,
  },
  statLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  chartTitle: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  chartCard: {
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  pieWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pieCenter: {
    alignItems: 'center',
  },
  pieCenterValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  pieCenterLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 10,
  },
  legendWrap: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    flex: 1,
  },
  legendValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
  },
});
