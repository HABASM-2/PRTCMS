// /api/notices/available-for-submission/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get("userId"));

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const now = new Date();

    const availableNotices = await prisma.proposalNotice.findMany({
      where: {
        expiredAt: { gt: now },
        SubmitProposal: {
          none: { submittedById: userId },
        },
      },
      select: {
        id: true,
        title: true,
        orgUnitId: true,
        orgUnit: {
          select: {
            name: true, // orgUnit name
            organisation: {
              select: {
                name: true, // organisation name
              },
            },
          },
        },
      },
    });

    // Map to flatten the structure with orgUnitName and orgName at root level
    const formatted = availableNotices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      orgUnitId: notice.orgUnitId,
      orgUnitName: notice.orgUnit.name,
      orgName: notice.orgUnit.organisation.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching available notices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
