// src/app/api/call-followups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCallFollowups, createCallFollowup } from "@/lib/supabase/call-followups";
import type { CallFollowupStatus, CallResult } from "@/types";

// GET /api/call-followups?status=pending&result=positive&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as CallFollowupStatus | null;
    const result = searchParams.get("result") as CallResult | null;
    const patient_id = searchParams.get("patient_id");
    const due_from = searchParams.get("due_from");
    const due_to = searchParams.get("due_to");
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const response = await getCallFollowups({
      status: status || undefined,
      result: result || undefined,
      patient_id: patient_id || undefined,
      due_from: due_from || undefined,
      due_to: due_to || undefined,
      page,
      limit,
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error, data: [] },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: response.data,
      count: response.count,
    });
  } catch (error: any) {
    console.error("GET /api/call-followups error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}

// POST /api/call-followups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await createCallFollowup({
      patient_id: body.patient_id,
      due_date: body.due_date,
      notes: body.notes ?? null,
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error, fieldErrors: response.fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: response.data }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/call-followups error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}