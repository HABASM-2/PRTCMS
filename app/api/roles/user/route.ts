import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get("id"));

  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  const allRoles = await prisma.role.findMany({
    select: { id: true, name: true },
  });

  const userRoles = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { id: true } } },
  });

  const userRoleIds = userRoles?.roles.map((r) => r.id) || [];

  return NextResponse.json({ allRoles, userRoleIds });
}
