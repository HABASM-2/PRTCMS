// /app/api/proposals/finalized/route.ts
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

    // Fetch coordinator with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user || !user.roles.some(r => r.name.toLowerCase() === "coordinator")) {
      return NextResponse.json({ proposals: [], total: 0 });
    }

    const coordinatorRole = user.roles.find(
      r => r.name.toLowerCase() === "coordinator"
    );

    // Coordinator's orgUnits
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });
    const orgUnitIds = userOrgUnits.map(u => u.orgUnitId);

    // Fetch forwarded proposals for coordinator
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
            finalDecision: {
              include: { decidedBy: { select: { fullName: true } } },
            },
            notice: { select: { consideredFor: true } },
          },
        },
        forwardedBy: { select: { fullName: true } },
      },
      orderBy: { forwardedAt: "desc" },
    });

    // Filter only proposals that already have a finalDecision
    let filtered = forwarded.filter(fwd => fwd.submitProposal.finalDecision);

    // Filter by consideredFor based on coordinator’s roles
    const roleNames = user.roles.map(r => r.name.toLowerCase());
    const consideredRolesMap: Record<string, string> = {
      "technology-transfer": "technology-transfer",
      "community-service": "community-service",
      "research-and-publications": "research-and-publications",
    };
    const applicableRoles = roleNames
      .filter(r => consideredRolesMap[r])
      .map(r => consideredRolesMap[r]);

    if (applicableRoles.length > 0) {
      filtered = filtered.filter(fwd =>
        fwd.submitProposal.notice?.consideredFor
          ? applicableRoles.includes(fwd.submitProposal.notice.consideredFor)
          : false
      );
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(fwd =>
        fwd.submitProposal.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    // Format response
    const proposals = paginated.map(fwd => {
      const p = fwd.submitProposal;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        participants: p.participants,
        fileUrl: p.fileUrl,
        submittedBy: p.submittedBy.fullName,
        orgUnit: p.orgUnit.name,
        submittedAt: p.createdAt.toISOString(),
        finalDecision: p.finalDecision
          ? {
              status: p.finalDecision.status,
              reason: p.finalDecision.reason,
              decidedBy: p.finalDecision.decidedBy.fullName,
              decidedAt: p.finalDecision.decidedAt.toISOString(),
            }
          : null,
        forwardedBy: fwd.forwardedBy.fullName,
        forwardedAt: fwd.forwardedAt.toISOString(),
      };
    });

    return NextResponse.json({
      proposals,
      total: filtered.length,
    });
  } catch (err) {
    console.error("❌ Error in finalized proposals API:", err);
    return NextResponse.json(
      { error: "Failed to fetch finalized proposals" },
      { status: 500 }
    );
  }
}
