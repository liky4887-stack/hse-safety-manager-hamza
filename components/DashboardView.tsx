import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import { useStore } from '@/store';
import { GlassBackground } from '@/components/GlassBackground';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { supabase } from '@/lib/supabase';
import { ROLES, DEPARTMENTS } from '@/config/departments';
import { generateDashboardPdf } from '@/lib/dashboardPdf';
import { saveToPhone } from '@/lib/saveToPhone';
import { generateDashboardExcel } from '@/lib/dashboardExcel';
import { generateDashboardWord } from '@/lib/dashboardWord';

type Mode = 'main' | 'dept';
type Tab = 'all' | 'open' | 'closed' | 'analytics';

interface Props {
  mode: Mode;
  department?: string | null;
}

interface Row {
  id: string;
  client_id: string;
  note: string;
  department: string | null;
  subcategory: string | null;
  type: string;
  status: string;
  priority: string | null;
  created_by_name: string | null;
  created_at: string;
  approved: boolean;
  deleted_at_dept: string | null;
  deleted_at_main: string | null;
  corrective_action: string | null;
  image_url: string | null;
}

export function DashboardView({ mode, department }: Props) {
  const { colors } = useTheme();
  const { lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dashboardUser = useStore((s) => s.dashboardUser);
  const logoutDashboard = useStore((s) => s.logoutDashboard);

  const [tab, setTab] = useState<Tab>('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      let q = supabase
        .from('hse_reports')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);

      if (mode === 'dept' && department) {
        q = q.eq('department', department).is('deleted_at_dept', null);
      } else {
        q = q.is('deleted_at_main', null);
      }

      const { data, error } = await q;
      if (error) {
        console.warn('[DashboardView] load failed:', error.message);
        return;
      }
      setRows((data ?? []) as Row[]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, department]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Re-fetch whenever the screen comes back into focus
  // (e.g. admin switched away and returned)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Realtime: refresh on any hse_reports change (insert / update / delete)
  // This is what makes the dashboard reflect deletions done by supervisors
  // from their phone app, and vice versa.
  useEffect(() => {
    const channelName = `dashboard-${mode}-${department ?? 'main'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hse_reports' },
        () => {
          console.log('[DashboardView] hse_reports changed — reloading');
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, mode, department]);

  // All reports (approved or not — approval no longer gates visibility)
  const allRows = rows;
  const openRows = rows.filter((r) => r.status !== 'closed');
  const closedRows = rows.filter((r) => r.status === 'closed');

  const handleApprove = async (clientId: string) => {
    const now = new Date().toISOString();
    setRows((prev) =>
      prev.map((r) => (r.client_id === clientId ? { ...r, approved: true } : r))
    );
    const { error } = await supabase
      .from('hse_reports')
      .update({ approved: true, approved_at: now, approved_by: dashboardUser?.username ?? 'admin', updated_at: now })
      .eq('client_id', clientId);
    if (error) {
      console.warn('[DashboardView] approve failed:', error.message);
      load();
    }
  };

  const handleDelete = async (row: Row) => {
    const key = mode === 'main' ? 'deleted_at_main' : 'deleted_at_dept';
    const now = new Date().toISOString();

    Alert.alert(
      lang === 'ar' ? 'تأكيد الحذف' : 'Confirm delete',
      lang === 'ar'
        ? (mode === 'main' ? 'سيختفي من لوحة التحكم الرئيسية فقط' : 'سيختفي من لوحة تحكم القسم فقط')
        : (mode === 'main' ? 'Will hide from main dashboard only' : 'Will hide from department dashboard only'),
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            setRows((prev) => prev.filter((r) => r.client_id !== row.client_id));
            const { error } = await supabase
              .from('hse_reports')
              .update({ [key]: now, updated_at: now })
              .eq('client_id', row.client_id);
            if (error) {
              console.warn('[DashboardView] delete failed:', error.message);
              load();
            }
          },
        },
      ]
    );
  };

  const handleRestore = async (row: Row) => {
    const key = mode === 'main' ? 'deleted_at_main' : 'deleted_at_dept';
    const { error } = await supabase
      .from('hse_reports')
      .update({ [key]: null, updated_at: new Date().toISOString() })
      .eq('client_id', row.client_id);
    if (error) console.warn('[DashboardView] restore failed:', error.message);
    load();
  };

  const [exporting, setExporting] = React.useState(false);

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const path = await generateDashboardExcel({
        title: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
        subtitle: deptLabel,
        generatedBy: dashboardUser?.displayName ?? '—',
        rows: allRows.map((r) => ({
          client_id: r.client_id, note: r.note,
          department: r.department, subcategory: r.subcategory,
          priority: r.priority, status: r.status,
          created_by_name: r.created_by_name,
          created_at: r.created_at,
          corrective_action: r.corrective_action,
        })),
        analytics: {
          total: analytics.total, openCount: analytics.openCount,
          closedCount: analytics.closedCount, pending: analytics.pending,
          byPriority: analytics.byPriority, topSubs: analytics.topSubs,
          topDepts: analytics.topDepts,
        },
        isArabic: lang === 'ar',
      });
      const filename = `dashboard-${Date.now()}.xls`;
      const saved = await saveToPhone(path, filename, 'application/vnd.ms-excel', 'حفظ Excel');
      if (saved) Alert.alert('✓ تم الحفظ', 'Excel');
    } catch (err) {
      console.error('[handleExportExcel] failed:', err);
      Alert.alert('خطأ', String(err));
    } finally { setExporting(false); }
  };

  const handleExportWord = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const path = await generateDashboardWord({
        title: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
        subtitle: deptLabel,
        generatedBy: dashboardUser?.displayName ?? '—',
        rows: allRows.map((r) => ({
          client_id: r.client_id, note: r.note,
          department: r.department, subcategory: r.subcategory,
          priority: r.priority, status: r.status,
          created_by_name: r.created_by_name,
          created_at: r.created_at,
          corrective_action: r.corrective_action,
        })),
        analytics: {
          total: analytics.total, openCount: analytics.openCount,
          closedCount: analytics.closedCount, pending: analytics.pending,
          byPriority: analytics.byPriority, topSubs: analytics.topSubs,
          topDepts: analytics.topDepts,
        },
        isArabic: lang === 'ar',
      });
      const filename = `dashboard-${Date.now()}.doc`;
      const saved = await saveToPhone(path, filename, 'application/msword', 'حفظ Word');
      if (saved) Alert.alert('✓ تم الحفظ', 'Word');
    } catch (err) {
      console.error('[handleExportWord] failed:', err);
      Alert.alert('خطأ', String(err));
    } finally { setExporting(false); }
  };

  const handleExportPdf = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const uri = await generateDashboardPdf({
        title: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard',
        subtitle: deptLabel,
        generatedBy: dashboardUser?.displayName ?? '—',
        rows: allRows.map((r) => ({
          client_id: r.client_id,
          note: r.note,
          department: r.department,
          subcategory: r.subcategory,
          priority: r.priority,
          status: r.status,
          created_by_name: r.created_by_name,
          created_at: r.created_at,
          corrective_action: r.corrective_action,
        })),
        analytics: {
          total: analytics.total,
          openCount: analytics.openCount,
          closedCount: analytics.closedCount,
          pending: analytics.pending,
          byPriority: analytics.byPriority,
          topSubs: analytics.topSubs,
          topDepts: analytics.topDepts,
        },
        isArabic: lang === 'ar',
      });
      const filename = `dashboard-${Date.now()}.pdf`;
      const saved = await saveToPhone(
        uri,
        filename,
        'application/pdf',
        lang === 'ar' ? 'حفظ PDF' : 'Save PDF',
      );
      if (saved) {
        Alert.alert(
          lang === 'ar' ? '✓ تم الحفظ' : '✓ Saved',
          lang === 'ar' ? 'تم حفظ ملف PDF في الجهاز' : 'PDF file saved on device',
        );
      }
    } catch (err) {
      console.error('[handleExportPdf] failed:', err);
      Alert.alert(
        lang === 'ar' ? 'خطأ' : 'Error',
        String(err || 'unknown')
      );
    } finally {
      setExporting(false);
    }
  };

  const handleToggleStatus = async (row: Row) => {
    const nextStatus = row.status === 'closed' ? 'open' : 'closed';
    const nowIso = new Date().toISOString();

    setRows((prev) =>
      prev.map((r) =>
        r.client_id === row.client_id
          ? { ...r, status: nextStatus, updated_at: nowIso }
          : r
      )
    );

    const { error } = await supabase
      .from('hse_reports')
      .update({
        status: nextStatus,
        closed_at: nextStatus === 'closed' ? nowIso : null,
        updated_at: nowIso,
      })
      .eq('client_id', row.client_id);

    if (error) {
      console.warn('[handleToggleStatus] failed:', error.message);
      load();
    }
  };

  const handleLogout = async () => {
    await logoutDashboard();
    router.replace('/(tabs)/profile');
  };

  // ── Analytics ──
  const analytics = React.useMemo(() => {
    const closedCount = allRows.filter((r) => r.status === 'closed').length;
    const openCount = allRows.filter((r) => r.status !== 'closed').length;
    const byPriority = { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>;
    const bySub = new Map<string, number>();
    const byDept = new Map<string, number>();

    allRows.forEach((r) => {
      if (r.priority) byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      const sub = r.subcategory || '—';
      bySub.set(sub, (bySub.get(sub) || 0) + 1);
      if (mode === 'main') {
        const d = r.department || '—';
        byDept.set(d, (byDept.get(d) || 0) + 1);
      }
    });

    const topSubs = [...bySub.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topDepts = [...byDept.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    return {
      total: allRows.length,
      pending: 0,
      closedCount,
      openCount,
      byPriority,
      topSubs,
      topDepts,
    };
  }, [allRows, mode]);

  const renderReportRow = (r: Row, actions: 'view' | 'manage') => (
    <LiquidGlassCard key={r.client_id} style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
            {r.note || '(no note)'}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
            {r.created_by_name || '?'} · {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : 'en')}
          </Text>
          <Text style={[styles.rowMeta2, { color: colors.textTertiary }]}>
            {r.department || '—'} · {r.subcategory || '—'} · {r.priority || '—'} · {r.status}
          </Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => handleToggleStatus(r)}
          style={[styles.actionBtn, {
            borderColor: r.status === 'closed' ? colors.warning : colors.success,
          }]}
        >
          <Text style={[styles.actionText, {
            color: r.status === 'closed' ? colors.warning : colors.success,
          }]}>
            {r.status === 'closed'
              ? (lang === 'ar' ? 'إعادة فتح' : 'Reopen')
              : (lang === 'ar' ? 'إغلاق' : 'Close')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(r)}
          style={[styles.actionBtn, { borderColor: colors.error }]}
        >
          <Text style={[styles.actionText, { color: colors.error }]}>
            {lang === 'ar' ? 'حذف' : 'Delete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRestore(r)}
          style={[styles.actionBtn, { borderColor: colors.textTertiary }]}
        >
          <Text style={[styles.actionText, { color: colors.textTertiary }]}>
            {lang === 'ar' ? 'استرجاع' : 'Restore'}
          </Text>
        </TouchableOpacity>
      </View>
    </LiquidGlassCard>
  );

  const deptLabel = mode === 'main'
    ? (lang === 'ar' ? 'الرئيسي — كل الأقسام' : 'Main — All Departments')
    : (() => {
        // Defensive: if department is 'index' or 'main' or undefined, show main label
        if (!department || department === 'index' || department === 'main') {
          return lang === 'ar' ? 'الرئيسي — كل الأقسام' : 'Main — All Departments';
        }
        const d = DEPARTMENTS.find((x) => x.id === department);
        return d ? (lang === 'ar' ? d.nameAr : d.nameEn) : department;
      })();

  if (loading) {
    return (
      <GlassBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </GlassBackground>
    );
  }

  return (
    <GlassBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>
              {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              {deptLabel}
            </Text>
            {dashboardUser && (
              <Text style={[styles.userLine, { color: colors.textTertiary }]}>
                {dashboardUser.displayName}
                {dashboardUser.isSuper ? ' · SUPER' : ''}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleExportPdf}
              disabled={exporting}
              style={[styles.pdfBtn, { borderColor: colors.primary, opacity: exporting ? 0.5 : 1 }]}
            >
              <Text style={[styles.pdfText, { color: colors.primary }]}>
                {exporting ? '...' : 'PDF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExportExcel}
              disabled={exporting}
              style={[styles.pdfBtn, { borderColor: colors.success, opacity: exporting ? 0.5 : 1 }]}
            >
              <Text style={[styles.pdfText, { color: colors.success }]}>
                {exporting ? '...' : 'Excel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleExportWord}
              disabled={exporting}
              style={[styles.pdfBtn, { borderColor: colors.info ?? colors.primary, opacity: exporting ? 0.5 : 1 }]}
            >
              <Text style={[styles.pdfText, { color: colors.info ?? colors.primary }]}>
                {exporting ? '...' : 'Word'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={[styles.logoutText, { color: colors.error }]}>
                {lang === 'ar' ? 'خروج' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderColor: colors.border }]}>
          {(['all', 'open', 'closed', 'analytics'] as const).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => setTab(k)}
              style={[
                styles.tabItem,
                tab === k && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === k ? colors.primary : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {k === 'all'
                  ? (lang === 'ar' ? `الكل (${allRows.length})` : `All (${allRows.length})`)
                  : k === 'open'
                  ? (lang === 'ar' ? `مفتوحة (${openRows.length})` : `Open (${openRows.length})`)
                  : k === 'closed'
                  ? (lang === 'ar' ? `مغلقة (${closedRows.length})` : `Closed (${closedRows.length})`)
                  : (lang === 'ar' ? 'تحليلات' : 'Analytics')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={colors.primary}
            />
          }
        >
          {/* ── All tab ── */}
          {tab === 'all' && (
            allRows.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                {lang === 'ar' ? 'لا تقارير' : 'No reports'}
              </Text>
            ) : (
              allRows.map((r) => renderReportRow(r, 'manage'))
            )
          )}

          {/* ── Open tab ── */}
          {tab === 'open' && (
            openRows.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                {lang === 'ar' ? 'لا تقارير مفتوحة' : 'No open reports'}
              </Text>
            ) : (
              openRows.map((r) => renderReportRow(r, 'manage'))
            )
          )}

          {/* ── Closed tab ── */}
          {tab === 'closed' && (
            closedRows.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                {lang === 'ar' ? 'لا تقارير مغلقة' : 'No closed reports'}
              </Text>
            ) : (
              closedRows.map((r) => renderReportRow(r, 'manage'))
            )
          )}

          {/* ── Analytics tab ── */}
          {tab === 'analytics' && (
            <View style={{ gap: 12 }}>
              <LiquidGlassCard style={styles.statCard}>
                <Text style={[styles.statTitle, { color: colors.text }]}>
                  {lang === 'ar' ? 'الملخص' : 'Summary'}
                </Text>
                <View style={styles.statRow}>
                  <Stat label={lang === 'ar' ? 'الإجمالي' : 'Total'} value={analytics.total} color={colors.text} />
                  <Stat label={lang === 'ar' ? 'مفتوحة' : 'Open'} value={analytics.openCount} color={colors.warning} />
                  <Stat label={lang === 'ar' ? 'مغلقة' : 'Closed'} value={analytics.closedCount} color={colors.success} />
                  <Stat label={lang === 'ar' ? 'بالانتظار' : 'Pending'} value={analytics.pending} color={colors.primary} />
                </View>
              </LiquidGlassCard>

              <LiquidGlassCard style={styles.statCard}>
                <Text style={[styles.statTitle, { color: colors.text }]}>
                  {lang === 'ar' ? 'حسب الأولوية' : 'By Priority'}
                </Text>
                {(['critical','high','medium','low'] as const).map((k) => (
                  <BarRow
                    key={k}
                    label={k}
                    value={analytics.byPriority[k] || 0}
                    max={Math.max(1, ...Object.values(analytics.byPriority))}
                    color={
                      k === 'critical' ? colors.error
                      : k === 'high' ? colors.warning
                      : k === 'medium' ? colors.primary
                      : colors.success
                    }
                    textColor={colors.textSecondary}
                  />
                ))}
              </LiquidGlassCard>

              <LiquidGlassCard style={styles.statCard}>
                <Text style={[styles.statTitle, { color: colors.text }]}>
                  {lang === 'ar' ? 'المشاكل المتكررة (أعلى 5)' : 'Recurring (Top 5)'}
                </Text>
                {analytics.topSubs.length === 0 && (
                  <Text style={{ color: colors.textTertiary, fontFamily: 'Cairo-Regular' }}>—</Text>
                )}
                {analytics.topSubs.map(([k, v]) => (
                  <BarRow
                    key={k}
                    label={k}
                    value={v}
                    max={Math.max(1, ...analytics.topSubs.map(([, n]) => n))}
                    color={colors.primary}
                    textColor={colors.textSecondary}
                  />
                ))}
              </LiquidGlassCard>

              {mode === 'main' && analytics.topDepts.length > 0 && (
                <LiquidGlassCard style={styles.statCard}>
                  <Text style={[styles.statTitle, { color: colors.text }]}>
                    {lang === 'ar' ? 'حسب القسم' : 'By Department'}
                  </Text>
                  {analytics.topDepts.map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={DEPARTMENTS.find((d) => d.id === k)?.nameAr ?? k}
                      value={v}
                      max={Math.max(1, ...analytics.topDepts.map(([, n]) => n))}
                      color={colors.primary}
                      textColor={colors.textSecondary}
                    />
                  ))}
                </LiquidGlassCard>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </GlassBackground>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 22, color }}>{value}</Text>
      <Text style={{ fontFamily: 'Cairo-Regular', fontSize: 11, color, opacity: 0.7 }}>{label}</Text>
    </View>
  );
}

function BarRow({
  label, value, max, color, textColor,
}: { label: string; value: number; max: number; color: string; textColor: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <View style={{ marginVertical: 6, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Cairo-Medium', fontSize: 12, color: textColor }}>{label}</Text>
        <Text style={{ fontFamily: 'Cairo-Bold', fontSize: 12, color }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: 'rgba(150,150,150,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 12, gap: 12,
  },
  title: { fontFamily: 'Cairo-Bold', fontSize: 22, lineHeight: 32 },
  subtitle: { fontFamily: 'Cairo-Bold', fontSize: 14, lineHeight: 22, marginTop: 2 },
  userLine: { fontFamily: 'Cairo-Regular', fontSize: 11, lineHeight: 18, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pdfBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfText: { fontFamily: 'Cairo-Bold', fontSize: 12 },
  logoutBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  logoutText: { fontFamily: 'Cairo-Bold', fontSize: 13 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderBottomWidth: 0,
  },
  tabText: { fontFamily: 'Cairo-Bold', fontSize: 13, lineHeight: 20 },
  list: { gap: 10 },
  empty: {
    fontFamily: 'Cairo-Regular', fontSize: 14, lineHeight: 22,
    textAlign: 'center', marginTop: 40,
  },
  row: { paddingVertical: 4 },
  rowHeader: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  rowTitle: { fontFamily: 'Cairo-Bold', fontSize: 15, lineHeight: 22 },
  rowMeta: { fontFamily: 'Cairo-Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  rowMeta2: { fontFamily: 'Cairo-Regular', fontSize: 11, lineHeight: 16, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, alignItems: 'center',
  },
  actionText: { fontFamily: 'Cairo-Bold', fontSize: 12 },
  statCard: { paddingVertical: 12 },
  statTitle: { fontFamily: 'Cairo-Bold', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  statRow: { flexDirection: 'row', gap: 8 },
});
