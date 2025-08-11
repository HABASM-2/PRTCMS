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
        isActive: true,
        hidden: false, 
        type: { in: ["CONCEPT_NOTE", "PROPOSAL"] },
        SubmitProposal: {
          none: { submittedById: userId },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        expiredAt: true,
        fileUrl: true,
        orgUnitId: true,
        type: true,
        orgUnit: {
          select: {
            name: true,
            organisation: { select: { name: true } },
          },
        },
      },
    });

    const formatted = availableNotices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      description: notice.description,
      expiredAt: notice.expiredAt,
      fileUrl: notice.fileUrl,
      orgUnitId: notice.orgUnitId,
      type: notice.type, 
      orgUnitName: notice.orgUnit.name,
      orgName: notice.orgUnit.organisation.name,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching available notices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
