import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: { id: string };
}

// PUT: edit a message
export async function PUT(req: Request, { params }: Params) {
  try {
    const messageId = Number(params.id);
    const { content, senderId } = await req.json();

    if (!content || !senderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.committeeMessage.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const updated = await prisma.committeeMessage.update({
      where: { id: messageId },
      data: { content },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    return NextResponse.json({ message: updated });
  } catch (err) {
    console.error("PUT chat message error:", err);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// DELETE: remove a message
export async function DELETE(req: Request, { params }: Params) {
  try {
    const messageId = Number(params.id);
    const { senderId } = await req.json();

    if (!senderId) return NextResponse.json({ error: "Missing senderId" }, { status: 400 });

    const message = await prisma.committeeMessage.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.committeeMessage.delete({ where: { id: messageId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE chat message error:", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
