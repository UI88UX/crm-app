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