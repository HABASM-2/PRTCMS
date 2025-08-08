import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"; // your prisma client
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = parseInt(session.user.id as string, 10); // ✅ Ensure it's a number

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    // Fetch all proposals assigned to this reviewer
    const proposals = await prisma.submitProposal.findMany({
      where: {
        versions: {
          some: {
            reviews: {
              some: {
                reviewerId, // now Int
              },
            },
          },
        },
        ...(search
          ? { title: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: {
        submittedBy: { select: { fullName: true } },
        orgUnit: { select: { name: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            reviews: {
              include: {
                reviewer: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = proposals.map((p) => {
      const latestVersion = p.versions[0];
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        participants: p.participants,
        fileUrl: p.fileUrl,
        submittedBy: p.submittedBy.fullName,
        orgUnit: p.orgUnit.name,
        submittedAt: p.createdAt.toISOString(),
        reviewers:
          latestVersion?.reviews.map((r) => ({
            reviewerId: r.reviewerId,
            reviewerName: r.reviewer.fullName,
            status: r.status,
            comments: r.comments,
          })) || [],
      };
    });

    return NextResponse.json({
      proposals: formatted,
      total: formatted.length, // no pagination, return all
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}
