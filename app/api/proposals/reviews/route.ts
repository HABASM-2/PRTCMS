import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "10");
    const filter = searchParams.get("filter") || "";

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * pageSize;

    // Fetch proposals where the user is assigned as reviewer
    // Let's define assigned as proposals with at least one version with a review assigned to the user or where user has no review yet but can review (e.g. no review record)
    // For simplicity, fetch proposals where user is reviewer on at least one version OR proposals with versions without a review by the user (means user can review)
    // You may want to add explicit assignment table in future.

    // Filter proposals by title using `filter` param

    // Count total matching proposals
    const totalCount = await prisma.submitProposal.count({
      where: {
        title: {
          contains: filter,
          mode: "insensitive",
        },
        OR: [
          {
            versions: {
              some: {
                reviews: {
                  some: {
                    reviewerId: userId,
                  },
                },
              },
            },
          },
          {
            versions: {
              some: {
                NOT: {
                  reviews: {
                    some: {
                      reviewerId: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    // Fetch proposals with pagination, including versions and reviews
    const proposals = await prisma.submitProposal.findMany({
      where: {
        title: {
          contains: filter,
          mode: "insensitive",
        },
        OR: [
          {
            versions: {
              some: {
                reviews: {
                  some: {
                    reviewerId: userId,
                  },
                },
              },
            },
          },
          {
            versions: {
              some: {
                NOT: {
                  reviews: {
                    some: {
                      reviewerId: userId,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
      include: {
        versions: {
          include: {
            reviews: {
              include: {
                reviewer: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        submittedBy: {
          select: {
            fullName: true,
          },
        },
        orgUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    // Map to expected frontend shape
    const mapped = proposals.map((p) => ({
      id: p.id,
      title: p.title,
      submittedBy: p.submittedBy.fullName,
      orgUnitName: p.orgUnit.name,
      createdAt: p.createdAt.toISOString(),
      versions: p.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        title: v.title,
        description: v.description,
        participants: v.participants, // <--- add this
        fileUrl: v.fileUrl,           // <--- add this
        createdAt: v.createdAt.toISOString(),
        reviews: v.reviews.map((r) => ({
          id: r.id,
          reviewerId: r.reviewerId,
          reviewerName: r.reviewer.fullName,
          status: r.status,
          comments: r.comments || "",
          createdAt: r.createdAt.toISOString(),
        })),
      })),
    }));

    return NextResponse.json({
      proposals: mapped,
      totalCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposalVersionId, reviewerId, status, comments } = body;

    if (!proposalVersionId || !reviewerId || !status) {
      return NextResponse.json(
        { error: "proposalVersionId, reviewerId and status are required" },
        { status: 400 }
      );
    }

    // Upsert review: if review exists update, else create new
    const existingReview = await prisma.proposalReview.findUnique({
      where: {
        proposalVersionId_reviewerId: {
          proposalVersionId,
          reviewerId,
        },
      },
    });

    if (existingReview) {
      await prisma.proposalReview.update({
        where: {
          id: existingReview.id,
        },
        data: {
          status,
          comments,
          createdAt: new Date(), // update timestamp (or use updatedAt if you add one)
        },
      });
    } else {
      await prisma.proposalReview.create({
        data: {
          proposalVersionId,
          reviewerId,
          status,
          comments,
        },
      });
    }

    return NextResponse.json({ message: "Review saved successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    );
  }
}
