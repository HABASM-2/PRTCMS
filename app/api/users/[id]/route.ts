import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // ← import bcrypt

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
    roleIds,
    organisationIds,
    orgUnitIds,
  } = body;

  try {
    let hashedPassword: string | undefined = undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // ← hash the password
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        username,
        email,
        ...(hashedPassword && { password: hashedPassword }), // ← set only if present

        roles: {
          set: roleIds?.map((id: number) => ({ id })) ?? [],
        },

        organisations: {
          set: organisationIds?.map((id: number) => ({ id })) ?? [],
        },

        UserOrgUnit: {
          deleteMany: {},
          create: orgUnitIds?.map((orgUnitId: number) => ({
            orgUnit: { connect: { id: orgUnitId } },
          })) ?? [],
        },
      },
      include: {
        roles: true,
        organisations: true,
        UserOrgUnit: {
          include: { orgUnit: true },
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
    // First delete user-related org units
    await prisma.userOrgUnit.deleteMany({
      where: { userId },
    });

    // Then delete the user
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
