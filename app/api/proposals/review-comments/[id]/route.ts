import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { content, authorId } = body;

    if (!id || !content || !authorId) {
      return NextResponse.json({ error: "id, content, authorId required" }, { status: 400 });
    }

    // Verify author ownership before update
    const comment = await prisma.proposalReviewComment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.authorId !== authorId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.proposalReviewComment.update({
      where: { id },
      data: { content, updatedAt: new Date() },
    });

    return NextResponse.json({ message: "Comment updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const { authorId } = await request.json();

    if (!id || !authorId) {
      return NextResponse.json({ error: "id and authorId required" }, { status: 400 });
    }

    const comment = await prisma.proposalReviewComment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    if (comment.authorId !== authorId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.proposalReviewComment.delete({ where: { id } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
