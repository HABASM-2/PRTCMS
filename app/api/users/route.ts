import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      username,
      password,
      organisationId,
      orgUnitIds, // ← from tree selection
      roleId,
      createdById,
    } = body;

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password,
        roleId,
        createdById,
        organisations: {
          connect: { id: organisationId },
        },
      },
    });

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

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    },
    include: {
      organisations: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(users);
}
