import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = Number(params.id);
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true, UserOrgUnit: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = user.roles[0]?.name.toLowerCase();
    const validRoles = ["dean", "coordinator", "head"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Not allowed to forward" },
        { status: 403 }
      );
    }

    const orgUnitIds = user.UserOrgUnit.map((u) => u.orgUnitId);
    if (!orgUnitIds.length) {
      return NextResponse.json({ error: "No orgUnits assigned" }, { status: 400 });
    }

    let toCreate: any[] = [];

    if (role === "coordinator") {
      // coordinator forwards to heads in same orgUnit
      const targetUsers = await prisma.user.findMany({
        where: {
          roles: { some: { name: "head" } },
          UserOrgUnit: { some: { orgUnitId: { in: orgUnitIds } } },
        },
        select: { id: true },
      });

      const existingForwards = await prisma.proposalNoticeForward.findMany({
        where: {
          proposalNoticeId: noticeId,
          orgUnitId: { in: orgUnitIds },
          userId: { in: targetUsers.map((u) => u.id) },
        },
      });

      toCreate = targetUsers
        .filter((u) => !existingForwards.some((f) => f.userId === u.id))
        .map((u) => ({
          proposalNoticeId: noticeId,
          orgUnitId: orgUnitIds[0],
          userId: u.id,
          forwardedById: userId,
        }));
    } else {
      // dean or head just record themselves
      const existingForwards = await prisma.proposalNoticeForward.findMany({
        where: {
          proposalNoticeId: noticeId,
          orgUnitId: { in: orgUnitIds },
          userId: userId,
        },
      });

      toCreate = orgUnitIds
        .filter((id) => !existingForwards.some((f) => f.orgUnitId === id))
        .map((id) => ({
          proposalNoticeId: noticeId,
          orgUnitId: id,
          userId: userId,
          forwardedById: userId,
        }));
    }

    if (!toCreate.length) {
      return NextResponse.json({ message: "Already forwarded" });
    }

    await prisma.proposalNoticeForward.createMany({ data: toCreate });

    return NextResponse.json({
      message: "Forwarded successfully",
      role,
    });
  } catch (err) {
    console.error("Forward API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
