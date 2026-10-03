import type { Language } from '@/types';

export interface Translation {
  appName: string;
  appNameEn: string;
  company: string;
  welcome: string;
  selectRole: string;
  enterName: string;
  enter: string;
  login: string;
  logout: string;
  home: string;
  myReports: string;
  notifications: string;
  dashboard: string;
  profile: string;
  settings: string;
  safeCondition: string;
  unsafeCondition: string;
  safeDesc: string;
  unsafeDesc: string;
  newReport: string;
  reportSafe: string;
  reportUnsafe: string;
  writeNote: string;
  writeNotePlaceholder: string;
  attachPhoto: string;
  takePhoto: string;
  chooseFromGallery: string;
  submit: string;
  cancel: string;
  next: string;
  back: string;
  done: string;
  thankYou: string;
  thankYouMsg: string;
  classification: string;
  unsafeConditionShort: string;
  unsafeAct: string;
  reportDetails: string;
  description: string;
  descriptionRequired: string;
  correctiveAction: string;
  correctiveActionRequired: string;
  correctiveActionPlaceholder: string;
  capturingLocation: string;
  locationCaptured: string;
  locationError: string;
  responsibleDept: string;
  selectDept: string;
  subcategory: string;
  selectSubcategory: string;
  status: string;
  closed: string;
  open: string;
  inProgress: string;
  priority: string;
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityCritical: string;
  filterBy: string;
  all: string;
  filterType: string;
  filterStatus: string;
  filterDept: string;
  filterDate: string;
  reportDetailsTitle: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  closedAt: string;
  updatedAt: string;
  location: string;
  openInMaps: string;
  markInProgress: string;
  markClosed: string;
  verifyDocument: string;
  timeline: string;
  noReports: string;
  noReportsMsg: string;
  noNotifications: string;
  noNotificationsMsg: string;
  totalReports: string;
  openReports: string;
  closedReports: string;
  avgClosureTime: string;
  byDepartment: string;
  bySubcategory: string;
  byPriority: string;
  dateRange: string;
  last7Days: string;
  last30Days: string;
  last90Days: string;
  allTime: string;
  language: string;
  arabic: string;
  english: string;
  themeMode: string;
  light: string;
  dark: string;
  system: string;
  userInfo: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  error: string;
  retry: string;
  loading: string;
  saving: string;
  submitting: string;
  search: string;
  yes: string;
  no: string;
  confirm: string;
  delete: string;
  edit: string;
  view: string;
  close: string;
  unread: string;
  markAllRead: string;
  created: string;
  assigned: string;
  verified: string;
  documented: string;
  employee: string;
  supervisor: string;
  hseOfficer: string;
  technician: string;
  admin: string;
  gpsLocation: string;
  noLocation: string;
  photo: string;
  noPhoto: string;
  selectPriority: string;
  optional: string;
  required: string;
  step: string;
  of: string;
  reviewReport: string;
  reviewAndSubmit: string;
  autoAssigned: string;
  sendNotification: string;
  notifNewReport: string;
  notifReportClosed: string;
  notifReportAssigned: string;
  notifReportVerified: string;
  splashTagline: string;
}

const ar: Translation = {
  appName: 'إدارة السلامة المهنية',
  appNameEn: 'HSE Safety Manager',
  company: 'فياض برقن للنفط',
  welcome: 'مرحباً',
  selectRole: 'اختر دورك',
  enterName: 'أدخل اسمك',
  enter: 'دخول',
  login: 'تسجيل الدخول',
  logout: 'تسجيل الخروج',
  home: 'الرئيسية',
  myReports: 'تقاريري',
  notifications: 'الإشعارات',
  dashboard: 'لوحة التحكم',
  profile: 'الملف الشخصي',
  settings: 'الإعدادات',
  safeCondition: 'وضع آمن',
  unsafeCondition: 'وضع غير آمن',
  safeDesc: 'تقرير عن وضع أو سلوك آمن',
  unsafeDesc: 'تقرير عن حالة أو تصرف غير آمن',
  newReport: 'تقرير جديد',
  reportSafe: 'تقرير وضع آمن',
  reportUnsafe: 'تقرير وضع غير آمن',
  writeNote: 'اكتب ملاحظة',
  writeNotePlaceholder: 'اكتب وصفاً للتقرير...',
  attachPhoto: 'إرفاق صورة',
  takePhoto: 'التقاط صورة',
  chooseFromGallery: 'اختر من المعرض',
  submit: 'إرسال',
  cancel: 'إلغاء',
  next: 'التالي',
  back: 'رجوع',
  done: 'تم',
  thankYou: 'شكراً لك',
  thankYouMsg: 'تم إرسال تقريرك بنجاح',
  classification: 'التصنيف',
  unsafeConditionShort: 'حالة غير آمنة',
  unsafeAct: 'تصرف غير آمن',
  reportDetails: 'تفاصيل التقرير',
  description: 'الوصف',
  descriptionRequired: 'الوصف مطلوب',
  correctiveAction: 'الإجراء التصحيحي الفوري',
  correctiveActionRequired: 'الإجراء التصحيحي مطلوب',
  correctiveActionPlaceholder: 'ما الإجراء الذي تم اتخاذه؟',
  capturingLocation: 'جاري تحديد الموقع...',
  locationCaptured: 'تم تحديد الموقع',
  locationError: 'تعذر تحديد الموقع',
  responsibleDept: 'القسم المسؤول',
  selectDept: 'اختر القسم',
  subcategory: 'التصنيف الفرعي',
  selectSubcategory: 'اختر التصنيف الفرعي',
  status: 'الحالة',
  closed: 'مغلقة',
  open: 'مفتوحة',
  inProgress: 'قيد المعالجة',
  priority: 'الأولوية',
  priorityLow: 'منخفضة',
  priorityMedium: 'متوسطة',
  priorityHigh: 'عالية',
  priorityCritical: 'حرجة',
  filterBy: 'تصفية',
  all: 'الكل',
  filterType: 'النوع',
  filterStatus: 'الحالة',
  filterDept: 'القسم',
  filterDate: 'التاريخ',
  reportDetailsTitle: 'تفاصيل التقرير',
  assignedTo: 'مُسند إلى',
  createdBy: 'أنشأه',
  createdAt: 'تاريخ الإنشاء',
  closedAt: 'تاريخ الإغلاق',
  updatedAt: 'آخر تحديث',
  location: 'الموقع',
  openInMaps: 'فتح في الخرائط',
  markInProgress: 'تحديد كقيد المعالجة',
  markClosed: 'تحديد كمغلقة',
  verifyDocument: 'توثيق وإغلاق',
  timeline: 'الجدول الزمني',
  noReports: 'لا توجد تقارير',
  noReportsMsg: 'لم تقم بإنشاء أي تقرير بعد',
  noNotifications: 'لا توجد إشعارات',
  noNotificationsMsg: 'لم تستلم أي إشعارات بعد',
  totalReports: 'إجمالي التقارير',
  openReports: 'تقارير مفتوحة',
  closedReports: 'تقارير مغلقة',
  avgClosureTime: 'متوسط وقت الإغلاق',
  byDepartment: 'حسب القسم',
  bySubcategory: 'حسب التصنيف الفرعي',
  byPriority: 'حسب الأولوية',
  dateRange: 'النطاق الزمني',
  last7Days: 'آخر 7 أيام',
  last30Days: 'آخر 30 يوم',
  last90Days: 'آخر 90 يوم',
  allTime: 'كل الفترات',
  language: 'اللغة',
  arabic: 'العربية',
  english: 'English',
  themeMode: 'المظهر',
  light: 'فاتح',
  dark: 'داكن',
  system: 'تلقائي',
  userInfo: 'معلومات المستخدم',
  role: 'الدور',
  department: 'القسم',
  email: 'البريد الإلكتروني',
  phone: 'الهاتف',
  error: 'خطأ',
  retry: 'إعادة المحاولة',
  loading: 'جاري التحميل...',
  saving: 'جاري الحفظ...',
  submitting: 'جاري الإرسال...',
  search: 'بحث',
  yes: 'نعم',
  no: 'لا',
  confirm: 'تأكيد',
  delete: 'حذف',
  edit: 'تعديل',
  view: 'عرض',
  close: 'إغلاق',
  unread: 'غير مقروء',
  markAllRead: 'تحديد الكل كمقروء',
  created: 'تم الإنشاء',
  assigned: 'تم الإسناد',
  verified: 'تم التوثيق',
  documented: 'موثق',
  employee: 'موظف',
  supervisor: 'مشرف',
  hseOfficer: 'مسؤول سلامة',
  technician: 'فني',
  admin: 'مدير',
  gpsLocation: 'موقع GPS',
  noLocation: 'لا يوجد موقع',
  photo: 'صورة',
  noPhoto: 'لا توجد صورة',
  selectPriority: 'اختر الأولوية',
  optional: 'اختياري',
  required: 'مطلوب',
  step: 'خطوة',
  of: 'من',
  reviewReport: 'مراجعة التقرير',
  reviewAndSubmit: 'راجع وأرسل',
  autoAssigned: 'تم الإسناد تلقائياً',
  sendNotification: 'إرسال إشعار',
  notifNewReport: 'تقرير جديد',
  notifReportClosed: 'تم إغلاق التقرير',
  notifReportAssigned: 'تم إسناد تقرير إليك',
  notifReportVerified: 'تم توثيق التقرير',
  splashTagline: 'إدارة السلامة المهنية وتقارير HSE',
};

const en: Translation = {
  appName: 'HSE Safety Manager',
  appNameEn: 'HSE Safety Manager',
  company: 'Fayadh Barqan Petroleum',
  welcome: 'Welcome',
  selectRole: 'Select Your Role',
  enterName: 'Enter your name',
  enter: 'Enter',
  login: 'Login',
  logout: 'Logout',
  home: 'Home',
  myReports: 'My Reports',
  notifications: 'Notifications',
  dashboard: 'Dashboard',
  profile: 'Profile',
  settings: 'Settings',
  safeCondition: 'Safe Condition',
  unsafeCondition: 'Unsafe Condition',
  safeDesc: 'Report a safe condition or behavior',
  unsafeDesc: 'Report an unsafe condition or act',
  newReport: 'New Report',
  reportSafe: 'Safe Report',
  reportUnsafe: 'Unsafe Report',
  writeNote: 'Write a note',
  writeNotePlaceholder: 'Write a description of the report...',
  attachPhoto: 'Attach Photo',
  takePhoto: 'Take Photo',
  chooseFromGallery: 'Choose from Gallery',
  submit: 'Submit',
  cancel: 'Cancel',
  next: 'Next',
  back: 'Back',
  done: 'Done',
  thankYou: 'Thank You',
  thankYouMsg: 'Your report has been submitted successfully',
  classification: 'Classification',
  unsafeConditionShort: 'Unsafe Condition',
  unsafeAct: 'Unsafe Act',
  reportDetails: 'Report Details',
  description: 'Description',
  descriptionRequired: 'Description is required',
  correctiveAction: 'Immediate Corrective Action',
  correctiveActionRequired: 'Corrective action is required',
  correctiveActionPlaceholder: 'What action was taken?',
  capturingLocation: 'Capturing location...',
  locationCaptured: 'Location captured',
  locationError: 'Could not determine location',
  responsibleDept: 'Responsible Department',
  selectDept: 'Select Department',
  subcategory: 'Subcategory',
  selectSubcategory: 'Select Subcategory',
  status: 'Status',
  closed: 'Closed',
  open: 'Open',
  inProgress: 'In Progress',
  priority: 'Priority',
  priorityLow: 'Low',
  priorityMedium: 'Medium',
  priorityHigh: 'High',
  priorityCritical: 'Critical',
  filterBy: 'Filter',
  all: 'All',
  filterType: 'Type',
  filterStatus: 'Status',
  filterDept: 'Department',
  filterDate: 'Date',
  reportDetailsTitle: 'Report Details',
  assignedTo: 'Assigned To',
  createdBy: 'Created By',
  createdAt: 'Created At',
  closedAt: 'Closed At',
  updatedAt: 'Updated At',
  location: 'Location',
  openInMaps: 'Open in Maps',
  markInProgress: 'Mark as In Progress',
  markClosed: 'Mark as Closed',
  verifyDocument: 'Verify & Document',
  timeline: 'Timeline',
  noReports: 'No Reports',
  noReportsMsg: 'You have not created any reports yet',
  noNotifications: 'No Notifications',
  noNotificationsMsg: 'You have not received any notifications yet',
  totalReports: 'Total Reports',
  openReports: 'Open Reports',
  closedReports: 'Closed Reports',
  avgClosureTime: 'Avg Closure Time',
  byDepartment: 'By Department',
  bySubcategory: 'By Subcategory',
  byPriority: 'By Priority',
  dateRange: 'Date Range',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  last90Days: 'Last 90 days',
  allTime: 'All time',
  language: 'Language',
  arabic: 'العربية',
  english: 'English',
  themeMode: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  userInfo: 'User Info',
  role: 'Role',
  department: 'Department',
  email: 'Email',
  phone: 'Phone',
  error: 'Error',
  retry: 'Retry',
  loading: 'Loading...',
  saving: 'Saving...',
  submitting: 'Submitting...',
  search: 'Search',
  yes: 'Yes',
  no: 'No',
  confirm: 'Confirm',
  delete: 'Delete',
  edit: 'Edit',
  view: 'View',
  close: 'Close',
  unread: 'Unread',
  markAllRead: 'Mark all as read',
  created: 'Created',
  assigned: 'Assigned',
  verified: 'Verified',
  documented: 'Documented',
  employee: 'Employee',
  supervisor: 'Supervisor',
  hseOfficer: 'HSE Officer',
  technician: 'Technician',
  admin: 'Admin',
  gpsLocation: 'GPS Location',
  noLocation: 'No location',
  photo: 'Photo',
  noPhoto: 'No photo',
  selectPriority: 'Select Priority',
  optional: 'optional',
  required: 'required',
  step: 'Step',
  of: 'of',
  reviewReport: 'Review Report',
  reviewAndSubmit: 'Review and Submit',
  autoAssigned: 'Auto-assigned',
  sendNotification: 'Send notification',
  notifNewReport: 'New report',
  notifReportClosed: 'Report closed',
  notifReportAssigned: 'Report assigned to you',
  notifReportVerified: 'Report verified',
  splashTagline: 'HSE Safety Management & Reporting',
};

export const translations: Record<Language, Translation> = { ar, en };

export const isRTL = (lang: Language): boolean => lang === 'ar';
