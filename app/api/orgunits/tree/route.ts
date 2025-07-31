import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const orgId = Number(req.nextUrl.searchParams.get("id"));

  if (!orgId)
    return NextResponse.json(
      { error: "Missing organisation ID" },
      { status: 400 }
    );

  const units = await prisma.orgUnit.findMany({
    where: {
      organisationId: orgId,
      parentId: null,
    },
    include: {
      children: {
        include: {
          children: {
            include: { children: true }, // can go deeper
          },
        },
      },
    },
  });

  return NextResponse.json(units);
}
