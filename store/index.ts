import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
  UserRole,
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

  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getUnreadCount: () => number;
  deleteReport: (id: string) => Promise<void>;
  hydrateFromSupabase: () => Promise<void>;
  saveProfile: (name: string, role: UserRole, department: string) => Promise<void>;
  lookupProfile: (name: string) => Promise<{ role: UserRole; department: string } | null>;
}


async function syncReportToSupabase(report: Report, user: User): Promise<void> {
  try {
    let imageUrl: string | null = null;
    if (report.photoUri) {
      imageUrl = await uploadImage(report.photoUri, 'reports');
    }
    const supabaseType = report.type === 'safe' ? 'safe' : report.category === 'act' ? 'unsafe_act' : 'unsafe_condition';
    const { error } = await supabase.from('hse_reports').insert({
      client_id: report.id, type: supabaseType, note: report.description,
      corrective_action: report.correctiveAction ?? null, image_url: imageUrl,
      department: report.department ?? null, subcategory: report.subcategory ?? null,
      status: report.status, priority: report.priority ?? null,
      created_by: user.id, created_by_name: user.name,
      location_lat: report.location?.latitude ?? null,
      location_lng: report.location?.longitude ?? null,
      location_address: report.location?.address ?? null,
      created_at: report.createdAt,
    });
    if (error) console.error('[sync] insert failed:', error);
    else console.log('[sync] pushed to Supabase:', report.id);
  } catch (err) { console.error('[sync] unexpected:', err); }
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
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    closedAt: row.closed_at ?? null,
    timeline: [],
  };
}

let realtimeChannel: any = null;

export const useStore = create<AppState>((set, get) => ({
  user: null,
  reports: [],
  notifications: [],
  language: 'ar',
  themeMode: 'light',
  lastPickedTheme: 'light',
  initialized: false,

  init: async () => {
    try {
      const [userStr, reportsStr, notifStr, langStr, themeStr, lastPickedStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.reports),
        AsyncStorage.getItem(STORAGE_KEYS.notifications),
        AsyncStorage.getItem(STORAGE_KEYS.language),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
        AsyncStorage.getItem(STORAGE_KEYS.lastPickedTheme),
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
        initialized: true,
      });

      // Pull reports from Supabase (non-blocking, keeps UI responsive)
      void get().hydrateFromSupabase();

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


  hydrateFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('hse_reports')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) {
        console.warn('[hydrate] failed:', error.message);
        return;
      }
      const remote = (data ?? []).map(supabaseRowToReport);
      const remoteIds = new Set(remote.map((r) => r.id));
      set((state) => {
        // Keep local-only reports (not yet synced), merge remote in
        const localOnly = state.reports.filter((r) => !remoteIds.has(r.id));
        return { reports: [...localOnly, ...remote] };
      });
    } catch (err) {
      console.warn('[hydrate] unexpected:', err);
    }
  },

  deleteReport: async (id) => {
    // 1) Drop locally immediately so the UI responds fast
    set((state) => ({ reports: state.reports.filter((r) => r.id !== id) }));
    // 2) Soft-delete in Supabase — realtime broadcasts to all other devices
    try {
      await supabase
        .from('hse_reports')
        .update({ deleted_at: new Date().toISOString() })
        .eq('client_id', id);
    } catch (err) {
      console.warn('[deleteReport] remote failed:', err);
    }
  },

  saveProfile: async (name, role, department) => {
    try {
      await supabase
        .from('hse_profiles')
        .upsert(
          { name, role, department, updated_at: new Date().toISOString() },
          { onConflict: 'name' }
        );
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
        targetRole: 'technician',
      });
    } else if (data.type === 'safe') {
      await get().addNotification({
        reportId: report.id,
        title: 'New Safe Report',
        body: 'Safe condition documented for review',
        targetRole: 'hse_officer',
      });
    }

    void syncReportToSupabase(report, user);

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
        targetRole: 'hse_officer',
      });
    }

    // Broadcast status change to all other devices
    try {
      await supabase
        .from('hse_reports')
        .update({
          status,
          updated_at: new Date().toISOString(),
          closed_at: status === 'closed' ? new Date().toISOString() : null,
        })
        .eq('client_id', reportId);
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
    const notification: AppNotification = {
      id: generateId(),
      reportId: notif.reportId,
      title: notif.title,
      body: notif.body,
      targetRole: notif.targetRole,
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
  },

  markAllNotificationsRead: async () => {
    const notifications = get().notifications.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
  },

  deleteNotification: async (id) => {
    const notifications = get().notifications.filter((n) => n.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    set({ notifications });
  },

  clearAllNotifications: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify([]));
    set({ notifications: [] });
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
