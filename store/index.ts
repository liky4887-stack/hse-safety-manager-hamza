import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  UserRole,
  DashboardUser,
  DashboardSession,
  Report,
  AppNotification,
  Language,
  ThemeMode,
  ReportType,
  UnsafeCategory,
  Priority,
  ReportStatus,
  ReportLocation,
} from '@/types';
import { ROLE_UP, NOTIFY_PRIMARY } from '@/types';
import { DEPARTMENTS } from '@/config/departments';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/uploadImage';

const STORAGE_KEYS = {
  user: '@hse_user',
  reports: '@hse_reports',
  notifications: '@hse_notifications',
  language: '@hse_language',
  theme: '@hse_theme',
  lastPickedTheme: '@hse_last_picked_theme',
  hasSeenSplash: '@hse_has_seen_splash',
  dashboardToken: '@hse_dashboard_token',
  dashboardExpiresAt: '@hse_dashboard_expires_at',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getTimestamp = () => new Date().toISOString();

interface AppState {
  user: User | null;
  reports: Report[];
  notifications: AppNotification[];
  language: Language;
  themeMode: ThemeMode;
  lastPickedTheme: 'light' | 'dark';
  hasSeenSplash: boolean;

  // Dashboard session (independent of the app user)
  dashboardUser: DashboardUser | null;
  dashboardToken: string | null;
  dashboardTokenExpiresAt: string | null;
  loginDashboard: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutDashboard: () => Promise<void>;
  verifyDashboardSession: () => Promise<boolean>;
  initialized: boolean;

  init: () => Promise<void>;
  login: (name: string, role: User['role'], department: string) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;

  createReport: (data: {
    type: ReportType;
    category?: UnsafeCategory;
    description: string;
    correctiveAction?: string | null;
    photoUri?: string | null;
    department?: string | null;
    subcategory?: string | null;
    status?: ReportStatus;
    priority?: Priority | null;
    location?: ReportLocation | null;
  }) => Promise<Report>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  assignReport: (reportId: string, assignedTo: string, assignedToName: string) => Promise<void>;
  getReportById: (id: string) => Report | undefined;
  getUserReports: () => Report[];

  addNotification: (notif: Pick<AppNotification, 'reportId' | 'title' | 'body'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getUnreadCount: () => number;
  deleteReport: (id: string) => Promise<void>;
  hydrateFromSupabase: () => Promise<void>;
  hydrateNotifications: () => Promise<void>;
  retryPendingSync: () => Promise<void>;
  softDeleteReport: (clientId: string) => Promise<void>;

  // Dashboard actions (require dashboardUser set)
  approveReport: (clientId: string) => Promise<void>;
  deleteReportFromDept: (clientId: string) => Promise<void>;
  deleteReportFromMain: (clientId: string) => Promise<void>;
  restoreReportFromDept: (clientId: string) => Promise<void>;
  restoreReportFromMain: (clientId: string) => Promise<void>;
  pushDashboardNotification: (report: Report, user: User) => Promise<void>;
  saveProfile: (name: string, role: UserRole, department: string) => Promise<void>;
  lookupProfile: (name: string) => Promise<{ role: UserRole; department: string } | null>;
  markSplashSeen: () => Promise<void>;
}


async function syncReportToSupabase(report: Report, user: User): Promise<void> {
  await markPendingSync(report.id);

  try {
    let imageUrl: string | null = null;
    if (report.photoUri) {
      imageUrl = await uploadImage(report.photoUri, 'reports');

      // If the image upload failed, abort this sync — leave the report
      // in the pending queue so the whole thing retries with the image next time.
      if (!imageUrl) {
        console.warn('[sync] image upload failed — retrying later:', report.id);
        return;
      }
    }
    const supabaseType = report.type === 'safe' ? 'safe' : report.category === 'act' ? 'unsafe_act' : 'unsafe_condition';
    const { error } = await supabase.rpc('create_hse_report', {
      p_client_id: report.id,
      p_type: supabaseType,
      p_note: report.description,
      p_corrective_action: report.correctiveAction ?? null,
      p_image_url: imageUrl,
      p_department: report.department ?? null,
      p_subcategory: report.subcategory ?? null,
      p_status: report.status,
      p_priority: report.priority ?? null,
      p_created_by: user.id,
      p_created_by_name: user.name,
      p_location_lat: report.location?.latitude ?? null,
      p_location_lng: report.location?.longitude ?? null,
      p_location_address: report.location?.address ?? null,
      p_created_at: report.createdAt,
    });
    if (error) {
      console.error('[sync] rpc failed:', error);
      return;  // leave in pending queue for retry
    }
    console.log('[sync] pushed via RPC:', report.id);
    await clearPendingSync(report.id);   // ← success: remove from queue
  } catch (err) {
    console.error('[sync] unexpected:', err);
    // leave in pending queue for retry
  }
}


function supabaseRowToReport(row: any): Report {
  return {
    id: row.client_id || row.id,
    type: row.type === 'safe' ? 'safe' : 'unsafe',
    category: row.type === 'unsafe_act' ? 'act' : row.type === 'unsafe_condition' ? 'condition' : null,
    description: row.note || '',
    correctiveAction: row.corrective_action ?? null,
    photoUri: row.image_url ?? null,
    department: row.department ?? null,
    subcategory: row.subcategory ?? null,
    status: (row.status as ReportStatus) || 'open',
    priority: (row.priority as Priority) ?? null,
    location: row.location_lat != null && row.location_lng != null
      ? { latitude: row.location_lat, longitude: row.location_lng, address: row.location_address || '' }
      : null,
    createdBy: row.created_by || '',
    createdByName: row.created_by_name || '',
    assignedTo: row.assigned_to ?? null,
    assignedToName: row.assigned_to_name ?? null,
    approved: row.approved ?? true,
    approvedAt: row.approved_at ?? null,
    approvedBy: row.approved_by ?? null,
    deletedAtDept: row.deleted_at_dept ?? null,
    deletedAtMain: row.deleted_at_main ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    closedAt: row.closed_at ?? null,
    timeline: [],
  };
}

let realtimeChannel: any = null;
let notifChannel: any = null;

function supabaseRowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    reportId: row.report_id || '',
    title: row.title || '',
    body: row.body || '',
    recipientRole: (row.recipient_role || 'employee') as UserRole,
    recipientDepartment: row.recipient_department || '',
    senderName: row.sender_name || '',
    senderRole: (row.sender_role || null) as UserRole | null,
    senderDepartment: row.sender_department || null,
    read: !!row.read,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  };
}



const PENDING_SYNC_KEY = '@hse_pending_sync';

async function getPendingSync(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    return raw ? JSON.parse(raw) as string[] : [];
  } catch { return []; }
}

async function markPendingSync(reportId: string): Promise<void> {
  const list = await getPendingSync();
  if (!list.includes(reportId)) {
    list.push(reportId);
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(list));
  }
}

async function clearPendingSync(reportId: string): Promise<void> {
  const list = await getPendingSync();
  const filtered = list.filter((x) => x !== reportId);
  await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
}

async function pushReportNotification(report: Report, user: User): Promise<void> {
  const primaryTarget = NOTIFY_PRIMARY[user.role];

  const supabaseType =
    report.type === 'safe'
      ? 'safe'
      : report.category === 'act'
      ? 'unsafe_act'
      : 'unsafe_condition';

  const titleAr = report.type === 'safe' ? 'تقرير وضع آمن جديد' : 'تقرير وضع غير آمن جديد';
  const body = report.description.slice(0, 80) + (report.description.length > 80 ? '…' : '');

  const { error } = await supabase.rpc('insert_notification', {
    p_report_id: report.id,
    p_report_type: supabaseType,
    p_title: titleAr,
    p_body: body,
    p_recipient_role: primaryTarget,
    p_recipient_department: user.department,
    p_sender_name: user.name,
    p_sender_role: user.role,
    p_sender_department: user.department,
    p_for_dashboard: false,
  });

  if (error) {
    console.warn('[pushReportNotification] failed:', error.message);
    throw error;
  }
  console.log('[pushReportNotification] ok for', user.department);
}


export const useStore = create<AppState>((set, get) => ({
  user: null,
  reports: [],
  notifications: [],
  language: 'ar',
  themeMode: 'light',
  lastPickedTheme: 'light',
  hasSeenSplash: false,
  dashboardUser: null,
  dashboardToken: null,
  dashboardTokenExpiresAt: null,
  initialized: false,

  init: async () => {
    try {
      const [userStr, reportsStr, notifStr, langStr, themeStr, lastPickedStr, seenSplashStr, dashTokenStr, dashExpiresStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.reports),
        AsyncStorage.getItem(STORAGE_KEYS.notifications),
        AsyncStorage.getItem(STORAGE_KEYS.language),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
        AsyncStorage.getItem(STORAGE_KEYS.lastPickedTheme),
        AsyncStorage.getItem(STORAGE_KEYS.hasSeenSplash),
        AsyncStorage.getItem(STORAGE_KEYS.dashboardToken),
        AsyncStorage.getItem(STORAGE_KEYS.dashboardExpiresAt),
      ]);

      // Default to light theme. Only 'dark' is respected.
      const storedTheme = (themeStr as ThemeMode) || 'light';
      const resolvedTheme: ThemeMode = storedTheme === 'dark' ? 'dark' : 'light';

      // If the stored value was anything else ('system', undefined, null),
      // overwrite it with 'light' so the default is sticky.
      if (storedTheme !== 'dark' && storedTheme !== 'light') {
        AsyncStorage.setItem(STORAGE_KEYS.theme, 'light').catch(() => {});
      }

      set({
        user: userStr ? JSON.parse(userStr) : null,
        reports: reportsStr ? JSON.parse(reportsStr) : [],
        notifications: notifStr ? JSON.parse(notifStr) : [],
        language: (langStr as Language) || 'ar',
        themeMode: resolvedTheme,
        lastPickedTheme: (lastPickedStr === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
        hasSeenSplash: seenSplashStr === 'true',
        dashboardToken: dashTokenStr || null,
        dashboardTokenExpiresAt: dashExpiresStr || null,
        initialized: true,
      });

      // Pull reports from Supabase (non-blocking, keeps UI responsive)
      void get().hydrateFromSupabase();

      // Pull notifications for this department
      void get().hydrateNotifications();

      // Flush any reports queued while offline
      void get().retryPendingSync();

      // Realtime channel for notifications addressed to this user
      const currentUser = get().user;
      if (!notifChannel && currentUser) {
        notifChannel = supabase
          .channel('notifications_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            (payload: any) => {
              const evt = payload.eventType;
              const row = payload.new || payload.old;
              if (!row) return;

              // Only keep rows addressed to me
              const me = get().user;
              if (!me) return;
              if (row.recipient_department !== me.department) return;

              if (evt === 'INSERT') {
                const n = supabaseRowToNotification(row);
                set((state) => {
                  if (state.notifications.some((x) => x.id === n.id)) return state;
                  return { notifications: [n, ...state.notifications] };
                });
              } else if (evt === 'UPDATE') {
                const n = supabaseRowToNotification(row);
                set((state) => {
                  if (row.deleted_at) {
                    return { notifications: state.notifications.filter((x) => x.id !== n.id) };
                  }
                  return {
                    notifications: state.notifications.map((x) =>
                      x.id === n.id ? n : x
                    ),
                  };
                });
              } else if (evt === 'DELETE') {
                const id = payload.old?.id;
                if (id) {
                  set((state) => ({
                    notifications: state.notifications.filter((x) => x.id !== id),
                  }));
                }
              }
            }
          )
          .subscribe();
      }

      // One-time realtime subscription — pushes insert/update/delete to every device
      if (!realtimeChannel) {
        realtimeChannel = supabase
          .channel('hse_reports_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'hse_reports' },
            (payload: any) => {
              const evt = payload.eventType;

              if (evt === 'INSERT' || evt === 'UPDATE') {
                const row = payload.new;
                const local = supabaseRowToReport(row);
                const isDeleted = row.deleted_at != null;
                set((state) => {
                  const withoutThis = state.reports.filter((r) => r.id !== local.id);
                  return { reports: isDeleted ? withoutThis : [local, ...withoutThis] };
                });
              } else if (evt === 'DELETE') {
                const oldId = payload.old?.client_id || payload.old?.id;
                if (oldId) {
                  set((state) => ({ reports: state.reports.filter((r) => r.id !== oldId) }));
                }
              }
            }
          )
          .subscribe();
      }
    } catch {
      set({ initialized: true });
    }
  },





  softDeleteReport: async (clientId) => {
    // Optimistic local removal + persist to AsyncStorage so it survives app restart
    set((state) => ({ reports: state.reports.filter((r) => r.id !== clientId) }));
    await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(get().reports));

    // Server-side soft delete (dept scope) via RPC
    const { error } = await supabase.rpc('soft_delete_hse_report_dept', {
      p_client_id: clientId,
    });
    if (error) {
      console.warn('[softDeleteReport] failed:', error.message);
      void get().hydrateFromSupabase();
    } else {
      console.log('[softDeleteReport] hidden', clientId);
    }
  },

  retryPendingSync: async () => {
    const pending = await getPendingSync();
    if (pending.length === 0) return;
    const user = get().user;
    if (!user) return;
    console.log('[retryPendingSync] flushing', pending.length, 'pending reports');
    for (const id of pending) {
      const report = get().reports.find((r) => r.id === id);
      if (!report) { await clearPendingSync(id); continue; }
      try {
        await syncReportToSupabase(report, user);
        await pushReportNotification(report, user);
      } catch (err) {
        console.warn('[retryPendingSync] still failing for', id, err);
      }
    }
    void get().hydrateFromSupabase();
    void get().hydrateNotifications();
  },

  hydrateNotifications: async () => {
    try {
      const me = get().user;
      if (!me) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_department', me.department)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('[hydrateNotifications] failed:', error.message);
        return;
      }
      const remote = (data ?? []).map(supabaseRowToNotification);
      set({ notifications: remote });
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(remote));
    } catch (err) {
      console.warn('[hydrateNotifications] unexpected:', err);
    }
  },

  hydrateFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('hse_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        console.warn('[hydrate] failed:', error.message);
        return;
      }

      const rows = data ?? [];
      // A report is hidden from the app if it was soft-deleted globally
      // OR hidden from its department. Main-dashboard-only hides do not
      // affect the app view.
      const liveRows = rows.filter(
        (r: any) => !r.deleted_at && !r.deleted_at_dept
      );
      const deletedIds = new Set(
        rows
          .filter((r: any) => (r.deleted_at || r.deleted_at_dept) && r.client_id)
          .map((r: any) => r.client_id as string),
      );

      const remote = liveRows.map(supabaseRowToReport);
      const remoteIds = new Set(remote.map((r) => r.id));

      set((state) => {
        const stillAlive = state.reports.filter((r) => !deletedIds.has(r.id));
        const localOnly = stillAlive.filter((r) => !remoteIds.has(r.id));
        return { reports: [...localOnly, ...remote] };
      });
      await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(get().reports));
    } catch (err) {
      console.warn('[hydrate] unexpected:', err);
    }
  },

  deleteReport: async (id) => {
    // 1) Drop locally immediately + persist so restart keeps it deleted
    set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }));
    await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(get().reports));
    // 2) Soft-delete in Supabase — realtime broadcasts to all other devices
    try {
      await supabase.rpc('soft_delete_hse_report_global', { p_client_id: id });
    } catch (err) {
      console.warn('[deleteReport] remote failed:', err);
    }
  },

  markSplashSeen: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.hasSeenSplash, 'true');
    set({ hasSeenSplash: true });
  },

  saveProfile: async (name, role, department) => {
    try {
      await supabase.rpc('upsert_hse_profile', {
        p_name: name,
        p_role: role,
        p_department: department,
      });
    } catch (err) {
      console.warn('[saveProfile] failed:', err);
    }
  },

  lookupProfile: async (name) => {
    try {
      const { data, error } = await supabase
        .from('hse_profiles')
        .select('role, department')
        .eq('name', name)
        .maybeSingle();
      if (error || !data) return null;
      return {
        role: data.role as UserRole,
        department: data.department as string,
      };
    } catch (err) {
      console.warn('[lookupProfile] failed:', err);
      return null;
    }
  },


  // ════════════════════════════════════════════════════════
  // DASHBOARD LAYER
  // ════════════════════════════════════════════════════════

  loginDashboard: async (username, password) => {
    try {
      const { data, error } = await supabase.rpc('create_dashboard_session', {
        p_username: username,
        p_password: password,
        p_ttl_hours: 4,
      });

      if (error) {
        console.warn('[loginDashboard] rpc error:', error.message);
        return { ok: false, error: 'server' };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.token) {
        return { ok: false, error: 'invalid' };
      }

      const sessionUser: DashboardUser = {
        id: row.username,               // rpc doesn't return id, use username as identity
        username: row.username,
        displayName: row.display_name || row.username,
        department: row.department ?? null,
        isSuper: !!row.is_super,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.dashboardToken, row.token);
      await AsyncStorage.setItem(STORAGE_KEYS.dashboardExpiresAt, row.expires_at);

      set({
        dashboardUser: sessionUser,
        dashboardToken: row.token,
        dashboardTokenExpiresAt: row.expires_at,
      });

      console.log('[loginDashboard] OK as', row.username, 'super=', row.is_super);
      return { ok: true };
    } catch (err) {
      console.warn('[loginDashboard] unexpected:', err);
      return { ok: false, error: 'network' };
    }
  },

  logoutDashboard: async () => {
    const token = get().dashboardToken;
    if (token) {
      try {
        await supabase.rpc('destroy_dashboard_session', { p_token: token });
      } catch (err) {
        console.warn('[logoutDashboard] rpc failed:', err);
      }
    }
    await AsyncStorage.removeItem(STORAGE_KEYS.dashboardToken);
    await AsyncStorage.removeItem(STORAGE_KEYS.dashboardExpiresAt);
    set({ dashboardUser: null, dashboardToken: null, dashboardTokenExpiresAt: null });
    console.log('[logoutDashboard] cleared');
  },

  verifyDashboardSession: async () => {
    const token = get().dashboardToken;
    if (!token) return false;

    try {
      const { data, error } = await supabase.rpc('verify_dashboard_session', { p_token: token });
      if (error) {
        console.warn('[verifyDashboardSession] rpc error:', error.message);
        await get().logoutDashboard();
        return false;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        // expired or invalid
        await get().logoutDashboard();
        return false;
      }

      const sessionUser: DashboardUser = {
        id: row.username,
        username: row.username,
        displayName: row.display_name || row.username,
        department: row.department ?? null,
        isSuper: !!row.is_super,
      };

      set({
        dashboardUser: sessionUser,
        dashboardTokenExpiresAt: row.expires_at,
      });
      return true;
    } catch (err) {
      console.warn('[verifyDashboardSession] unexpected:', err);
      await get().logoutDashboard();
      return false;
    }
  },

  approveReport: async (clientId) => {
    const dUser = get().dashboardUser;
    if (!dUser) { console.warn('[approveReport] no dashboard user'); return; }

    const nowIso = new Date().toISOString();

    // Optimistic local update
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === clientId
          ? { ...r, approved: true, approvedAt: nowIso, approvedBy: dUser.username, updatedAt: nowIso }
          : r
      ),
    }));

    const { error } = await supabase.rpc('set_hse_report_approved', {
      p_client_id: clientId,
      p_approved: true,
    });

    if (error) console.warn('[approveReport] failed:', error.message);
    else console.log('[approveReport] approved', clientId);
  },

  deleteReportFromDept: async (clientId) => {
    const dUser = get().dashboardUser;
    if (!dUser || dUser.isSuper) { console.warn('[deleteReportFromDept] not allowed'); return; }

    const { error } = await supabase.rpc('soft_delete_hse_report_dept', {
      p_client_id: clientId,
    });

    if (error) console.warn('[deleteReportFromDept] failed:', error.message);
    else console.log('[deleteReportFromDept] hidden from', dUser.department, '·', clientId);
  },

  deleteReportFromMain: async (clientId) => {
    const dUser = get().dashboardUser;
    if (!dUser || !dUser.isSuper) { console.warn('[deleteReportFromMain] not allowed'); return; }

    const { error } = await supabase.rpc('soft_delete_hse_report_main', {
      p_client_id: clientId,
    });

    if (error) console.warn('[deleteReportFromMain] failed:', error.message);
    else console.log('[deleteReportFromMain] hidden from main ·', clientId);
  },

  restoreReportFromDept: async (clientId) => {
    const dUser = get().dashboardUser;
    if (!dUser || dUser.isSuper) return;

    const { error } = await supabase.rpc('restore_hse_report', {
      p_client_id: clientId,
      p_target: 'dept',
    });

    if (error) console.warn('[restoreReportFromDept] failed:', error.message);
  },

  restoreReportFromMain: async (clientId) => {
    const dUser = get().dashboardUser;
    if (!dUser || !dUser.isSuper) return;

    const { error } = await supabase.rpc('restore_hse_report', {
      p_client_id: clientId,
      p_target: 'main',
    });

    if (error) console.warn('[restoreReportFromMain] failed:', error.message);
  },

  pushDashboardNotification: async (report, user) => {
    // Dashboard admins get a copy flagged for_dashboard = true
    const supabaseType =
      report.type === 'safe'
        ? 'safe'
        : report.category === 'act'
        ? 'unsafe_act'
        : 'unsafe_condition';

    const titleAr = 'تقرير جديد';
    const body = `${user.name}: ${report.description.slice(0, 60)}${report.description.length > 60 ? '…' : ''}`;

    const { error } = await supabase.rpc('insert_notification', {
      p_report_id: report.id,
      p_report_type: supabaseType,
      p_title: titleAr,
      p_body: body,
      p_recipient_role: 'admin',
      p_recipient_department: user.department,
      p_sender_name: user.name,
      p_sender_role: user.role,
      p_sender_department: user.department,
      p_for_dashboard: true,
    });

    if (error) {
      console.warn('[pushDashboardNotification] failed:', error.message);
    } else {
      console.log('[pushDashboardNotification] dashboard notified for', user.department);
    }
  },

  login: async (name, role, department) => {
    const user: User = {
      id: generateId(),
      name,
      role,
      department,
      email: '',
      phone: '',
      avatar: null,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    set({ user });
    // Pull fresh reports + notifications from Supabase for this user
    void get().hydrateFromSupabase();
    void get().hydrateNotifications();
    void get().retryPendingSync();
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
    set({ user: null });
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(STORAGE_KEYS.language, lang);
    set({ language: lang });
  },

  setThemeMode: async (mode) => {
    await AsyncStorage.setItem(STORAGE_KEYS.theme, mode);

    // When user picks 'light' or 'dark' explicitly, remember it as their last choice
    // so that when they later pick 'system', we use their last pick instead of the OS
    if (mode === 'light' || mode === 'dark') {
      await AsyncStorage.setItem(STORAGE_KEYS.lastPickedTheme, mode);
      set({ themeMode: mode, lastPickedTheme: mode });
    } else {
      set({ themeMode: mode });
    }
  },

  createReport: async (data) => {
    const user = get().user;
    if (!user) throw new Error('No user');

    const now = getTimestamp();
    const report: Report = {
      id: generateId(),
      type: data.type,
      category: data.category ?? null,
      description: data.description,
      correctiveAction: data.correctiveAction ?? null,
      photoUri: data.photoUri ?? null,
      department: data.department ?? null,
      subcategory: data.subcategory ?? null,
      status: data.status ?? (data.type === 'safe' ? 'closed' : 'open'),
      priority: data.priority ?? null,
      location: data.location ?? null,
      approved: true,
      approvedAt: now,
      approvedBy: user.name,
      deletedAtDept: null,
      deletedAtMain: null,
      createdBy: user.id,
      createdByName: user.name,
      assignedTo: null,
      assignedToName: null,
      createdAt: now,
      updatedAt: now,
      closedAt: data.type === 'safe' || data.status === 'closed' ? now : null,
      timeline: [
        {
          id: generateId(),
          status: 'created',
          label: 'Created',
          timestamp: now,
          actor: user.name,
        },
      ],
    };

    const reports = [report, ...get().reports];
    await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    set({ reports });

    if (data.type === 'unsafe' && report.status === 'open' && data.department) {
      const dept = DEPARTMENTS.find((d) => d.id === data.department);
      await get().addNotification({
        reportId: report.id,
        title: 'New Unsafe Report',
        body: `${data.priority ?? 'medium'} priority — ${dept?.nameEn ?? 'Unknown'} department`,
      });
    } else if (data.type === 'safe') {
      await get().addNotification({
        reportId: report.id,
        title: 'New Safe Report',
        body: 'Safe condition documented for review',
      });
    }

    void syncReportToSupabase(report, user);
    void pushReportNotification(report, user);
    void get().pushDashboardNotification(report, user);

    return report;
  },

  updateReportStatus: async (reportId, status) => {
    const reports = get().reports.map((r) => {
      if (r.id !== reportId) return r;
      const now = getTimestamp();
      return {
        ...r,
        status,
        updatedAt: now,
        closedAt: status === 'closed' ? now : r.closedAt,
        timeline: [
          ...r.timeline,
          { id: generateId(), status, label: status, timestamp: now, actor: get().user?.name ?? 'System' },
        ],
      };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    set({ reports });

    const report = reports.find((r) => r.id === reportId);
    if (report && status === 'closed') {
      await get().addNotification({
        reportId,
        title: 'Report Closed',
        body: `Report ${reportId.slice(0, 8)} has been closed`,
      });
    }

    // Broadcast status change to all other devices
    try {
      await supabase.rpc('set_hse_report_status', {
        p_client_id: reportId,
        p_status: status,
      });
    } catch (err) {
      console.warn('[updateReportStatus] remote failed:', err);
    }
  },

  assignReport: async (reportId, assignedTo, assignedToName) => {
    const reports = get().reports.map((r) => {
      if (r.id !== reportId) return r;
      const now = getTimestamp();
      return {
        ...r,
        assignedTo,
        assignedToName,
        updatedAt: now,
        timeline: [
          ...r.timeline,
          { id: generateId(), status: 'assigned', label: 'Assigned', timestamp: now, actor: get().user?.name ?? 'System' },
        ],
      };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    set({ reports });
  },

  getReportById: (id) => get().reports.find((r) => r.id === id),

  getUserReports: () => {
    const user = get().user;
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'hse_officer') return get().reports;
    return get().reports.filter(
      (r) => r.createdBy === user.id || r.assignedTo === user.id
    );
  },

  addNotification: async (notif) => {
    // Legacy local-only path (kept for backward compat) — normally the app
    // relies on pushReportNotification which writes to Supabase + realtime.
    const me = get().user;
    const notification: AppNotification = {
      id: generateId(),
      reportId: notif.reportId,
      title: notif.title,
      body: notif.body,
      recipientRole: (me?.role ?? 'employee') as UserRole,
      recipientDepartment: me?.department ?? '',
      senderName: me?.name ?? '',
      senderRole: me?.role ?? null,
      senderDepartment: me?.department ?? null,
      createdAt: getTimestamp(),
      read: false,
    };
    const notifications = [notification, ...get().notifications];
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
  },

  markNotificationRead: async (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
    try {
      await supabase.rpc('mark_hse_notification_read', { p_id: id });
    } catch (err) {
      console.warn('[markNotificationRead] remote failed:', err);
    }
  },

  markAllNotificationsRead: async () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
    const me = get().user;
    if (me) {
      try {
        await supabase.rpc('mark_all_hse_notifications_read', {
          p_department: me.department,
        });
      } catch (err) {
        console.warn('[markAllNotificationsRead] remote failed:', err);
      }
    }
  },

  deleteNotification: async (id) => {
    const notifications = get().notifications.filter((n) => n.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
    // Await the remote update — prevents notification from reappearing on restart
    try {
      await supabase.rpc('delete_hse_notification', { p_id: id });
    } catch (err) {
      console.warn('[deleteNotification] remote failed:', err);
    }
  },

  clearAllNotifications: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify([]));
    set({ notifications: [] });
    const me = get().user;
    if (me) {
      try {
        await supabase.rpc('clear_hse_notifications', {
          p_department: me.department,
        });
      } catch (err) {
        console.warn('[clearAllNotifications] remote failed:', err);
      }
    }
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
