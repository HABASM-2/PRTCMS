// /app/api/proposals/granter/route.ts
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

    // Fetch user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      return NextResponse.json({ proposals: [], total: 0 });
    }

    // Get all role names in lowercase
    const userRoleNames = user.roles.map((r) => r.name.toLowerCase());

    // Map allowed consideredFor values
    const allowedConsideredFor = [
      "technology-transfer",
      "community-service",
      "research-and-publications",
    ];

    // Intersect user roles with allowed consideredFor
    const userConsideredForRoles = userRoleNames.filter((r) =>
      allowedConsideredFor.includes(r)
    );

    if (userConsideredForRoles.length === 0) {
      return NextResponse.json({ proposals: [], total: 0 });
    }

    // Fetch proposals with finalDecision = ACCEPTED and notice.consideredFor in userConsideredForRoles
    let proposalsRaw = await prisma.submitProposal.findMany({
      where: {
        finalDecision: { status: "ACCEPTED" },
        notice: { consideredFor: { in: userConsideredForRoles } },
      },
      include: {
        submittedBy: { select: { fullName: true } },
        orgUnit: { select: { name: true } },
        finalDecision: {
          include: { decidedBy: { select: { fullName: true } } },
        },
        notice: { select: { consideredFor: true } },
        DirectorApproval: {
          include: { director: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by search
    if (search) {
      proposalsRaw = proposalsRaw.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = proposalsRaw.slice(start, end);

    // Format response
    const proposals = paginated.map((p) => ({
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
      directorApprovals: p.DirectorApproval.map((d) => ({
        id: d.id,
        status: d.status,
        reason: d.reason,
        considerations: d.considerations,
        signedFileUrl: d.signedFileUrl,
        director: d.director.fullName,
        approvedAt: d.approvedAt ? d.approvedAt.toISOString() : null,
        createdAt: d.createdAt.toISOString(),
      })),
      consideredFor: p.notice?.consideredFor ?? null,
    }));

    return NextResponse.json({
      proposals,
      total: proposalsRaw.length,
    });
  } catch (err) {
    console.error("❌ Error in finalized proposals API:", err);
    return NextResponse.json(
      { error: "Failed to fetch finalized proposals" },
      { status: 500 }
    );
  }
}
