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

// POST: send a new message with optional fileURL
export async function POST(req: Request) {
  try {
    const { proposalId, senderId, content, fileURL } = await req.json();

    if (!proposalId || !senderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!content && !fileURL) {
      return NextResponse.json({ error: "Message must have content or file" }, { status: 400 });
    }

    const message = await prisma.committeeMessage.create({
      data: { proposalId, senderId, content, fileURL },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("POST chat message error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
