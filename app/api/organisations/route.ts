// app/api/organisations/route.ts

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// ========== POST ==========
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const organisation = await prisma.organisation.create({
    data: {
      name,
      description,
      createdBy: {
        connect: { id: Number(session.user.id) },
      },
    },
  });

  return NextResponse.json(organisation);
}

// ========== GET ==========
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = 5;

  const [total, organisations] = await Promise.all([
    prisma.organisation.count({
      /* ... */
    }),
    prisma.organisation.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      include: {
        createdBy: {
          select: { fullName: true, id: true },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ organisations, total });
}
