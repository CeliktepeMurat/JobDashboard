// GET /api/stats — aggregate counts for the stats view
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalFeedApplications,
    totalManualApplications,
    weekFeed,
    weekManual,
    monthFeed,
    monthManual,
    byStatus,
    byPlatform,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.manualApplication.count(),
    prisma.application.count({ where: { appliedAt: { gte: startOfWeek } } }),
    prisma.manualApplication.count({ where: { appliedAt: { gte: startOfWeek } } }),
    prisma.application.count({ where: { appliedAt: { gte: startOfMonth } } }),
    prisma.manualApplication.count({ where: { appliedAt: { gte: startOfMonth } } }),
    prisma.manualApplication.groupBy({ by: ["status"], _count: true }),
    prisma.manualApplication.groupBy({ by: ["platform"], _count: true }),
  ]);

  return NextResponse.json({
    total: totalFeedApplications + totalManualApplications,
    thisWeek: weekFeed + weekManual,
    thisMonth: monthFeed + monthManual,
    byStatus,
    byPlatform,
  });
}
