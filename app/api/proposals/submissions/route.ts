import { prisma } from "@/lib/prisma"; // adjust your import
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Fetch all submissions with latest version and all versions
    const submissions = await prisma.submitProposal.findMany({
      where: { submittedById: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        // Fetch all versions for history (including reviews and reviewers)
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            reviews: {
              include: {
                reviewer: true, // to get reviewer's fullName
              },
            },
          },
        },
      },
    });

    const mapped = submissions.map((sub) => {
      const latestVersion = sub.versions[0];

      // Determine overall status based on latest version reviews
      let status = "PENDING";
      if (latestVersion) {
        for (const review of latestVersion.reviews) {
          if (review.status === "REJECTED") {
            status = "REJECTED";
            break;
          } else if (review.status === "ACCEPTED") {
            status = "ACCEPTED";
          }
        }
      }

      return {
        id: sub.id,
        title: sub.title,
        status,
        updatedAt: sub.updatedAt.toISOString(),
        // Latest version fields for pre-filling
        description: latestVersion?.description || null,
        participants: latestVersion?.participants || [],
        fileUrl: latestVersion?.fileUrl || null,
        versions: sub.versions.map((version) => ({
          versionNumber: version.versionNumber,
          title: version.title,
          description: version.description,
          participants: version.participants,
          fileUrl: version.fileUrl,
          createdAt: version.createdAt.toISOString(),
          updatedAt: version.updatedAt.toISOString(),
          reviews: version.reviews.map((review) => ({
            id: review.id,
            reviewerName: review.reviewer?.fullName || "Unknown",
            status: review.status,
            comments: review.comments,
            createdAt: review.createdAt.toISOString(),
          })),
        })),
      };
    });

    return NextResponse.json({ submissions: mapped });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
