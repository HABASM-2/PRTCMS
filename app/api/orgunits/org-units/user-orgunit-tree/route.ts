// app/api/user-orgunit-tree/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get("id"));

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Get all orgUnits the user is directly assigned to
  const assigned = await prisma.userOrgUnit.findMany({
    where: { userId },
    include: { orgUnit: true },
  });

  const assignedOrgUnitIds = assigned.map((a) => a.orgUnitId);

  // Fetch all orgUnits in the same organisations as those assigned
  const orgIds = [
    ...new Set(assigned.map((a) => a.orgUnit.organisationId)),
  ];

  const allUnits = await prisma.orgUnit.findMany({
    where: {
      organisationId: { in: orgIds },
    },
    orderBy: { name: "asc" },
  });

  // Build a tree from allUnits
  const unitMap = new Map<number, any>();
  allUnits.forEach((unit) => {
    unitMap.set(unit.id, { ...unit, children: [] });
  });

  allUnits.forEach((unit) => {
    if (unit.parentId && unitMap.has(unit.parentId)) {
      unitMap.get(unit.parentId).children.push(unitMap.get(unit.id));
    }
  });

  // Only return the trees rooted at assigned units or their ancestors
  function findRoot(unit: any): any {
    let current = unit;
    while (current.parentId && unitMap.has(current.parentId)) {
      current = unitMap.get(current.parentId);
    }
    return current;
  }

  const rootUnits = new Map<number, any>();
  assignedOrgUnitIds.forEach((id) => {
    const unit = unitMap.get(id);
    if (unit) {
      const root = findRoot(unit);
      rootUnits.set(root.id, root);
    }
  });

  const tree = Array.from(rootUnits.values());

  return NextResponse.json({
    tree,
    assignedOrgUnitIds,
  });
}
