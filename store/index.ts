import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User,
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

const STORAGE_KEYS = {
  user: '@hse_user',
  reports: '@hse_reports',
  notifications: '@hse_notifications',
  language: '@hse_language',
  theme: '@hse_theme',
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getTimestamp = () => new Date().toISOString();

interface AppState {
  user: User | null;
  reports: Report[];
  notifications: AppNotification[];
  language: Language;
  themeMode: ThemeMode;
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
  getUnreadCount: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  reports: [],
  notifications: [],
  language: 'ar',
  themeMode: 'system',
  initialized: false,

  init: async () => {
    try {
      const [userStr, reportsStr, notifStr, langStr, themeStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.reports),
        AsyncStorage.getItem(STORAGE_KEYS.notifications),
        AsyncStorage.getItem(STORAGE_KEYS.language),
        AsyncStorage.getItem(STORAGE_KEYS.theme),
      ]);

      set({
        user: userStr ? JSON.parse(userStr) : null,
        reports: reportsStr ? JSON.parse(reportsStr) : [],
        notifications: notifStr ? JSON.parse(notifStr) : [],
        language: (langStr as Language) || 'ar',
        themeMode: (themeStr as ThemeMode) || 'system',
        initialized: true,
      });
    } catch {
      set({ initialized: true });
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
    set({ themeMode: mode });
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

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
