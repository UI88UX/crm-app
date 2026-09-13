// src/app/api/call-followups/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { completeCallFollowup } from "@/lib/supabase/call-followups";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/call-followups/[id]/complete
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await completeCallFollowup(id, {
      result: body.result,
      call_notes: body.call_notes ?? null,
      next_followup_date: body.next_followup_date ?? null,
    });

    if (response.error) {
      return NextResponse.json(
        { error: response.error, fieldErrors: response.fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: response.data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}