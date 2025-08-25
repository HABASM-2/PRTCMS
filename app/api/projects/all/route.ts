import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "5");
    const statusFilter = searchParams.get("status") || "ALL";

    const userId = Number(session.user.id);
    const roles: string[] = session.user.roles || [];

    const directorRoles = [
      "technology-transfer",
      "community-service",
      "research-and-publications",
    ];

    let where: any = {};

    if (roles.some((r) => directorRoles.includes(r))) {
      where = {
        submitProposal: {
          notice: {
            consideredFor: {
              in: roles.filter((r) => directorRoles.includes(r)),
            },
          },
        },
      };
    } else if (roles.includes("coordinator")) {
      const userOrgUnits = await prisma.userOrgUnit.findMany({
        where: { userId },
        select: { orgUnitId: true },
      });

      const orgUnitIds = userOrgUnits.map((u) => u.orgUnitId);

      if (orgUnitIds.length === 0) {
        return NextResponse.json({
          data: [],
          pagination: { total: 0, page, pageSize, totalPages: 0 },
        });
      }

      where = {
        submitProposal: {
          orgUnitId: { in: orgUnitIds },
        },
      };
    } else {
      where = {
        submitProposal: {
          submittedById: userId,
        },
      };
    }

    if (statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    const totalCount = await prisma.project.count({ where });

    const projectsRaw = await prisma.project.findMany({
      where,
      include: {
        budgets: true,
        tasks: true,
        submitProposal: {
          include: {
            submittedBy: true, // ✅ include Submitted By user
            orgUnit: true,     // ✅ include OrgUnit
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const projects = projectsRaw.map((p) => {
      const spent = p.budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
      const totalBudget = p.totalBudget ?? 0;
      const remaining = totalBudget - spent;

      return {
        ...p,
        spent,
        remaining,
        totalBudget,
        orgUnit: p.submitProposal?.orgUnit
          ? { id: p.submitProposal.orgUnit.id, name: p.submitProposal.orgUnit.name }
          : null,
        submittedBy: p.submitProposal?.submittedBy
          ? {
              id: p.submitProposal.submittedBy.id,
              fullName: p.submitProposal.submittedBy.fullName,
              email: p.submitProposal.submittedBy.email,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: projects,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
