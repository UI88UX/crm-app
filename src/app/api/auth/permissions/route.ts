// src/app/api/auth/permissions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/auth/permissions
// دریافت دسترسی‌های کاربر جاری
// ============================================
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'لطفاً وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc('get_my_permissions');

    if (error) {
      console.error('Error getting permissions:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Permissions API error:', error);
    return NextResponse.json(
      { error: error.message || 'خطای غیرمنتظره' },
      { status: 500 }
    );
  }
}