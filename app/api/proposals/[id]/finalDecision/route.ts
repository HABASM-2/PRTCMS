import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust your prisma import
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submitProposalId = Number(params.id);
    if (!submitProposalId) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const body = await req.json();
    const { decision, reason } = body;

    if (!["ACCEPTED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = Number(session.user.id);

    // Check if decision exists
    const existingDecision = await prisma.finalDecision.findUnique({
      where: { submitProposalId },
    });
    if (existingDecision) {
      return NextResponse.json(
        { error: "Decision already made, cannot update." },
        { status: 400 }
      );
    }

    // Create FinalDecision
    await prisma.finalDecision.create({
      data: {
        submitProposalId,
        status: decision,
        reason,
        decidedById: currentUserId,
      },
    });

    // Fetch latest version
    const submitProposal = await prisma.submitProposal.findUnique({
      where: { id: submitProposalId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { reviews: true },
        },
      },
    });

    if (!submitProposal || submitProposal.versions.length === 0) {
      return NextResponse.json(
        { error: "Proposal or latest version not found" },
        { status: 404 }
      );
    }

    const lastVersion = submitProposal.versions[0];

    // Update latest version type/status
    await prisma.proposalVersion.update({
      where: { id: lastVersion.id },
      data: {
        type: "PROPOSAL",           // keep type as PROPOSAL
        resubmitAllowed: false,     // no resubmission
      },
    });

    // Assign current user as reviewer if not exists
    let review = await prisma.proposalReview.findUnique({
      where: {
        proposalVersionId_reviewerId: {
          proposalVersionId: lastVersion.id,
          reviewerId: currentUserId,
        },
      },
    });

    if (!review) {
      review = await prisma.proposalReview.create({
        data: {
          proposalVersionId: lastVersion.id,
          reviewerId: currentUserId,
          status: decision === "ACCEPTED" ? "ACCEPTED" : "REJECTED",
        },
      });
    } else {
      await prisma.proposalReview.update({
        where: {
          proposalVersionId_reviewerId: {
            proposalVersionId: lastVersion.id,
            reviewerId: currentUserId,
          },
        },
        data: { status: decision === "ACCEPTED" ? "ACCEPTED" : "REJECTED" },
      });
    }

    // Insert system comment for the decision
    await prisma.proposalReviewComment.create({
      data: {
        proposalReviewId: review.id,
        authorId: currentUserId,
        content: `[SYSTEM] Final decision set: ${decision}. Reason: ${reason}`,
      },
    });

    return NextResponse.json({
      message: "Final decision recorded and latest version updated.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to record decision and update latest version" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submitProposalId = Number(params.id);
    if (!submitProposalId) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const proposal = await prisma.submitProposal.findUnique({
      where: { id: submitProposalId },
      include: {
        finalDecision: true,
        versions: {   // add versions if you want to show versions in frontend
          include: {
            reviews: true,
          },
        },
        // add any other nested relations you want here
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}