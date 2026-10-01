export type UserRole = 'employee' | 'supervisor' | 'hse_officer' | 'technician' | 'admin';

export type ReportType = 'safe' | 'unsafe';

export type UnsafeCategory = 'condition' | 'act';

export type ReportStatus = 'open' | 'in_progress' | 'closed';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Language = 'ar' | 'en';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  phone: string;
  avatar: string | null;
}

export interface ReportLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Report {
  id: string;
  type: ReportType;
  category: UnsafeCategory | null;
  description: string;
  correctiveAction: string | null;
  photoUri: string | null;
  department: string | null;
  subcategory: string | null;
  status: ReportStatus;
  priority: Priority | null;
  location: ReportLocation | null;
  createdBy: string;
  createdByName: string;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  status: string;
  label: string;
  timestamp: string;
  actor: string;
}

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  nameAr: string;
  nameEn: string;
}

export interface AppNotification {
  id: string;
  reportId: string;
  title: string;
  body: string;
  // Targeted routing
  recipientRole: UserRole | 'all';
  recipientDepartment: string;
  // Who sent it
  senderName: string;
  senderRole: UserRole | null;
  senderDepartment: string | null;
  // State
  read: boolean;
  createdAt: string;
  deletedAt?: string | null;
}

// Role hierarchy — informational only, used for UI labels.
// The actual notification routing is department-scoped:
// everyone in the same department sees every report in that department.
export const ROLE_UP: Record<UserRole, UserRole | null> = {
  employee:     'supervisor',
  technician:   'supervisor',
  supervisor:   'admin',
  admin:        'hse_officer',
  hse_officer:  null,
};

// Primary target shown to the user ("this is addressed to admins").
// Not used for filtering — filtering is by department only.
export const NOTIFY_PRIMARY: Record<UserRole, UserRole | 'all'> = {
  employee:    'admin',
  technician:  'admin',
  supervisor:  'admin',
  admin:       'all',
  hse_officer: 'all',
};

export interface RoleOption {
  id: UserRole;
  nameAr: string;
  nameEn: string;
  icon: string;
}
