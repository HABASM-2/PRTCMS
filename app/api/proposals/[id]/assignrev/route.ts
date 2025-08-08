import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const submitProposalId = Number(params.id);
    if (!submitProposalId) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("Received body:", body); // Debug log to check incoming JSON

    const { reviewerIds } = body;

    if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: "No reviewer IDs provided" },
        { status: 400 }
      );
    }

    // Find the latest ProposalVersion for the SubmitProposal
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { submitProposalId },
      orderBy: { versionNumber: "desc" },
    });

    if (!latestVersion) {
      return NextResponse.json(
        { error: "Proposal version not found" },
        { status: 404 }
      );
    }

    const proposalVersionId = latestVersion.id;

    // Find already assigned reviewers for this ProposalVersion
    const existingReviews = await prisma.proposalReview.findMany({
      where: {
        proposalVersionId,
        reviewerId: { in: reviewerIds },
      },
      select: { reviewerId: true },
    });

    const existingReviewerIds = existingReviews.map((r) => r.reviewerId);
    const newReviewerIds = reviewerIds.filter(
      (id: number) => !existingReviewerIds.includes(id)
    );

    if (newReviewerIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Reviewers already assigned",
      });
    }

    // Create new ProposalReview entries with status PENDING
    await prisma.proposalReview.createMany({
      data: newReviewerIds.map((reviewerId: number) => ({
        proposalVersionId,
        reviewerId,
        status: "PENDING",
      })),
    });

    return NextResponse.json({
      success: true,
      message: "Reviewers assigned successfully",
    });
  } catch (error) {
    console.error("Assign reviewers error:", error);
    return NextResponse.json(
      { error: "Failed to assign reviewers" },
      { status: 500 }
    );
  }
}
