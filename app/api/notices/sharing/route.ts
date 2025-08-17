// /api/notices/sharing
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = Number(req.nextUrl.searchParams.get("userId"));
    const search = req.nextUrl.searchParams.get("search") || "";
    const page = Number(req.nextUrl.searchParams.get("page") || 1);
    const pageSize = Number(req.nextUrl.searchParams.get("pageSize") || 10);

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const skip = (page - 1) * pageSize;

    // Fetch user with roles and orgUnits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, UserOrgUnit: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const role = user.roles[0]?.name.toLowerCase();
    const userOrgUnitIds = user.UserOrgUnit.map(u => u.orgUnitId);

    if (!role) return NextResponse.json({ data: [], total: 0 });

    let notices: any[] = [];
    let total = 0;

    if (role === "dean") {
      // Dean: see notices assigned to their orgUnits + children
      const allOrgUnitIds = [...userOrgUnitIds];
      let pointer = 0;
      while (pointer < allOrgUnitIds.length) {
        const children = await prisma.orgUnit.findMany({
          where: { parentId: allOrgUnitIds[pointer] },
          select: { id: true },
        });
        children.forEach(c => {
          if (!allOrgUnitIds.includes(c.id)) allOrgUnitIds.push(c.id);
        });
        pointer++;
      }

      notices = await prisma.proposalNotice.findMany({
        where: {
          orgUnits: { some: { orgUnitId: { in: allOrgUnitIds } } },
          isActive: true,
          title: { contains: search, mode: "insensitive" },
        },
        include: {
          createdBy: true,
          orgUnits: { include: { orgUnit: true } },
          forwards: true, // all forwarded records
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      });

      total = await prisma.proposalNotice.count({
        where: {
          orgUnits: { some: { orgUnitId: { in: allOrgUnitIds } } },
          isActive: true,
          title: { contains: search, mode: "insensitive" },
        },
      });
    } else {
      // Other roles: Coordinator, Head, Staff
      // Fetch notices that were forwarded to users in their orgUnits
      notices = await prisma.proposalNotice.findMany({
        where: {
          forwards: {
            some: {
              orgUnitId: { in: userOrgUnitIds },
            },
          },
          isActive: true,
          title: { contains: search, mode: "insensitive" },
        },
        include: {
          createdBy: true,
          orgUnits: { include: { orgUnit: true } },
          forwards: true,
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      });

      total = await prisma.proposalNotice.count({
        where: {
          forwards: {
            some: {
              orgUnitId: { in: userOrgUnitIds },
            },
          },
          isActive: true,
          title: { contains: search, mode: "insensitive" },
        },
      });
    }

    return NextResponse.json({ data: notices, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
