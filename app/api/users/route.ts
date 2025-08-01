import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";
import { Loader2 } from "lucide-react";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      username,
      password,
      organisationId,
      orgUnitIds,
      roleId, // this is expected to be a single role ID
      createdById,
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        createdById,

        // ✅ Connect one role by ID
        roles: {
          connect: roleId ? [{ id: roleId }] : [],
        },

        // ✅ Connect organisation
        organisations: {
          connect: { id: organisationId },
        },
      },
    });

    // ✅ Insert org units (many-to-many via join table)
    if (orgUnitIds?.length > 0) {
      await prisma.userOrgUnit.createMany({
        data: orgUnitIds.map((orgUnitId: number) => ({
          userId: user.id,
          orgUnitId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const organisationId = searchParams.get("organisationId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const AND: any[] = [];

  // Step 1: Filter users by organisation (direct or via org units)
  if (organisationId) {
    // Get all OrgUnits under the organisation
    const orgUnits = await prisma.orgUnit.findMany({
      where: {
        organisationId: Number(organisationId),
      },
      select: { id: true },
    });

    const orgUnitIds = orgUnits.map((ou) => ou.id);

    // Match users linked to these OrgUnits
    AND.push({
      UserOrgUnit: {
        some: {
          orgUnitId: { in: orgUnitIds },
        },
      },
    });
  }

  // Step 2: Add search logic if provided
  if (search) {
    AND.push({
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = AND.length > 0 ? { AND } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      include: {
        roles: { select: { id: true, name: true } },
        organisations: { select: { id: true, name: true } },
        UserOrgUnit: {
          include: {
            orgUnit: { select: { id: true, name: true, parentId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return NextResponse.json({ users, total });
}