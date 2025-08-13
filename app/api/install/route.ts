// app/api/install/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_ROLES = [
  "super",
  "admin",
  "org-manager",
  "coordinator",
  "head",
  "dean",
  "user",
  "vice",
  "director",
  "chair",
  "user-manager",
];

export async function POST(req: Request) {
  try {
    const { fullName, email, username, password, role } = await req.json();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // 2. Insert default roles if they don't exist
    for (const r of DEFAULT_ROLES) {
      await prisma.role.upsert({
        where: { name: r },
        update: {}, // do nothing if exists
        create: { name: r },
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Find the role for the super user
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { message: "Super user role not found" },
        { status: 500 }
      );
    }

    // 5. Create super user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        roles: {
          connect: { id: roleRecord.id },
        },
        createdById: null, // first super user has no creator
      },
      include: { roles: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
