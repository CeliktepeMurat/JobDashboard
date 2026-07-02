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
    feedByStatus,
    manualByStatus,
    byPlatform,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.manualApplication.count(),
    prisma.application.count({ where: { appliedAt: { gte: startOfWeek } } }),
    prisma.manualApplication.count({ where: { appliedAt: { gte: startOfWeek } } }),
    prisma.application.count({ where: { appliedAt: { gte: startOfMonth } } }),
    prisma.manualApplication.count({ where: { appliedAt: { gte: startOfMonth } } }),
    prisma.application.groupBy({ by: ["status"], _count: true }),
    prisma.manualApplication.groupBy({ by: ["status"], _count: true }),
    prisma.manualApplication.groupBy({ by: ["platform"], _count: true }),
  ]);

  // Feed and manual applications are tracked in separate tables — merge their
  // status counts so "By Status" reflects all applications, not just manual ones.
  const statusCounts = new Map<string, number>();
  for (const row of [...feedByStatus, ...manualByStatus]) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + row._count);
  }
  const byStatus = Array.from(statusCounts, ([status, _count]) => ({ status, _count }));

  return NextResponse.json({
    total: totalFeedApplications + totalManualApplications,
    thisWeek: weekFeed + weekManual,
    thisMonth: monthFeed + monthManual,
    byStatus,
    byPlatform,
  });
}
