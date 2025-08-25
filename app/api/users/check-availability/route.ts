// app/api/users/check-availability/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const email = searchParams.get("email");

    if (!username && !email) {
      return NextResponse.json(
        { error: "Username or Email is required" },
        { status: 400 }
      );
    }

    let usernameAvailable: boolean | null = null;
    let emailAvailable: boolean | null = null;

    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      usernameAvailable = !existingUser;
    }

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      emailAvailable = !existingUser;
    }

    return NextResponse.json({ usernameAvailable, emailAvailable });
  } catch (error: any) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
