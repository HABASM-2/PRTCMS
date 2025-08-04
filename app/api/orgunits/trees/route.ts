// /api/orgunits/tree/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("organisationId");
  const userId = req.nextUrl.searchParams.get("userId");

  // Fetch organisation (optional)
  let organisation = null;
  if (orgId) {
    organisation = await prisma.organisation.findUnique({
      where: { id: Number(orgId) },
    });

    if (!organisation) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }
  }

  // Fetch all org units
  const units = await prisma.orgUnit.findMany({
    where: orgId ? { organisationId: Number(orgId) } : {},
    orderBy: { name: "asc" },
  });

  // Assigned units
  let assignedOrgUnitIds: number[] = [];
  if (userId) {
    const assigned = await prisma.userOrgUnit.findMany({
      where: { userId: Number(userId) },
      select: { orgUnitId: true },
    });
    assignedOrgUnitIds = assigned.map((a) => a.orgUnitId);
  }

  // Build map
  const unitMap = new Map<number, any>();
  units.forEach((unit) => {
    unitMap.set(unit.id, { ...unit, children: [] });
  });

  // Link children to parents
  units.forEach((unit) => {
    if (unit.parentId && unitMap.has(unit.parentId)) {
      unitMap.get(unit.parentId).children.push(unitMap.get(unit.id));
    }
  });

  // Top-level units (no parent)
  const topLevelUnits = units
    .filter((u) => u.parentId === null)
    .map((u) => unitMap.get(u.id));

  // Build tree
  let tree = topLevelUnits;

  // Wrap with organisation root if org is defined
  if (organisation) {
    tree = [
      {
        id: organisation.id,
        name: organisation.name,
        parentId: null,
        organisationId: organisation.id,
        children: topLevelUnits,
      },
    ];
  }

  return NextResponse.json({
    tree,
    assignedOrgUnitIds,
  });
}
