import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/patients - دریافت لیست بیماران
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // دریافت tenant_id کاربر جاری
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    // دریافت پارامترهای query
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ فیلترهای پیگیری تلفنی
    const callResult = searchParams.get('call_result');
    const hasPendingFollowup = searchParams.get('has_pending_followup');
    const nextCallDue = searchParams.get('next_call_due');

    // ساخت کوئری
    let query = supabase
      .from("patients")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // اعمال جستجو
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,national_code.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // ✅ فیلتر بر اساس آخرین نتیجه پیگیری
    if (callResult && ['positive', 'negative', 'no_answer', 'callback', 'not_interested'].includes(callResult)) {
      query = query.eq('last_call_result', callResult);
    }

    // ✅ فیلتر بیماران دارای پیگیری فعال
    if (hasPendingFollowup === 'true') {
      query = query.not('next_call_due_at', 'is', null);
    } else if (hasPendingFollowup === 'false') {
      query = query.is('next_call_due_at', null);
    }

    // ✅ فیلتر بیماران با پیگیری نزدیک
    if (nextCallDue) {
      const now = new Date();

      if (nextCallDue === 'today') {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        query = query
          .gte('next_call_due_at', todayStart.toISOString())
          .lte('next_call_due_at', todayEnd.toISOString());
      } else if (nextCallDue === 'overdue') {
        query = query.lt('next_call_due_at', now.toISOString());
      } else if (nextCallDue === 'tomorrow') {
        const tomorrowStart = new Date(now);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);
        query = query
          .gte('next_call_due_at', tomorrowStart.toISOString())
          .lte('next_call_due_at', tomorrowEnd.toISOString());
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching patients:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}
// POST /api/patients - ایجاد بیمار جدید
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // دریافت کاربر جاری
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    // دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');
    
    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    // دریافت داده‌ها
    const body = await request.json();
    
    const patientData = {
      ...body,
      tenant_id: tenantId,
    };

    // درج در دیتابیس
    const { data, error } = await supabase
      .from("patients")
      .insert(patientData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "کد ملی قبلاً ثبت شده است." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}