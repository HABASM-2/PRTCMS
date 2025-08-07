// /app/api/proposals/[proposalId]/assign-reviewers/route.ts (Next.js 13 route handler)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust import path to your prisma client

export async function POST(request: Request, { params }: { params: { proposalId: string } }) {
  const proposalId = Number(params.proposalId);
  if (!proposalId) {
    return NextResponse.json({ error: 'Invalid proposal ID' }, { status: 400 });
  }

  const { reviewerIds } = await request.json();

  if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    return NextResponse.json({ error: 'No reviewer IDs provided' }, { status: 400 });
  }

  try {
    // Insert ProposalReview records for each reviewer
    // Avoid duplicates by checking existing assignments first
    const existingReviews = await prisma.proposalReview.findMany({
      where: {
        proposalId,
        reviewerId: { in: reviewerIds },
      },
      select: { reviewerId: true },
    });

    const existingReviewerIds = existingReviews.map((r) => r.reviewerId);

    const newReviewerIds = reviewerIds.filter((id: number) => !existingReviewerIds.includes(id));

    if (newReviewerIds.length === 0) {
      return NextResponse.json({ success: true, message: 'Reviewers already assigned' });
    }

    const createPromises = newReviewerIds.map((reviewerId: number) =>
      prisma.proposalReview.create({
        data: {
          proposalId,
          reviewerId,
          status: 'PENDING', // default status when assigning
        },
      })
    );

    await Promise.all(createPromises);

    return NextResponse.json({ success: true, message: 'Reviewers assigned successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to assign reviewers' }, { status: 500 });
  }
}
