// app/api/check-users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const count = await prisma.user.count();
  return NextResponse.json({ hasUsers: count > 0 });
}
