// /app/api/org-units/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type OrgUnitWithChildren = {
  id: number;
  name: string;
  organisationId: number;
  parentId: number | null;
  children: OrgUnitWithChildren[];
};

// Recursive function to build tree
async function fetchTree(parentId: number | null = null): Promise<OrgUnitWithChildren[]> {
  const units = await prisma.orgUnit.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
  });

  return Promise.all(
    units.map(async (unit) => ({
      ...unit,
      children: await fetchTree(unit.id),
    }))
  );
}

export async function GET(req: NextRequest) {
  try {
    const tree = await fetchTree();
    return NextResponse.json(tree);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch OrgUnits" }, { status: 500 });
  }
}
