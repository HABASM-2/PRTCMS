import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, organisationId, parentId } = body;

  if (!name || !organisationId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const newUnit = await prisma.orgUnit.create({
    data: {
      name,
      organisationId,
      parentId: parentId || null,
    },
  });

  return NextResponse.json(newUnit);
}
