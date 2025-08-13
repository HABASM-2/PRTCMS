// app/api/orgunits/org-units/user-orgunit-tree/all/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const userId = Number(req.headers.get("x-user-id"));
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Fetch all orgUnits
    const orgUnits = await prisma.orgUnit.findMany({
      include: { children: true, organisation: true },
      orderBy: { name: "asc" },
    });

    // Fetch assigned units for the user
    const assignedUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
    });
    const assignedOrgUnitIds = assignedUnits.map((u) => u.orgUnitId);

    // Build a map of orgUnits by id
    const unitMap = new Map<number, any>();
    orgUnits.forEach((unit) =>
      unitMap.set(unit.id, { ...unit, children: [] })
    );

    // Attach children to parents
    orgUnits.forEach((unit) => {
      if (unit.parentId && unitMap.has(unit.parentId)) {
        unitMap.get(unit.parentId).children.push(unitMap.get(unit.id));
      }
    });

    // Build organisation trees and include organisationId
    const organisations = await prisma.organisation.findMany({
      orderBy: { name: "asc" },
    });

    const orgTree = organisations.map((org) => {
      const units = orgUnits
        .filter((u) => u.organisationId === org.id && !u.parentId)
        .map((u) => unitMap.get(u.id));

      return {
        id: org.id,
        name: org.name,
        organisationId: org.id, // <-- add organisationId
        children: units,
      };
    });

    return NextResponse.json({ tree: orgTree, assignedOrgUnitIds });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch org unit tree" },
      { status: 500 }
    );
  }
}
