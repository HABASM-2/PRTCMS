// app/api/notices/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
      orgUnitId,
      expiredAt,
      fileUrl,
    } = body;

    if (!title || !orgUnitId || !expiredAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const notice = await prisma.proposalNotice.create({
      data: {
        title,
        description,
        fileUrl,
        expiredAt: new Date(expiredAt),
        orgUnit: { connect: { id: Number(orgUnitId) } },
        createdBy: { connect: { id: Number(user.id) } },
      },
    });

    return NextResponse.json(notice);
  } catch (error) {
    console.error("Error posting notice:", error);

    // Add detailed message:
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
