// src/app/api/auth/check-super-admin/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ isSuperAdmin: false });
    }

    const { data: currentUser, error } = await supabaseAdmin
      .from('users')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (error || !currentUser) {
      return NextResponse.json({ isSuperAdmin: false });
    }

    return NextResponse.json({ isSuperAdmin: currentUser.is_super_admin || false });
  } catch (error) {
    console.error("Error checking super admin:", error);
    return NextResponse.json({ isSuperAdmin: false });
  }
}