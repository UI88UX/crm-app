// src/app/api/storage/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateFile, generateFilePath } from "@/lib/storage/helpers";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Starting...');
    
    // بررسی احراز هویت
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Upload API: Auth error:', authError);
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      );
    }

    console.log('Upload API: User authenticated:', user.id);

    // دریافت Tenant ID
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      console.log('Upload API: Tenant error:', tenantError);
      return NextResponse.json(
        { error: 'کاربر به هیچ Tenant متصل نیست' },
        { status: 403 }
      );
    }

    console.log('Upload API: Tenant ID:', tenantId);

    // دریافت داده‌های فرم
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string | null;

    if (!file) {
      console.log('Upload API: No file provided');
      return NextResponse.json(
        { error: 'فایلی ارسال نشده است' },
        { status: 400 }
      );
    }

    if (!patientId) {
      console.log('Upload API: No patientId provided');
      return NextResponse.json(
        { error: 'شناسه بیمار ارسال نشده است' },
        { status: 400 }
      );
    }

    console.log('Upload API: File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Upload API: Patient ID:', patientId);

    // اعتبارسنجی فایل
    const validation = validateFile(file);
    console.log('Upload API: Validation result:', validation);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // تولید مسیر فایل
    const filePath = generateFilePath(tenantId, patientId, file.name);
    console.log('Upload API: File path:', filePath);

    // آپلود فایل
    const { data, error: uploadError } = await supabase.storage
      .from('patient-files')
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

    if (uploadError) {
      console.error('Upload API: Upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    console.log('Upload API: Upload successful:', data);

    // دریافت Signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('patient-files')
      .createSignedUrl(filePath, 300); // 5 minutes

    if (signedError) {
      console.error('Upload API: Signed URL error:', signedError);
      return NextResponse.json(
        { error: 'فایل آپلود شد اما دریافت URL امکان‌پذیر نیست' },
        { status: 500 }
      );
    }

    console.log('Upload API: Success, returning response');

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        path: data.path,
        fullPath: data.fullPath,
        url: signedData.signedUrl,
      },
    });
  } catch (error) {
    console.error('Upload API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در آپلود فایل' },
      { status: 500 }
    );
  }
}