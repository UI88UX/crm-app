// src/app/api/call-followups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getCallFollowup,
  updateCallFollowup,
  deleteCallFollowup,
} from "@/lib/supabase/call-followups";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/call-followups/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const response = await getCallFollowup(id);

    if (response.error || !response.data) {
      return NextResponse.json(
        { error: response.error || "پیگیری یافت نشد" },
        { status: 404 }
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

// PATCH /api/call-followups/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await updateCallFollowup(id, {
      due_date: body.due_date,
      notes: body.notes ?? null,
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

// DELETE /api/call-followups/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const response = await deleteCallFollowup(id);

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