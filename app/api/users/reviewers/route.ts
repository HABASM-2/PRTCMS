import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = Number(session.user.id);

    // 1. Get all org units assigned to the head
    const assignedOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId: currentUserId },
      select: { orgUnitId: true },
    });

    if (assignedOrgUnits.length === 0) return NextResponse.json([], { status: 200 });

    // 2. Filter only leaf org units (no children)
    const leafOrgUnitIds: number[] = [];
    for (const u of assignedOrgUnits) {
      const hasChildren = await prisma.orgUnit.findFirst({
        where: { parentId: u.orgUnitId },
      });
      if (!hasChildren) leafOrgUnitIds.push(u.orgUnitId);
    }

    if (leafOrgUnitIds.length === 0) return NextResponse.json([], { status: 200 });

    // 3. Find users assigned to these leaf org units
    const reviewers = await prisma.userOrgUnit.findMany({
      where: { 
        orgUnitId: { in: leafOrgUnitIds },
        userId: { not: currentUserId }, // exclude current user
      },
      select: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // 4. Remove duplicates
    const uniqueReviewersMap = new Map<number, typeof reviewers[0]["user"]>();
    reviewers.forEach((r) => {
      uniqueReviewersMap.set(r.user.id, r.user);
    });

    const uniqueReviewers = Array.from(uniqueReviewersMap.values());

    return NextResponse.json(uniqueReviewers);
  } catch (error) {
    console.error("Failed to fetch reviewers", error);
    return NextResponse.json({ error: "Failed to fetch reviewers" }, { status: 500 });
  }
}
