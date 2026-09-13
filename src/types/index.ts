// ============================================
// Types مشترک برای کل پروژه
// ============================================

export interface Patient {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_call_result: CallResult | null;   // ← جدید
  last_call_at: string | null;            // ← جدید
  next_call_due_at: string | null;        // ← جدید
}

export interface Sale {
  id: string;
  tenant_id: string;
  patient_id: string;
  hearing_aid_model: string;
  hearing_aid_serial: string;
  price: number;
  sale_date: string;
  warranty_expiry: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'national_code' | 'phone'>;
}

// ============================================
// Appointment Types
// ============================================

export type AppointmentStatus = 
  | 'scheduled'      // برنامه‌ریزی‌شده
  | 'pending'        // در انتظار
  | 'confirmed'      // تأیید شده
  | 'in_progress'    // در حال انجام
  | 'completed'      // انجام شده
  | 'cancelled'      // لغو شده
  | 'no_show';       // عدم حضور

export type AppointmentType = 
  | 'visit'          // ویزیت
  | 'follow_up'      // پیگیری
  | 'test'           // تست شنوایی
  | 'fitting'        // تنظیم سمعک
  | 'consultation'   // مشاوره
  | 'other';         // سایر

export interface Appointment {
  id: string;
  tenant_id: string;
  patient_id: string;
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'national_code' | 'phone'>;
  start_time: string;        // ISO datetime
  end_time: string;          // ISO datetime
  type: AppointmentType;
  status: AppointmentStatus;
  title: string | null;
  description: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  no_show_reason: string | null;        
  completed_at: string | null;          
  confirmed_at: string | null;          
  started_at: string | null;            
  reminder_sent: boolean;               
  reminder_sent_at: string | null;      
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DashboardStats {
  total_patients: number;
  total_appointments: number;
  total_sales: number;
  total_revenue: number;
  recent_activity_count: number;
  conversion_rate: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
}

// ============================================
// Form Types
// ============================================

export interface PatientFormData {
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  email?: string | null;
  birth_date?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  notes?: string | null;
}

export interface SaleFormData {
  patient_id: string;
  hearing_aid_model: string;
  hearing_aid_serial: string;
  price: number;
  sale_date?: string;
  warranty_expiry?: string | null;
  notes?: string | null;
}

export interface AppointmentFormData {
  patient_id: string;
  start_time: string;        // ISO datetime
  end_time: string;          // ISO datetime
  type: AppointmentType;
  status: AppointmentStatus;
  title?: string | null;
  description?: string | null;
  notes?: string | null;
}

// ============================================
// Appointment Constants
// ============================================

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'برنامه‌ریزی‌شده', color: 'blue' },
  { value: 'pending', label: 'در انتظار', color: 'yellow' },
  { value: 'confirmed', label: 'تأیید شده', color: 'green' },
  { value: 'in_progress', label: 'در حال انجام', color: 'purple' },
  { value: 'completed', label: 'انجام شده', color: 'gray' },
  { value: 'cancelled', label: 'لغو شده', color: 'red' },
  { value: 'no_show', label: 'عدم حضور', color: 'orange' },
];

export const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'visit', label: 'ویزیت' },
  { value: 'follow_up', label: 'پیگیری' },
  { value: 'test', label: 'تست شنوایی' },
  { value: 'fitting', label: 'تنظیم سمعک' },
  { value: 'consultation', label: 'مشاوره' },
  { value: 'other', label: 'سایر' },
];

export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: 'برنامه‌ریزی‌شده', color: 'blue' },
  pending: { label: 'در انتظار', color: 'yellow' },
  confirmed: { label: 'تأیید شده', color: 'green' },
  in_progress: { label: 'در حال انجام', color: 'purple' },
  completed: { label: 'انجام شده', color: 'gray' },
  cancelled: { label: 'لغو شده', color: 'red' },
  no_show: { label: 'عدم حضور', color: 'orange' },
};

export const APPOINTMENT_TYPE_MAP: Record<AppointmentType, string> = {
  visit: 'ویزیت',
  follow_up: 'پیگیری',
  test: 'تست شنوایی',
  fitting: 'تنظیم سمعک',
  consultation: 'مشاوره',
  other: 'سایر',
};

// ============================================
// Call Followup Types (پیگیری تلفنی)
// ============================================

export type CallFollowupStatus =
  | 'pending'      // در انتظار تماس
  | 'completed'    // تماس انجام شد
  | 'cancelled'    // لغو شده
  | 'rescheduled'; // به تعویق افتاده

export type CallResult =
  | 'positive'        // مشاوره موفق
  | 'negative'        // مشاوره ناموفق
  | 'no_answer'       // عدم پاسخگویی
  | 'callback'        // نیاز به تماس مجدد
  | 'not_interested'; // عدم تمایل به ادامه

export interface CallFollowup {
  id: string;
  tenant_id: string;
  patient_id: string;
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'national_code' | 'phone'>;

  due_date: string;          // ISO datetime
  completed_at: string | null;

  status: CallFollowupStatus;
  result: CallResult | null;

  notes: string | null;       // یادداشت قبل از تماس
  call_notes: string | null;  // یادداشت بعد از تماس
  next_followup_date: string | null;

  reminder_sent: boolean;
  reminder_sent_at: string | null;

  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CallFollowupFormData {
  patient_id: string;
  due_date: string;
  notes?: string | null;
}

export interface CompleteCallFollowupFormData {
  result: CallResult;
  call_notes?: string | null;
  next_followup_date?: string | null; // اجباری اگر result === 'callback'
}

// ============================================
// Call Result Constants
// ============================================

export const CALL_RESULTS: {
  value: CallResult;
  label: string;
  shortLabel: string;
  color: 'green' | 'red' | 'gray' | 'blue' | 'orange';
  emoji: string;
  description: string;
}[] = [
  {
    value: 'positive',
    label: 'مشاوره موفق',
    shortLabel: 'موفق',
    color: 'green',
    emoji: '✅',
    description: 'بیمار برای ادامه همکاری اعلام آمادگی کرد',
  },
  {
    value: 'negative',
    label: 'مشاوره ناموفق',
    shortLabel: 'ناموفق',
    color: 'red',
    emoji: '❌',
    description: 'مشاوره نتیجه نداد و بیمار منصرف شد',
  },
  {
    value: 'no_answer',
    label: 'عدم پاسخگویی',
    shortLabel: 'بی‌پاسخ',
    color: 'gray',
    emoji: '📵',
    description: 'بیمار به تماس پاسخ نداد',
  },
  {
    value: 'callback',
    label: 'نیاز به تماس مجدد',
    shortLabel: 'تماس مجدد',
    color: 'blue',
    emoji: '🔄',
    description: 'نیاز به پیگیری مجدد در تاریخ مشخص',
  },
  {
    value: 'not_interested',
    label: 'عدم تمایل به ادامه',
    shortLabel: 'بی‌تمایل',
    color: 'orange',
    emoji: '🚫',
    description: 'بیمار تمایلی به ادامه همکاری نداشت',
  },
];

export const CALL_RESULT_MAP: Record<CallResult, typeof CALL_RESULTS[number]> =
  CALL_RESULTS.reduce((acc, item) => {
    acc[item.value] = item;
    return acc;
  }, {} as Record<CallResult, typeof CALL_RESULTS[number]>);

export const CALL_FOLLOWUP_STATUS_MAP: Record<
  CallFollowupStatus,
  { label: string; color: string }
> = {
  pending: { label: 'در انتظار تماس', color: 'blue' },
  completed: { label: 'انجام شده', color: 'green' },
  cancelled: { label: 'لغو شده', color: 'gray' },
  rescheduled: { label: 'به تعویق افتاده', color: 'orange' },
};