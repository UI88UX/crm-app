// src/lib/storage/patientFiles.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateFile, generateFilePath, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "./helpers";

// ============================================
// Types
// ============================================

export interface PatientFile {
  id: string;
  name: string;
  bucket_id: string;
  path: string;
  size: number;
  created_at: string;
  updated_at: string;
  url?: string;
  metadata: {
    mimetype: string;
    size: number;
    patient_id: string;
    original_name: string;
  };
}

export interface UploadResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    path: string;
    fullPath: string;
    url: string;
  };
}

// ============================================
// Constants
// ============================================

const BUCKET_NAME = 'patient-files';

// ============================================
// Server Actions (async - با "use server")
// ============================================

/**
 * دریافت Tenant ID کاربر جاری
 */
async function getCurrentTenantId(): Promise<string | null> {
  const supabase = await createClient();

  const { data: tenantId, error } = await supabase
    .rpc('get_current_tenant_id');

  if (error || !tenantId) {
    return null;
  }

  return tenantId;
}

/**
 * دریافت Signed URL برای یک فایل
 */
export async function getSignedUrl(filePath: string): Promise<{
  url: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 300); // 5 minutes

    if (error) {
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'خطا در دریافت URL'
    };
  }
}

/**
 * دریافت لیست فایل‌های یک بیمار
 */
export async function getPatientFiles(patientId: string): Promise<{
  files: PatientFile[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const tenantId = await getCurrentTenantId();

    if (!tenantId) {
      return { files: [], error: 'Tenant یافت نشد' };
    }

    // مسیر جستجو: tenant_id/patient_id/
    const searchPath = `${tenantId}/${patientId}/`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(searchPath);

    if (error) {
      return { files: [], error: error.message };
    }

    // دریافت Signed URL برای هر فایل به صورت جداگانه
    const filesWithUrl = await Promise.all(
      data.map(async (item) => {
        const filePath = `${searchPath}${item.name}`;
        const { url } = await getSignedUrl(filePath);
        
        return {
          id: item.id || crypto.randomUUID(),
          name: item.name,
          bucket_id: BUCKET_NAME,
          path: filePath,
          size: item.metadata?.size || 0,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
          url: url || undefined,
          metadata: {
            mimetype: item.metadata?.mimetype || 'unknown',
            size: item.metadata?.size || 0,
            patient_id: patientId,
            original_name: item.name,
          },
        };
      })
    );

    return {
      files: filesWithUrl,
      error: null,
    };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : 'خطا در دریافت فایل‌ها',
    };
  }
}

/**
 * آپلود فایل بیمار
 */
export async function uploadPatientFile(
  patientId: string,
  file: File
): Promise<UploadResult> {
  try {
    // اعتبارسنجی فایل
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const supabase = await createClient();

    // دریافت Tenant ID
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return { success: false, error: 'شما به هیچ Tenant متصل نیستید' };
    }

    // تولید مسیر
    const filePath = generateFilePath(tenantId, patientId, file.name);

    // آپلود فایل
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        metadata: {
          patient_id: patientId,
          original_name: file.name,
          tenant_id: tenantId,
        },
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // دریافت Signed URL
    const { url } = await getSignedUrl(data.path);
    if (!url) {
      return {
        success: false,
        error: 'فایل آپلود شد اما دریافت URL امکان‌پذیر نیست',
      };
    }

    // بازآوری مسیر (برای آپدیت کش)
    revalidatePath(`/dashboard/patients/${patientId}`);

    return {
      success: true,
      data: {
        id: data.id,
        path: data.path,
        fullPath: data.fullPath,
        url,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در آپلود فایل',
    };
  }
}

/**
 * حذف فایل بیمار
 */
export async function deletePatientFile(
  patientId: string,
  filePath: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    // حذف فایل (RLS به صورت خودکار دسترسی را بررسی می‌کند)
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    // بازآوری مسیر
    revalidatePath(`/dashboard/patients/${patientId}`);

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'خطا در حذف فایل',
    };
  }
}

/**
 * بررسی وجود فایل
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        limit: 1,
        offset: 0,
        search: filePath.split('/').pop() || '',
      });

    if (error || !data || data.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}