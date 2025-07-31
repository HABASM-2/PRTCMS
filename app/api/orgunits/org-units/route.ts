import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = Number(req.nextUrl.searchParams.get("id"));
  if (!orgId) {
    return NextResponse.json(
      { error: "Missing organisation ID" },
      { status: 400 }
    );
  }

  // Fetch all units for that organisation
  const units = await prisma.orgUnit.findMany({
    where: { organisationId: orgId },
    orderBy: { name: "asc" },
  });

  // Convert flat list to tree structure
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

  return NextResponse.json(tree);
}
