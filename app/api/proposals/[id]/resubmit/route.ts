import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ReqBody {
  title: string;
  description?: string;
  participants: string[];
  fileUrl?: string;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submitProposalId = Number(params.id);
    if (isNaN(submitProposalId)) {
      return NextResponse.json(
        { error: "Invalid proposal ID" },
        { status: 400 }
      );
    }

    const body: ReqBody = await request.json();
    const { title, description, participants, fileUrl } = body;

    if (!title || !participants || participants.length === 0) {
      return NextResponse.json(
        { error: "Title and participants are required" },
        { status: 400 }
      );
    }

    // Find the submit proposal to ensure it exists
    const existingSubmitProposal = await prisma.submitProposal.findUnique({
      where: { id: submitProposalId },
      include: { versions: true },
    });

    if (!existingSubmitProposal) {
      return NextResponse.json(
        { error: "SubmitProposal not found" },
        { status: 404 }
      );
    }

    // Determine next version number
    const latestVersionNumber =
      existingSubmitProposal.versions.reduce(
        (max, v) => (v.versionNumber > max ? v.versionNumber : max),
        0
      ) || 0;
    const nextVersionNumber = latestVersionNumber + 1;

    // Copy latest version's reviewers to new version (default status: PENDING)
    const latestVersion =
      existingSubmitProposal.versions.reduce(
        (max, v) => (v.versionNumber > max.versionNumber ? v : max),
        existingSubmitProposal.versions[0]
      );

    // Create new ProposalVersion linked to the SubmitProposal
    const newVersion = await prisma.proposalVersion.create({
      data: {
        submitProposalId,
        versionNumber: nextVersionNumber,
        title,
        description,
        participants,
        fileUrl,
        type: latestVersion?.type ?? "CONCEPT_NOTE", // ✅ copy type from latest
        resubmitAllowed: latestVersion?.resubmitAllowed ?? false, // optional: copy flag too
      },
    });

    

    if (latestVersion) {
      const latestReviews = await prisma.proposalReview.findMany({
        where: { proposalVersionId: latestVersion.id },
      });

      if (latestReviews.length > 0) {
        await prisma.proposalReview.createMany({
          data: latestReviews.map((r) => ({
            proposalVersionId: newVersion.id,
            reviewerId: r.reviewerId,
            status: "PENDING", // default status
            comments: "",       // reset comments
          })),
        });
      }
    }

    // Update updatedAt timestamp on SubmitProposal
    await prisma.submitProposal.update({
      where: { id: submitProposalId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message: "Proposal resubmitted successfully" });
  } catch (error) {
    console.error("Error resubmitting proposal:", error);
    return NextResponse.json(
      { error: "Failed to resubmit proposal" },
      { status: 500 }
    );
  }
}