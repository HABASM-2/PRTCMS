import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get("userId"));
  if (!userId) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  try {
    const now = new Date();

    // 1. Get user's orgUnit IDs
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    const userOrgUnitIds = userOrgUnits.map((u) => u.orgUnitId);
    if (userOrgUnitIds.length === 0) return NextResponse.json([]);

    // 2. Get HEAD user IDs in the same orgUnits
    const headUsers = await prisma.user.findMany({
      where: {
        roles: { some: { name: "head" } },
        UserOrgUnit: { some: { orgUnitId: { in: userOrgUnitIds } } },
      },
      select: { id: true },
    });
    const headUserIds = headUsers.map((u) => u.id);
    if (headUserIds.length === 0) return NextResponse.json([]);

    // 3. Fetch notices
    const availableNotices = await prisma.proposalNotice.findMany({
      where: {
        isActive: true,
        hidden: false,
        expiredAt: { gt: now },
        type: { in: ["CONCEPT_NOTE", "PROPOSAL"] },
        SubmitProposal: { none: { submittedById: userId } },
        forwards: {
          some: {
            orgUnitId: { in: userOrgUnitIds },
            forwardedById: { in: headUserIds },
          },
        },
      },
      include: {
        orgUnits: {
          include: {
            orgUnit: {
              select: {
                id: true,
                name: true,
                organisation: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // 4. Format for frontend
    const formatted = availableNotices.map((notice) => {
      const firstOrgUnit = notice.orgUnits[0]?.orgUnit;
      return {
        id: notice.id,
        title: notice.title,
        description: notice.description,
        expiredAt: notice.expiredAt,
        fileUrl: notice.fileUrl,
        orgUnitId: firstOrgUnit?.id || null,
        type: notice.type,
        orgUnitName: firstOrgUnit?.name || "",
        orgName: firstOrgUnit?.organisation?.name || "",
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Error fetching available notices:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
