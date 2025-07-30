import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.role !== "super") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  // TODO: Set session or JWT here — for now, just return success
  return NextResponse.json({ message: "Login successful" });
}
