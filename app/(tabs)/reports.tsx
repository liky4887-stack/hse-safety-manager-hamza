import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ShieldCheck, AlertTriangle, Filter, X, FileText, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { StatusBadge, PriorityBadge } from '@/components/Badges';
import { EmptyState } from '@/components/States';
import { DEPARTMENTS } from '@/config/departments';
import type { ReportType, ReportStatus } from '@/types';

type FilterType = 'all' | ReportType;
type FilterStatus = 'all' | ReportStatus;
type FilterDept = 'all' | string;

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const user = useStore((s) => s.user);
  const reports = useStore((s) => s.reports);
  const softDeleteReport = useStore((s) => s.softDeleteReport);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDept, setFilterDept] = useState<FilterDept>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userReports = useMemo(() => {
    if (!user) return [];
    // Top-level roles see everything
    if (user.role === 'admin' || user.role === 'hse_officer') return reports;
    // Supervisors see all reports in their own department
    if (user.role === 'supervisor') {
      return reports.filter((r) => r.department === user.department);
    }
    // Employees / technicians see only their own
    return reports.filter((r) => r.createdBy === user.id || r.assignedTo === user.id);
  }, [reports, user]);

  // Who can delete reports?
  const canManage = user?.role === 'supervisor' ||
                    user?.role === 'admin' ||
                    user?.role === 'hse_officer';

  const filteredReports = useMemo(() => {
    return userReports.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterDept !== 'all' && r.department !== filterDept) return false;
      return true;
    });
  }, [userReports, filterType, filterStatus, filterDept]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const activeFilters = (filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0) + (filterDept !== 'all' ? 1 : 0);

  const handleDelete = (report: typeof filteredReports[0]) => {
    Alert.alert(
      lang === 'ar' ? 'تأكيد الحذف' : 'Confirm delete',
      lang === 'ar'
        ? 'هل أنت متأكد من حذف هذا التقرير؟ سيختفي من التطبيق ولوحة القسم.'
        : 'Delete this report? It will disappear from the app and department dashboard.',
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => { void softDeleteReport(report.id); },
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: typeof filteredReports[0]; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/report/details/${item.id}`)}>
        <LiquidGlassCard style={styles.reportCard}>
          <View style={styles.reportRow}>
            <View style={[styles.reportIcon, { backgroundColor: item.type === 'safe' ? colors.successLight : colors.errorLight }]}>
              {item.type === 'safe' ? (
                <ShieldCheck size={20} color={colors.success} />
              ) : (
                <AlertTriangle size={20} color={colors.error} />
              )}
            </View>
            <View style={styles.reportInfo}>
              <Text style={[styles.reportDesc, { color: colors.text }]} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.reportMeta}>
                {item.department && (
                  <Text style={[styles.reportDept, { color: colors.textTertiary }]}>
                    {lang === 'ar' ? DEPARTMENTS.find((d) => d.id === item.department)?.nameAr : DEPARTMENTS.find((d) => d.id === item.department)?.nameEn}
                  </Text>
                )}
                <Text style={[styles.reportDate, { color: colors.textTertiary }]}>
                  {new Date(item.createdAt).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
                </Text>
              </View>
              <View style={styles.badgesRow}>
                <StatusBadge
                  status={item.status}
                  label={item.status === 'open' ? t.open : item.status === 'in_progress' ? t.inProgress : t.closed}
                />
                {item.priority && item.type === 'unsafe' && (
                  <PriorityBadge
                    priority={item.priority}
                    label={
                      item.priority === 'low' ? t.priorityLow :
                      item.priority === 'medium' ? t.priorityMedium :
                      item.priority === 'high' ? t.priorityHigh : t.priorityCritical
                    }
                  />
                )}
              </View>
            </View>

            {canManage && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </LiquidGlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <GlassBackground>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t.myReports}</Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={[styles.filterBtn, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder, borderWidth: 1 }]}
          >
            <Filter size={18} color={colors.primary} />
            {activeFilters > 0 && (
              <View style={[styles.filterCount, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterCountText}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showFilters && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.filtersContainer}>
            <LiquidGlassCard style={styles.filtersCard}>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t.filterType}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {([
                    { id: 'all', label: t.all },
                    { id: 'safe', label: t.safeCondition },
                    { id: 'unsafe', label: t.unsafeCondition },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setFilterType(opt.id)}
                      style={[styles.chip, filterType === opt.id && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
                    >
                      <Text style={[styles.chipText, { color: filterType === opt.id ? '#FFFFFF' : colors.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t.filterStatus}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {([
                    { id: 'all', label: t.all },
                    { id: 'open', label: t.open },
                    { id: 'in_progress', label: t.inProgress },
                    { id: 'closed', label: t.closed },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => setFilterStatus(opt.id)}
                      style={[styles.chip, filterStatus === opt.id && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
                    >
                      <Text style={[styles.chipText, { color: filterStatus === opt.id ? '#FFFFFF' : colors.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.filterGroup}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t.filterDept}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <TouchableOpacity
                    onPress={() => setFilterDept('all')}
                    style={[styles.chip, filterDept === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.chipText, { color: filterDept === 'all' ? '#FFFFFF' : colors.text }]}>{t.all}</Text>
                  </TouchableOpacity>
                  {DEPARTMENTS.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      onPress={() => setFilterDept(dept.id)}
                      style={[styles.chip, filterDept === dept.id && { backgroundColor: colors.primary, borderColor: colors.primary }, { borderColor: colors.border, borderWidth: 1 }]}
                    >
                      <Text style={[styles.chipText, { color: filterDept === dept.id ? '#FFFFFF' : colors.text }]}>
                        {lang === 'ar' ? dept.nameAr : dept.nameEn}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {activeFilters > 0 && (
                <TouchableOpacity
                  onPress={() => { setFilterType('all'); setFilterStatus('all'); setFilterDept('all'); }}
                  style={styles.clearFilters}
                >
                  <X size={14} color={colors.error} />
                  <Text style={[styles.clearText, { color: colors.error }]}>{lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}</Text>
                </TouchableOpacity>
              )}
            </LiquidGlassCard>
          </Animated.View>
        )}

        {filteredReports.length === 0 ? (
          <EmptyState
            title={t.noReports}
            message={t.noReportsMsg}
            icon={<FileText size={48} color={colors.textTertiary} />}
          />
        ) : (
          <FlatList
            data={filteredReports}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          />
        )}
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filtersCard: {
    gap: 12,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontFamily: 'Cairo-Medium',
    fontSize: 12,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
  },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  clearText: {
    fontFamily: 'Cairo-Medium',
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  reportCard: {
    minHeight: 80,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
    gap: 4,
  },
  reportDesc: {
    fontFamily: 'Cairo-Medium',
    fontSize: 14,
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  reportDept: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
  },
  reportDate: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
