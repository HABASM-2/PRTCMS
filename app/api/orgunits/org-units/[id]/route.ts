import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = Number(req.nextUrl.searchParams.get("id"));
  const userId = Number(req.nextUrl.searchParams.get("userId"));

  if (!orgId) {
    return NextResponse.json(
      { error: "Missing organisation ID" },
      { status: 400 }
    );
  }

  // 1. Fetch all OrgUnits for this organisation
  const units = await prisma.orgUnit.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
  });

  // 2. Build a map for fast lookup
  const unitMap = new Map<number, any>();
  const tree: any[] = [];

  units.forEach((unit) => {
    unitMap.set(unit.id, { ...unit, children: [] });
  });

  units.forEach((unit) => {
    if (unit.parentId) {
      const parent = unitMap.get(unit.parentId);
      if (parent) parent.children.push(unitMap.get(unit.id));
    } else {
      tree.push(unitMap.get(unit.id));
    }
  });

  // 3. Find assigned orgUnitIds
  let assignedOrgUnitIds: number[] = [];
  if (userId) {
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    assignedOrgUnitIds = userOrgUnits.map((entry) => entry.orgUnitId);
  }

  // 4. Expand assignedOrgUnitIds to include all parent IDs
  const allAssignedWithParents = new Set<number>();

  const findParents = (id: number, lookup: Map<number, any>) => {
    const visited = new Set<number>();
    let currentId = id;
    while (true) {
      const unit = lookup.get(currentId);
      if (!unit || !unit.parentId || visited.has(unit.parentId)) break;
      allAssignedWithParents.add(unit.parentId);
      visited.add(unit.parentId);
      currentId = unit.parentId;
    }
  };

  assignedOrgUnitIds.forEach((id) => {
    allAssignedWithParents.add(id);
    findParents(id, unitMap);
  });

  return NextResponse.json({
    tree,
    assignedOrgUnitIds: Array.from(allAssignedWithParents),
  });
}
