import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Edit user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = Number(params.id);
  const body = await req.json();
  const {
    fullName,
    username,
    email,
    password,
    roleId,
    organisationId,
    orgUnitIds,
  } = body;

  try {
    // Update main user fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        username,
        email,
        password,
        roleId: roleId || null,
        organisationId,
        orgUnits: {
          set: orgUnitIds?.map((id: number) => ({ id })) || [],
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = Number(params.id);

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
