import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Define a type for the org unit with children
type OrgUnitWithChildren = {
  id: number;
  name: string;
  organisationId: number;
  parentId: number | null;
  // add other fields from orgUnit if needed
  children: OrgUnitWithChildren[];
};

// Recursive function to fetch children
async function fetchTree(
  orgId: number,
  parentId: number | null = null
): Promise<OrgUnitWithChildren[]> {
  const units = await prisma.orgUnit.findMany({
    where: {
      organisationId: orgId,
      parentId: parentId,
    },
    orderBy: {
      name: "asc", // optional: sort alphabetically
    },
  });

  // Recursively fetch children for each unit
  const withChildren: OrgUnitWithChildren[] = await Promise.all(
    units.map(async (unit) => {
      const children = await fetchTree(orgId, unit.id);
      return {
        ...unit,
        children,
      };
    })
  );

  return withChildren;
}

export async function GET(req: NextRequest) {
  const orgId = Number(req.nextUrl.searchParams.get("id"));

  if (!orgId) {
    return NextResponse.json(
      { error: "Missing organisation ID" },
      { status: 400 }
    );
  }

  const tree = await fetchTree(orgId);
  return NextResponse.json(tree);
}
