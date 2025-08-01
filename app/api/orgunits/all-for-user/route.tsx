// /api/orgunits/all-for-user/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get("id"));

  const units = await prisma.orgUnit.findMany({
    orderBy: { name: "asc" },
  });

  // Map for tree building
  const unitMap = new Map<number, any>();
  const tree: any[] = [];

  units.forEach((unit) => {
    unitMap.set(unit.id, { ...unit, children: [] });
  });

  units.forEach((unit) => {
    if (unit.parentId) {
      unitMap.get(unit.parentId)?.children.push(unitMap.get(unit.id));
    } else {
      tree.push(unitMap.get(unit.id));
    }
  });

  // Assigned units
  let assignedOrgUnitIds: number[] = [];
  if (userId) {
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    assignedOrgUnitIds = userOrgUnits.map((entry) => entry.orgUnitId);
  }

  return NextResponse.json({
    tree,
    assignedOrgUnitIds,
  });
}
