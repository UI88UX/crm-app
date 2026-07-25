// src/app/api/storage/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    console.log('Delete API: Starting...');
    
    // بررسی احراز هویت
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Delete API: Auth error:', authError);
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      );
    }

    console.log('Delete API: User authenticated:', user.id);

    // دریافت داده‌های درخواست
    const body = await request.json();
    const { filePath, patientId } = body;

    console.log('Delete API: filePath:', filePath, 'patientId:', patientId);

    if (!filePath) {
      return NextResponse.json(
        { error: 'مسیر فایل ارسال نشده است' },
        { status: 400 }
      );
    }

    // حذف فایل (RLS به صورت خودکار دسترسی را بررسی می‌کند)
    const { error } = await supabase.storage
      .from('patient-files')
      .remove([filePath]);

    if (error) {
      console.error('Delete API: Storage error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Delete API: File deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Delete API: Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در حذف فایل' },
      { status: 500 }
    );
  }
}