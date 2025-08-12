import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = Number(session.user.id);

    const proposalId = parseInt(params.id, 10);
    if (!proposalId) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const { newType, comment } = await req.json();
    if (!newType) {
      return NextResponse.json({ error: "New type is required" }, { status: 400 });
    }

    // Fetch SubmitProposal with latest ProposalVersion
    const submitProposal = await prisma.submitProposal.findUnique({
      where: { id: proposalId },
      include: {
        notice: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!submitProposal) {
      return NextResponse.json({ error: "SubmitProposal not found" }, { status: 404 });
    }

    const lastVersion = submitProposal.versions[0];
    if (!lastVersion) {
      return NextResponse.json(
        { error: "No versions found for this proposal" },
        { status: 404 }
      );
    }

    // Update ProposalNotice.type
    await prisma.proposalNotice.update({
      where: { id: submitProposal.noticeId },
      data: { type: newType },
    });

    // Find ProposalReview for current user & latest version
    const proposalReview = await prisma.proposalReview.findUnique({
      where: {
        proposalVersionId_reviewerId: {
          proposalVersionId: lastVersion.id,
          reviewerId: currentUserId,
        },
      },
    });

    if (!proposalReview) {
      return NextResponse.json(
        { error: "No review found for current user on latest version" },
        { status: 404 }
      );
    }

    // Update review status to NEEDS_MODIFICATION
    await prisma.proposalReview.update({
      where: { id: proposalReview.id },
      data: {
        status: "NEEDS_MODIFICATION",
      },
    });

    // Create a new ProposalReviewComment
    await prisma.proposalReviewComment.create({
      data: {
        proposalReviewId: proposalReview.id,
        authorId: currentUserId,
        content: comment || "Status changed due to proposal type update",
      },
    });

    return NextResponse.json({
      message: "Proposal type updated, review status set to NEEDS_MODIFICATION, comment recorded",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update type and add comment" },
      { status: 500 }
    );
  }
}
