import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

// ========== Extract ID ==========
function extractId(req: NextRequest): number | null {
  const idStr = req.nextUrl.pathname.split("/").pop(); // Get last segment
  const id = Number(idStr);
  return isNaN(id) ? null : id;
}

// ========== PUT ==========
export async function PUT(req: NextRequest) {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const { name, description } = body;

  const updated = await prisma.organisation.update({
    where: { id },
    data: { name, description },
  });

  return NextResponse.json(updated);
}

// ========== DELETE ==========
export async function DELETE(req: NextRequest) {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.organisation.delete({ where: { id } });

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2003":
        case "P2014":
          return NextResponse.json(
            {
              error:
                "Organisation is referenced by other records and cannot be deleted.",
            },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            { error: "Organisation not found." },
            { status: 404 }
          );
      }
    }

    console.error("Delete error:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

// ========== PATCH (Status Change + Log) ==========
export async function PATCH(req: NextRequest) {
  const id = extractId(req);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { newStatus, reason } = await req.json();

  if (!["active", "inactive"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!reason || reason.trim() === "") {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const updated = await prisma.organisation.update({
    where: { id },
    data: {
      status: newStatus,
      activityLogs: {
        create: {
          action: newStatus === "active" ? "activated" : "deactivated",
          reason,
          performedById: Number(session.user.id),
        },
      },
    },
  });

  return NextResponse.json(updated);
}
