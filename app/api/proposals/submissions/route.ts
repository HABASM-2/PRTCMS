import { prisma } from "@/lib/prisma"; // adjust your import
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch all submissions with latest version and all versions,
    // including reviews and their comments
    const submissions = await prisma.submitProposal.findMany({
      where: { submittedById: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            reviews: {
              include: {
                reviewer: true,
                ProposalReviewComment: {
                  include: {
                    author: true,
                  },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
        finalDecision: {
          include: {
            decidedBy: true,
          },
        },
      }, 
    });

    const mapped = submissions.map((sub) => {
      // Use final decision status if available, else default to PENDING
      const status = sub.finalDecision ? sub.finalDecision.status : "PENDING";

      return {
        id: sub.id,
        title: sub.title,
        status,
        updatedAt: sub.updatedAt.toISOString(),

        description: sub.versions[0]?.description || null,
        participants: sub.versions[0]?.participants || [],
        fileUrl: sub.versions[0]?.fileUrl || null,
        versions: sub.versions.map((version) => ({
          versionNumber: version.versionNumber,
          title: version.title,
          description: version.description,
          participants: version.participants,
          fileUrl: version.fileUrl,
          createdAt: version.createdAt.toISOString(),
          updatedAt: version.updatedAt.toISOString(),
          resubmitAllowed: version.resubmitAllowed,
          reviews: version.reviews.map((review) => ({
            id: review.id,
            reviewerName: review.reviewer?.fullName || "Unknown",
            status: review.status,
            // Old comments string removed in favor of detailed comments array
            // comments: review.comments,

            // Map ProposalReviewComment array with author info
            comments: review.ProposalReviewComment.map((c) => ({
              id: c.id,
              authorName: c.author?.fullName || "Unknown",
              content: c.content,
              createdAt: c.createdAt.toISOString(),
            })),

            createdAt: review.createdAt.toISOString(),
          })),
        })),

        finalDecision: sub.finalDecision
          ? {
              status: sub.finalDecision.status,
              reason: sub.finalDecision.reason,
              decidedBy: sub.finalDecision.decidedBy?.fullName || "Unknown",
              decidedAt: sub.finalDecision.decidedAt.toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json({ submissions: mapped });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
