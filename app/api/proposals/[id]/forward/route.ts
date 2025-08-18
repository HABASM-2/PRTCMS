// /api/proposals/[id]/forward/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = Number(params.id);
    if (!proposalId)
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });

    const body = await req.json();
    const { remarks } = body;

    const forwardedById = Number(req.headers.get("x-user-id"));
    if (!forwardedById)
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });

    // Fetch the proposal and its org unit
    const proposal = await prisma.submitProposal.findUnique({
      where: { id: proposalId },
      include: { orgUnit: true },
    });
    if (!proposal)
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const currentOrgUnit = proposal.orgUnit;
    if (!currentOrgUnit?.parentId) {
      return NextResponse.json(
        { error: "Cannot forward: no parent org unit" },
        { status: 400 }
      );
    }

    // Get the Coordinator role
    const coordinatorRole = await prisma.role.findFirst({
      where: { name: "coordinator" },
    });
    if (!coordinatorRole)
      return NextResponse.json(
        { error: "Coordinator role not found" },
        { status: 500 }
      );

    // Create ProposalForwarding record
    const forwarded = await prisma.proposalForwarding.create({
      data: {
        submitProposalId: proposalId,
        forwardedById,
        forwardedToOrgUnitId: currentOrgUnit.parentId,
        forwardedToRoleId: coordinatorRole.id,
        remarks: remarks || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, forwarded });
  } catch (err) {
    console.error("Forward proposal error:", err);
    return NextResponse.json(
      { error: "Failed to forward proposal" },
      { status: 500 }
    );
  }
}

// ✅ New GET method
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = Number(params.id);
    if (!proposalId)
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });

    const forwarded = await prisma.proposalForwarding.findFirst({
      where: { submitProposalId: proposalId },
    });

    return NextResponse.json({ forwarded: !!forwarded });
  } catch (err) {
    console.error("GET forward error:", err);
    return NextResponse.json({ error: "Failed to fetch forward status" }, { status: 500 });
  }
}
