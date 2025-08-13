import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ALLOWED_TYPES = ["JUST_NOTICE", "CONCEPT_NOTE", "PROPOSAL"] as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      orgUnitIds = [],
      expiredAt,
      fileUrl,
      type,
      consideredFor,
      isActive,
      organisationId, // required: must pass the org
    } = body;

    // Validation
    if (!title || !expiredAt || !type || !organisationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notice type" },
        { status: 400 }
      );
    }

    // Fetch all org units if none selected
    let assignOrgUnitIds: number[] = [];
    if (orgUnitIds.length > 0) {
      // Verify selected org units exist
      const validOrgUnits = await prisma.orgUnit.findMany({
        where: {
          id: { in: orgUnitIds },
          organisationId,
        },
        select: { id: true },
      });

      if (validOrgUnits.length === 0) {
        return NextResponse.json(
          { error: "Selected org units not found" },
          { status: 400 }
        );
      }

      assignOrgUnitIds = validOrgUnits.map((ou) => ou.id);
    } else {
      // Fetch all units for this organisation
      const allOrgUnits = await prisma.orgUnit.findMany({
        where: { organisationId },
        select: { id: true },
      });

      if (allOrgUnits.length === 0) {
        return NextResponse.json(
          { error: "No org units found for this organisation" },
          { status: 500 }
        );
      }

      assignOrgUnitIds = allOrgUnits.map((ou) => ou.id);
    }

    // Remove duplicates just in case
    assignOrgUnitIds = Array.from(new Set(assignOrgUnitIds));

    // Create ProposalNotice
    const notice = await prisma.proposalNotice.create({
      data: {
        title,
        description,
        fileUrl,
        expiredAt: new Date(expiredAt),
        type,
        consideredFor,
        isActive: isActive ?? true,
        createdBy: { connect: { id: Number(user.id) } },

        // Many-to-many relation only
        orgUnits: {
          create: assignOrgUnitIds.map((id) => ({
            orgUnit: { connect: { id } },
          })),
        },
      },
      include: {
        orgUnits: { include: { orgUnit: true } },
        createdBy: true,
      },
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error("Error posting notice:", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const type = searchParams.get("type");
  const userId = Number(req.headers.get("x-user-id") || 0);

  const where: any = {
    hidden: false,
    title: {
      contains: query,
      mode: "insensitive",
    },
  };

  // Optional filter by type
  if (type && ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
    where.type = type;
  }

  // If user ID is provided → filter by user's orgUnits (and their children)
  if (userId) {
    // Get all assigned orgUnits for user
    const assignedUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });

    const assignedIds = assignedUnits.map(u => u.orgUnitId);

    // Get all descendant orgUnit IDs too
    const getDescendants = async (ids: number[]): Promise<number[]> => {
      const children = await prisma.orgUnit.findMany({
        where: { parentId: { in: ids } },
        select: { id: true },
      });
      if (children.length === 0) return [];
      const childIds = children.map(c => c.id);
      return [...childIds, ...(await getDescendants(childIds))];
    };

    const allUnitIds = Array.from(
      new Set([...assignedIds, ...(await getDescendants(assignedIds))])
    );

    // Filter ProposalNotice through join table
    where.orgUnits = {
      some: {
        orgUnitId: { in: allUnitIds },
      },
    };
  }

  try {
    const [notices, total] = await prisma.$transaction([
      prisma.proposalNotice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          orgUnits: { include: { orgUnit: true } },
          createdBy: true,
        },
      }),
      prisma.proposalNotice.count({ where }),
    ]);

    return NextResponse.json({ notices, total });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}