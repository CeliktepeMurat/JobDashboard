// GET /api/jobs — return cached jobs from the DB with optional filters
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { JobSource } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") ?? undefined;
  const source = (searchParams.get("source") as JobSource | null) ?? undefined;

  const jobs = await prisma.job.findMany({
    where: {
      ...(source ? { source } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: "insensitive" } },
              { company: { contains: keyword, mode: "insensitive" } },
              { description: { contains: keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { application: true },
    orderBy: { fetchedAt: "desc" },
  });

  return NextResponse.json(jobs);
}
