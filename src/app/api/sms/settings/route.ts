// src/app/api/sms/settings/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/sms/settings - دریافت تنظیمات پیامک
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');
    
    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    // دریافت تنظیمات از دیتابیس
    const { data, error } = await supabase
      .from("sms_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching SMS settings:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // اگر تنظیماتی وجود نداشت، مقدار پیش‌فرض برگردان
    if (!data) {
      return NextResponse.json({
        data: {
          is_enabled: true,
          max_messages_per_month: 10,
          allowed_start_hour: 9,
          allowed_end_hour: 20,
          enable_birthday_alerts: true,
          enable_hearing_aid_followup: true,
          clinic_name: "",
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });
    }

    return NextResponse.json({ data, error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

// PUT /api/sms/settings - به‌روزرسانی تنظیمات پیامک
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // دریافت tenant_id
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');
    
    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: "کاربر به هیچ Tenant متصل نیست." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // حذف فیلدهای غیرمجاز
    const { id, tenant_id, created_at, updated_at, ...updateData } = body;

    // بررسی وجود تنظیمات
    const { data: existing, error: checkError } = await supabase
      .from("sms_settings")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    let result;

    if (existing) {
      // به‌روزرسانی
      result = await supabase
        .from("sms_settings")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .select()
        .single();
    } else {
      // ایجاد جدید
      result = await supabase
        .from("sms_settings")
        .insert({
          ...updateData,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error saving SMS settings:", result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}