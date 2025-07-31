// import { prisma } from "@/lib/prisma";
// import { NextResponse } from "next/server";

// export async function PUT(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const body = await req.json();
//   const { name, description } = body;

//   const updated = await prisma.organisation.update({
//     where: { id: Number(params.id) },
//     data: { name, description },
//   });

//   return NextResponse.json(updated);
// }

// export async function DELETE(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   await prisma.organisation.delete({
//     where: { id: Number(params.id) },
//   });

//   return NextResponse.json({ status: "deleted" });
// }

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ========== PUT ==========
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { name, description } = body;

  const updated = await prisma.organisation.update({
    where: { id: Number(params.id) },
    data: { name, description },
  });

  return NextResponse.json(updated);
}

// ========== DELETE ==========
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.organisation.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ status: "deleted" });
}

// ========== PATCH (Status Change with Reason & Log) ==========
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { newStatus, reason } = await req.json();

  if (!["active", "inactive"].includes(newStatus)) {
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  }

  if (!reason || reason.trim().length === 0) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const organisation = await prisma.organisation.update({
    where: { id: Number(params.id) },
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

  return NextResponse.json(organisation);
}
