// src/app/api/storage/signed-url/[...filePath]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  try {
    const { filePath: pathSegments } = await params;
    
    // بررسی احراز هویت
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید' },
        { status: 401 }
      );
    }

    // ساخت مسیر کامل
    const filePath = pathSegments.join('/');

    if (!filePath) {
      return NextResponse.json(
        { error: 'مسیر فایل ارسال نشده است' },
        { status: 400 }
      );
    }

    // دریافت Signed URL
    const { data, error } = await supabase.storage
      .from('patient-files')
      .createSignedUrl(filePath, 300); // 5 minutes

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    // ریدایرکت به URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا در دریافت URL' },
      { status: 500 }
    );
  }
}