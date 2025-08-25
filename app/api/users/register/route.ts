// /app/api/users/register/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, username, password, orgUnitId } = await req.json();

    // Check if username/email exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        isApproved: false,
        UserOrgUnit: {
          create: { orgUnitId },
        },
      },
    });

    return NextResponse.json({ message: "Registration submitted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
