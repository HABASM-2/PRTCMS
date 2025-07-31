import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const { name } = await req.json();

  if (!id || !name) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.orgUnit.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

async function deleteWithChildren(id: number) {
  const children = await prisma.orgUnit.findMany({
    where: { parentId: id },
    select: { id: true },
  });

  for (const child of children) {
    await deleteWithChildren(child.id);
  }

  await prisma.orgUnit.delete({ where: { id } });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  await deleteWithChildren(id);

  return NextResponse.json({ success: true });
}
