import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orgs = await prisma.organisation.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(orgs);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load organisations" },
      { status: 500 }
    );
  }
}
