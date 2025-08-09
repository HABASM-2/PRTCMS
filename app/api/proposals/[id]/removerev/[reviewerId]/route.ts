import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; reviewerId: string } }
) {
  const proposalId = parseInt(params.id);
  const reviewerId = parseInt(params.reviewerId);

  try {
    // Find latest version for this proposal
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { submitProposalId: proposalId },
      orderBy: { versionNumber: "desc" },
    });

    if (!latestVersion) {
      return NextResponse.json(
        { error: "Proposal version not found" },
        { status: 404 }
      );
    }

    // Delete ProposalReview for this version and reviewer
    await prisma.proposalReview.deleteMany({
      where: {
        proposalVersionId: latestVersion.id,
        reviewerId: reviewerId,
      },
    });

    return NextResponse.json({ message: "Reviewer removed successfully" });
  } catch (error) {
    console.error("Error removing reviewer:", error);
    return NextResponse.json(
      { error: "Failed to remove reviewer" },
      { status: 500 }
    );
  }
}
