// app/api/projects/route.ts
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

    // Base where clause
    const where: any = {
      submitProposal: {
        submittedById: userId,
      },
    };

    if (statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    // Total count for pagination
    const totalCount = await prisma.project.count({ where });

    // Fetch projects with budgets and tasks
    const projectsRaw = await prisma.project.findMany({
      where,
      include: {
        budgets: true, // projectBudget[]
        tasks: true,   // task[]
        submitProposal: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Compute spent and remaining per project
    // const projects = projectsRaw.map((p) => {
    //   const spent = p.budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    //   const remaining = p.totalBudget - spent;
    //   return {
    //     ...p,
    //     spent,
    //     remaining,
    //   };
    // });

    // Compute spent and remaining per project
    const projects = projectsRaw.map((p) => {
    const spent = p.budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const totalBudget = p.totalBudget ?? 0; // fallback if null
    const remaining = totalBudget - spent;
    return {
        ...p,
        spent,
        remaining,
        totalBudget, // include the safe value
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
