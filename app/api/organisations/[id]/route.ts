import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { name, description } = body;

  const updated = await prisma.organisation.update({
    where: { id: Number(params.id) },
    data: { name, description },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.organisation.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ status: "deleted" });
}
