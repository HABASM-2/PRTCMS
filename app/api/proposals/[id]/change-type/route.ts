// /app/api/proposals/[id]/change-type/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { comment } = await req.json();

    // Fetch SubmitProposal with latest version and its reviewers
    const submitProposal = await prisma.submitProposal.findUnique({
      where: { id: proposalId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            reviews: { select: { reviewerId: true } },
          },
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

    // Update latest version type and mark as resubmittable
    const updatedVersion = await prisma.proposalVersion.update({
      where: { id: lastVersion.id },
      data: {
        type: "PROPOSAL",
        resubmitAllowed: true,
      },
    });

    // Collect all previous reviewers + current user (avoid duplicates)
    const oldReviewerIds = lastVersion.reviews.map((r) => r.reviewerId);
    const allReviewerIds = Array.from(new Set([...oldReviewerIds, currentUserId]));

    // Create ProposalReview for any missing reviewers (skip if already exists)
    for (const reviewerId of allReviewerIds) {
      const existingReview = await prisma.proposalReview.findUnique({
        where: {
          proposalVersionId_reviewerId: {
            proposalVersionId: lastVersion.id,
            reviewerId,
          },
        },
      });

      if (!existingReview) {
        const review = await prisma.proposalReview.create({
          data: {
            proposalVersionId: lastVersion.id,
            reviewerId,
            status: reviewerId === currentUserId ? "NEEDS_MODIFICATION" : "PENDING",
          },
        });

        // Add system comment only for current user
        if (reviewerId === currentUserId) {
          await prisma.proposalReviewComment.create({
            data: {
              proposalReviewId: review.id,
              authorId: currentUserId,
              content: "[SYSTEM] Changed from Concept Note to Proposal",
            },
          });

          if (comment?.trim()) {
            await prisma.proposalReviewComment.create({
              data: {
                proposalReviewId: review.id,
                authorId: currentUserId,
                content: comment.trim(),
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      message: "Latest version updated to PROPOSAL type, reviewers assigned",
      versionId: updatedVersion.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update version and assign reviewers" },
      { status: 500 }
    );
  }
}
