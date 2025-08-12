import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalReviewId = Number(searchParams.get("proposalReviewId"));
    if (!proposalReviewId) {
      return NextResponse.json({ error: "proposalReviewId required" }, { status: 400 });
    }

    const comments = await prisma.proposalReviewComment.findMany({
      where: { proposalReviewId },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({
      comments: comments.map(c => ({
        id: c.id,
        proposalReviewId: c.proposalReviewId,
        authorId: c.authorId,
        authorName: c.author.fullName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalReviewId, authorId, content } = body;

    if (!proposalReviewId || !authorId || !content) {
      return NextResponse.json({ error: "proposalReviewId, authorId, content required" }, { status: 400 });
    }

    const comment = await prisma.proposalReviewComment.create({
      data: { proposalReviewId, authorId, content },
    });

    return NextResponse.json({ message: "Comment added", commentId: comment.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
