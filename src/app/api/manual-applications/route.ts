// GET    /api/manual-applications — list all manually added applications
// POST   /api/manual-applications — create a new manual application
// PATCH  /api/manual-applications — update an existing manual application
// DELETE /api/manual-applications?id=... — remove a manual application
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@/types";

export async function GET() {
  const entries = await prisma.manualApplication.findMany({
    orderBy: { appliedAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { company, role, platform, url, status, notes, appliedAt } = body as {
    company: string;
    role: string;
    platform: string;
    url?: string;
    status?: ApplicationStatus;
    notes?: string;
    appliedAt?: string;
  };

  if (!company || !role || !platform) {
    return NextResponse.json(
      { error: "company, role, and platform are required" },
      { status: 400 }
    );
  }

  const entry = await prisma.manualApplication.create({
    data: {
      company,
      role,
      platform,
      url,
      status: status ?? "APPLIED",
      notes,
      ...(appliedAt ? { appliedAt: new Date(appliedAt) } : {}),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, appliedAt, ...updates } = body as {
    id: string;
    company?: string;
    role?: string;
    platform?: string;
    url?: string;
    status?: ApplicationStatus;
    notes?: string;
    appliedAt?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const entry = await prisma.manualApplication.update({
    where: { id },
    data: {
      ...updates,
      ...(appliedAt ? { appliedAt: new Date(appliedAt) } : {}),
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.manualApplication.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
