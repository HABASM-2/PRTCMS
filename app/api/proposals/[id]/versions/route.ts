// /app/api/proposals/[id]/versions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposalId = parseInt(params.id, 10);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const proposal = await prisma.submitProposal.findUnique({
      where: { id: proposalId },
      include: {
        notice: {
          select: { type: true },
        },
        submittedBy: { select: { fullName: true } },
        orgUnit: { select: { name: true } },
        versions: {
          orderBy: { versionNumber: "asc" },
          include: {
            reviews: {
              include: {
                reviewer: { select: { id: true, fullName: true } },
                ProposalReviewComment: {
                  include: {
                    author: { select: { id: true, fullName: true } },
                  },
                  orderBy: { createdAt: "asc" },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const formatted = {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      participants: proposal.participants,
      fileUrl: proposal.fileUrl,
      submittedBy: proposal.submittedBy.fullName,
      orgUnit: proposal.orgUnit.name,
      submittedAt: proposal.createdAt.toISOString(),
      proposalType: proposal.notice?.type ?? "JUST_NOTICE",
      versions: proposal.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        title: v.title,
        description: v.description,
        participants: v.participants,
        fileUrl: v.fileUrl,
        createdAt: v.createdAt.toISOString(),
        resubmitAllowed: v.resubmitAllowed,
        versionType: v.type,
        reviews: v.reviews.map((r) => ({
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer.fullName,
          status: r.status,
          // You can keep comments here if needed, but main comments come from ProposalReviewComment
          commentsDetails: r.ProposalReviewComment.map((c) => ({
            id: c.id,
            authorName: c.author.fullName,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
          })),
        })),
      })),
    };

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch proposal versions" },
      { status: 500 }
    );
  }
}
