// POST /api/applications — mark a job as applied (creates an Application record)
// PATCH /api/applications — update status/notes on an existing application
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jobId, notes } = body as { jobId: string; notes?: string };

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const application = await prisma.application.upsert({
    where: { jobId },
    create: { jobId, notes },
    update: { notes },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status, notes } = body as {
    id: string;
    status?: ApplicationStatus;
    notes?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const application = await prisma.application.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(notes !== undefined ? { notes } : {}) },
  });

  return NextResponse.json(application);
}
