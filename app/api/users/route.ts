import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const createdById = Number(session.user.id);

    const body = await req.json();
    const {
      fullName,
      email,
      username,
      password,
      organisationId,
      orgUnitIds,
      roleIds, // this is expected to be a multipple role idD
      managerTag,
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        managerTag,
        createdById,

        // ✅ Connect one role by ID
        roles: {
          connect: roleIds?.map((id: number) => ({ id })) ?? [],
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = Number(session.user.id);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const organisationId = searchParams.get("organisationId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const AND: any[] = [
    {
      id: {
        not: currentUserId, // ✅ Filter out current user
      },
    },
  ];

  if (organisationId) {
    const orgUnits = await prisma.orgUnit.findMany({
      where: {
        organisationId: Number(organisationId),
      },
      select: { id: true },
    });

    const orgUnitIds = orgUnits.map((ou) => ou.id);

    AND.push({
      UserOrgUnit: {
        some: {
          orgUnitId: { in: orgUnitIds },
        },
      },
    });
  }

  if (search) {
    AND.push({
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = { AND };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: { // ✅ switched to select so we explicitly include createdById
        id: true,
        fullName: true,
        email: true,
        username: true,
        createdById: true, // ✅ now included
        roles: { select: { id: true, name: true } },
        organisations: { select: { id: true, name: true } },
        UserOrgUnit: {
          select: {
            orgUnit: { select: { id: true, name: true, parentId: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  return NextResponse.json({ users, total });
}