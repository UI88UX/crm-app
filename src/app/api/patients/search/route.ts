// src/app/api/patients/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // بررسی احراز هویت
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "لطفاً وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    // دریافت پارامترها
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // دریافت Tenant ID
    const { data: tenantId, error: tenantError } = await supabase
      .rpc('get_current_tenant_id');

    if (tenantError || !tenantId) {
      return NextResponse.json(
        { error: "Tenant یافت نشد" },
        { status: 400 }
      );
    }

    // جستجوی بیماران - استفاده از ilike برای جستجوی متنی
    const searchTerm = query.trim();
    
    const { data, error } = await supabase
      .from("patients")
      .select("id, first_name, last_name, national_code, phone, email")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(
        `first_name.ilike.%${searchTerm}%,` +
        `last_name.ilike.%${searchTerm}%,` +
        `national_code.ilike.%${searchTerm}%,` +
        `phone.ilike.%${searchTerm}%`
      )
      .order("first_name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error searching patients:", error);
      return NextResponse.json(
        { error: "خطا در جستجوی بیماران" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      query: searchTerm,
    });
  } catch (error) {
    console.error("Error in GET /api/patients/search:", error);
    return NextResponse.json(
      { error: "خطا در جستجوی بیماران" },
      { status: 500 }
    );
  }
}