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
    const { title, description, orgUnitId, expiredAt, fileUrl, type, isActive  } = body;

    // Basic validation
    if (!title || !orgUnitId || !expiredAt || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate enum
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notice type" },
        { status: 400 }
      );
    }

    const notice = await prisma.proposalNotice.create({
      data: {
        title,
        description,
        fileUrl,
        expiredAt: new Date(expiredAt),
        type,
        isActive: isActive ?? true,
        orgUnit: { connect: { id: Number(orgUnitId) } },
        createdBy: { connect: { id: Number(user.id) } },
      },
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error("Error posting notice:", error);

    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const type = searchParams.get("type");

  const where: any = {
    title: {
      contains: query,
      mode: "insensitive",
    },
  };

  // Optional filter by type
  if (type && ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
    where.type = type;
  }

  try {
    const [notices, total] = await prisma.$transaction([
      prisma.proposalNotice.findMany({
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { orgUnit: true, createdBy: true },
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
