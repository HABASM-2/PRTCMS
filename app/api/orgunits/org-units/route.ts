import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = Number(req.nextUrl.searchParams.get("id"));
  const userId = Number(req.nextUrl.searchParams.get("userId"));

  if (!orgId) {
    return NextResponse.json({ error: "Missing organisation ID" }, { status: 400 });
  }

  const organisation = await prisma.organisation.findUnique({
    where: { id: orgId },
  });

  if (!organisation) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  const units = await prisma.orgUnit.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
  });

  // Create a map of id => unit
  const unitMap = new Map<number, any>();
  units.forEach((unit) => {
    unitMap.set(unit.id, { ...unit, children: [] });
  });

  // Link children to their parents
  units.forEach((unit) => {
    if (unit.parentId && unitMap.has(unit.parentId)) {
      unitMap.get(unit.parentId).children.push(unitMap.get(unit.id));
    }
  });

  // Top-level units (those whose parent is null)
  const topLevelUnits = units.filter((unit) => unit.parentId === null).map((unit) => unitMap.get(unit.id));

  // Final tree
  const tree = [
    {
      id: organisation.id,
      name: organisation.name,
      parentId: null,
      organisationId: organisation.id,
      children: topLevelUnits,
    },
  ];

  // Assigned unit IDs
  let assignedOrgUnitIds: number[] = [];
  if (userId) {
    const assignments = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    assignedOrgUnitIds = assignments.map((a) => a.orgUnitId);
  }

  return NextResponse.json({
    tree,
    assignedOrgUnitIds,
  });
}
