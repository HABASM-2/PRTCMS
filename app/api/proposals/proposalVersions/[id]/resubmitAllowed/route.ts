import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing id param" }, { status: 400 });
  }

  const body = await request.json();
  const { resubmitAllowed } = body;

  if (typeof resubmitAllowed !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid resubmitAllowed boolean" },
      { status: 400 }
    );
  }

  try {
    const updatedVersion = await prisma.proposalVersion.update({
      where: { id: Number(id) },
      data: { resubmitAllowed },
    });
    return NextResponse.json({ updatedVersion });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update proposal version" },
      { status: 500 }
    );
  }
}
