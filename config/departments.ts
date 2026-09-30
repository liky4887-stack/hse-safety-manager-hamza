import type { Department, RoleOption } from '@/types';

export const ROLES: RoleOption[] = [
  { id: 'employee', nameAr: 'موظف', nameEn: 'Employee', icon: 'user' },
  { id: 'supervisor', nameAr: 'مشرف', nameEn: 'Supervisor', icon: 'hard-hat' },
  { id: 'hse_officer', nameAr: 'مسؤول سلامة', nameEn: 'HSE Officer', icon: 'shield-check' },
  { id: 'technician', nameAr: 'فني', nameEn: 'Technician', icon: 'wrench' },
  { id: 'admin', nameAr: 'مدير', nameEn: 'Admin', icon: 'settings' },
];

export const DEPARTMENTS: Department[] = [
  {
    id: 'mechanical',
    nameAr: 'ميكانيكا',
    nameEn: 'Mechanical',
    subcategories: [
      { id: 'maintenance', nameAr: 'صيانة', nameEn: 'Maintenance' },
      { id: 'equipment', nameAr: 'معدات', nameEn: 'Equipment' },
      { id: 'lubrication', nameAr: 'تزييت', nameEn: 'Lubrication' },
      { id: 'pumps', nameAr: 'مضخات', nameEn: 'Pumps' },
      { id: 'engines', nameAr: 'محركات', nameEn: 'Engines' },
    ],
  },
  {
    id: 'electrical',
    nameAr: 'كهرباء',
    nameEn: 'Electrical',
    subcategories: [
      { id: 'wiring', nameAr: 'تمديد كهربائي', nameEn: 'Wiring' },
      { id: 'panels', nameAr: 'لوحات كهربائية', nameEn: 'Panels' },
      { id: 'generators', nameAr: 'مولدات', nameEn: 'Generators' },
      { id: 'lighting', nameAr: 'إنارة', nameEn: 'Lighting' },
      { id: 'transformers', nameAr: 'محولات', nameEn: 'Transformers' },
    ],
  },
  {
    id: 'welding',
    nameAr: 'لحام',
    nameEn: 'Welding',
    subcategories: [
      { id: 'pipe_welding', nameAr: 'لحام الأنابيب', nameEn: 'Pipe Welding' },
      { id: 'structural', nameAr: 'لحام إنشائي', nameEn: 'Structural' },
      { id: 'gas_welding', nameAr: 'لحام بالغاز', nameEn: 'Gas Welding' },
      { id: 'inspection', nameAr: 'فحص اللحامات', nameEn: 'Weld Inspection' },
    ],
  },
  {
    id: 'chemistry',
    nameAr: 'كيمياء',
    nameEn: 'Chemistry',
    subcategories: [
      { id: 'chemical_handling', nameAr: 'مناولة المواد الكيميائية', nameEn: 'Chemical Handling' },
      { id: 'storage', nameAr: 'تخزين', nameEn: 'Storage' },
      { id: 'spills', nameAr: 'تسربات', nameEn: 'Spills' },
      { id: 'analysis', nameAr: 'تحليلات', nameEn: 'Analysis' },
    ],
  },
  {
    id: 'health_safety',
    nameAr: 'صحة والسلامة',
    nameEn: 'Health & Safety',
    subcategories: [
      { id: 'ppe', nameAr: 'معدات الوقاية', nameEn: 'PPE' },
      { id: 'first_aid', nameAr: 'إسعافات أولية', nameEn: 'First Aid' },
      { id: 'fire_safety', nameAr: 'سلامة الحريق', nameEn: 'Fire Safety' },
      { id: 'ergonomics', nameAr: 'الصحة المهنية', nameEn: 'Ergonomics' },
    ],
  },
  {
    id: 'drilling',
    nameAr: 'أعمال حفر',
    nameEn: 'Drilling',
    subcategories: [
      { id: 'rig_operations', nameAr: 'عمليات الحفر', nameEn: 'Rig Operations' },
      { id: 'mud_systems', nameAr: 'أنظمة الطين', nameEn: 'Mud Systems' },
      { id: 'casing', nameAr: 'تبطين', nameEn: 'Casing' },
      { id: 'blowout', nameAr: 'منع الانفجار', nameEn: 'Blowout Prevention' },
    ],
  },
  {
    id: 'transport',
    nameAr: 'نقل',
    nameEn: 'Transport',
    subcategories: [
      { id: 'vehicles', nameAr: 'مركبات', nameEn: 'Vehicles' },
      { id: 'loading', nameAr: 'تحميل', nameEn: 'Loading' },
      { id: 'fueling', nameAr: 'تزويد بالوقود', nameEn: 'Fueling' },
      { id: 'traffic', nameAr: 'مرور', nameEn: 'Traffic' },
    ],
  },
  {
    id: 'camp',
    nameAr: 'مخيم',
    nameEn: 'Camp',
    subcategories: [
      { id: 'accommodation', nameAr: 'سكن', nameEn: 'Accommodation' },
      { id: 'mess_hall', nameAr: 'المطبخ', nameEn: 'Mess Hall' },
      { id: 'sanitation', nameAr: 'صرف صحي', nameEn: 'Sanitation' },
      { id: 'recreation', nameAr: 'ترفيه', nameEn: 'Recreation' },
    ],
  },
  {
    id: 'equipment',
    nameAr: 'معدات',
    nameEn: 'Equipment',
    subcategories: [
      { id: 'cranes', nameAr: 'رافعات', nameEn: 'Cranes' },
      { id: 'forklifts', nameAr: 'رافعات شوكية', nameEn: 'Forklifts' },
      { id: 'heavy_machinery', nameAr: 'آلات ثقيلة', nameEn: 'Heavy Machinery' },
      { id: 'hand_tools', nameAr: 'أدوات يدوية', nameEn: 'Hand Tools' },
    ],
  },
];

export const getDepartmentById = (id: string): Department | undefined =>
  DEPARTMENTS.find((d) => d.id === id);

export const getSubcategoryById = (deptId: string, subId: string) => {
  const dept = getDepartmentById(deptId);
  return dept?.subcategories.find((s) => s.id === subId);
};
