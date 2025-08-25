// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Count total notices/proposals
    const totalProposals = await prisma.proposalNotice.count();

    // Count active projects
    const activeProjects = await prisma.project.count({
      where: { status: "ONGOING" },
    });

    // Count community service submissions
    const communityServices = await prisma.submitProposal.count();

    // Count total users
    const totalUsers = await prisma.user.count();

    // Count organization units
    const totalOrgUnits = await prisma.orgUnit.count();

    // Count roles
    const totalRoles = await prisma.role.count();

    return NextResponse.json({
      totalProposals,
      activeProjects,
      communityServices,
      totalUsers,
      totalOrgUnits,
      totalRoles,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
