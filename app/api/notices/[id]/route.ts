import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["JUST_NOTICE", "CONCEPT_NOTE", "PROPOSAL"] as const;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);

  try {
    const body = await req.json();
    const {
      title,
      description,
      orgUnitIds = [],
      expiredAt,
      fileUrl,
      type,
      isActive,
    } = body;

    // Basic validation
    if (!title || !expiredAt || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid notice type" },
        { status: 400 }
      );
    }

    // Verify orgUnits exist
    const validOrgUnits = await prisma.orgUnit.findMany({
      where: { id: { in: orgUnitIds } },
      select: { id: true },
    });

    const assignOrgUnitIds = validOrgUnits.map((ou) => ou.id);

    // Update the ProposalNotice
    const updatedNotice = await prisma.proposalNotice.update({
      where: { id },
      data: {
        title,
        description,
        fileUrl,
        expiredAt: new Date(expiredAt),
        type,
        isActive,
        orgUnits: {
          // Clear old relations and connect new ones
          deleteMany: {},
          create: assignOrgUnitIds.map((ouId) => ({
            orgUnit: { connect: { id: ouId } },
          })),
        },
      },
      include: {
        orgUnits: { include: { orgUnit: true } },
        createdBy: true,
      },
    });

    return NextResponse.json(updatedNotice);
  } catch (err: any) {
    console.error("Error updating notice:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  try {
    await prisma.proposalNotice.update({
      where: { id },
      data: { hidden: true },
    });
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Error deleting notice:", err);
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}