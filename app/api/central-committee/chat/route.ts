// /app/api/central-committee/chat/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: fetch messages for a proposal
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const proposalId = url.searchParams.get("proposalId")
      ? Number(url.searchParams.get("proposalId"))
      : undefined;

    if (!proposalId) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.committeeMessage.findMany({
      where: { proposalId },
      include: { sender: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("GET chat messages error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST: send a new message
export async function POST(req: Request) {
  try {
    const { proposalId, senderId, content } = await req.json();

    if (!proposalId || !senderId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.committeeMessage.create({
      data: { proposalId, senderId, content },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("POST chat message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PUT: edit an existing message
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const messageId = url.pathname.split("/").pop();
    const { content, senderId } = await req.json();

    if (!messageId || !content || !senderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.committeeMessage.findUnique({ where: { id: Number(messageId) } });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const updated = await prisma.committeeMessage.update({
      where: { id: Number(messageId) },
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
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const messageId = url.pathname.split("/").pop();
    const { senderId } = await req.json();

    if (!messageId || !senderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.committeeMessage.findUnique({ where: { id: Number(messageId) } });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.committeeMessage.delete({ where: { id: Number(messageId) } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE chat message error:", err);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
