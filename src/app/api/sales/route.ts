// src/app/api/sales/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/sales - دریافت لیست فروش‌ها
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
    const patientId = searchParams.get('patient_id');
    const search = searchParams.get('search') || '';

    // ساخت کوئری
    let query = supabase
      .from("sales")
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          national_code,
          phone
        )
      `)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("sale_date", { ascending: false });

    // فیلتر بر اساس بیمار
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    // جستجو
    if (search) {
      query = query.or(
        `hearing_aid_model.ilike.%${search}%,hearing_aid_serial.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sales:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [], error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// POST /api/sales - ایجاد فروش جدید
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
    
    const saleData = {
      ...body,
      tenant_id: tenantId,
      created_by: user.id,
      sale_date: body.sale_date || new Date().toISOString().split('T')[0],
    };

    // درج در دیتابیس
    const { data, error } = await supabase
      .from("sales")
      .insert(saleData)
      .select(`
        *,
        patient:patients (
          id,
          first_name,
          last_name,
          national_code,
          phone
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "سریال سمعک قبلاً ثبت شده است." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}