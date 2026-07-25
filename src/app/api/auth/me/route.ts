import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/auth/me - دریافت اطلاعات کاربر جاری
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "کاربر وارد نشده است." },
        { status: 401 }
      );
    }

    // دریافت اطلاعات کامل کاربر از جدول users
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        phone,
        role,
        is_super_admin,
        is_active,
        tenant_id,
        tenants:tenant_id (
          id,
          name,
          slug,
          license_key
        )
      `)
      .eq("id", user.id)
      .single();

    if (dbError) {
      console.error("Error fetching user data:", dbError);
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      ...userData,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}