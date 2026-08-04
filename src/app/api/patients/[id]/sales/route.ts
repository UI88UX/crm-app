// src/app/api/patients/[id]/sales/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;
    const supabase = await createClient();

    // دریافت فروش‌های بیمار
    const { data: sales, error } = await supabase
      .from("sales")
      .select("*")
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("sale_date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: sales || [] });
  } catch (error) {
    console.error("Error fetching patient sales:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فروش‌های بیمار" },
      { status: 500 }
    );
  }
}