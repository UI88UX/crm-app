// src/app/api/call-followups/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cancelCallFollowup } from "@/lib/supabase/call-followups";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/call-followups/[id]/cancel
export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const response = await cancelCallFollowup(id);

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
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