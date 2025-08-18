import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submitProposalId = Number(params.id);
    if (!submitProposalId) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    // Find the latest ProposalVersion
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { submitProposalId },
      orderBy: { versionNumber: "desc" },
    });

    if (!latestVersion) {
      return NextResponse.json({ error: "Proposal version not found" }, { status: 404 });
    }

    // Fetch assigned reviewers for the latest version
    const assignedReviewers = await prisma.proposalReview.findMany({
      where: { proposalVersionId: latestVersion.id },
      include: { reviewer: { select: { id: true, fullName: true, email: true } } },
    });

    const formatted = assignedReviewers.map((r) => r.reviewer);

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch assigned reviewers:", error);
    return NextResponse.json({ error: "Failed to fetch assigned reviewers" }, { status: 500 });
  }
}

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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const submitProposalId = Number(params.id);
    if (!submitProposalId) return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });

    const body = await req.json();
    const { reviewerId, removeFromOrgUnit } = body;
    if (!reviewerId) return NextResponse.json({ error: "Missing reviewer ID" }, { status: 400 });

    // Find the org unit of this proposal
    const proposal = await prisma.submitProposal.findUnique({
      where: { id: submitProposalId },
      select: { orgUnitId: true },
    });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    let proposalVersions;

    if (removeFromOrgUnit) {
      // Remove reviewer from ALL proposals in this orgUnit
      proposalVersions = await prisma.proposalVersion.findMany({
        where: { submitProposal: { orgUnitId: proposal.orgUnitId } },
      });
    } else {
      // Only remove from latest version of current proposal
      const latestVersion = await prisma.proposalVersion.findFirst({
        where: { submitProposalId },
        orderBy: { versionNumber: "desc" },
      });
      if (!latestVersion) return NextResponse.json({ error: "Proposal version not found" }, { status: 404 });
      proposalVersions = [latestVersion];
    }

    // Delete reviewer assignments for all selected versions
    const versionIds = proposalVersions.map((v) => v.id);

    await prisma.proposalReview.deleteMany({
      where: { proposalVersionId: { in: versionIds }, reviewerId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to remove reviewer", err);
    return NextResponse.json({ error: "Failed to remove reviewer" }, { status: 500 });
  }
}