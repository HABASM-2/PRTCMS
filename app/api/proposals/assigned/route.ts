// /app/api/proposals/assigned/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string, 10);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Fetch coordinator user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user || !user.roles.some(r => r.name.toLowerCase() === "coordinator")) {
      return NextResponse.json({ proposals: [], total: 0 });
    }

    // Get coordinator role id
    const coordinatorRole = user.roles.find(r => r.name.toLowerCase() === "coordinator");

    // Get coordinator's OrgUnits
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    const orgUnitIds = userOrgUnits.map(u => u.orgUnitId);

    // Fetch forwarded proposals for coordinator in assigned OrgUnits
    const forwarded = await prisma.proposalForwarding.findMany({
      where: {
        forwardedToRoleId: coordinatorRole!.id,
        forwardedToOrgUnitId: { in: orgUnitIds },
      },
      include: {
        submitProposal: {
          include: {
            submittedBy: { select: { fullName: true } },
            orgUnit: { select: { name: true } },
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1,
              include: {
                reviews: {
                  include: {
                    reviewer: { select: { id: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
        forwardedBy: { select: { fullName: true } },
      },
      orderBy: { forwardedAt: "desc" },
    });

    // Filter by search
    const filtered = forwarded.filter(fwd =>
      !search || fwd.submitProposal.title.toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    // Format response
    const proposals = paginated.map(fwd => {
      const p = fwd.submitProposal;
      const latestVersion = p.versions[0];
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        participants: p.participants,
        fileUrl: p.fileUrl,
        submittedBy: p.submittedBy.fullName,
        orgUnit: p.orgUnit.name,
        submittedAt: p.createdAt.toISOString(),
        reviewers: latestVersion?.reviews.map(r => ({
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer.fullName,
          status: r.status,
          comments: r.comments,
        })) || [],
        forwardedBy: fwd.forwardedBy.fullName,
        forwardedAt: fwd.forwardedAt.toISOString(),
        status: fwd.status,
        remarks: fwd.remarks,
      };
    });

    return NextResponse.json({
      proposals,
      total: filtered.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
