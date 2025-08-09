import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust your prisma import
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decidedById = Number(session.user.id);

  try {
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

    // Create final decision
    await prisma.finalDecision.create({
      data: {
        submitProposalId,
        status: decision,
        reason,
        decidedById,
      },
    });

    return NextResponse.json({ message: "Decision recorded successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
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