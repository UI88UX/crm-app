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