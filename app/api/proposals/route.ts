import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { title, description, participants, fileUrl, orgUnitId, noticeId, submissionId } = body;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!title || !noticeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = Number(session.user.id);

    // Fetch user's assigned org units with hierarchy
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      include: {
        orgUnit: true,
      },
    });

    if (userOrgUnits.length === 0) {
      return NextResponse.json({ error: "User has no assigned org units" }, { status: 400 });
    }

    // Filter only **leaf org units** (org units that have no children)
    const leafOrgUnits = [];
    for (const u of userOrgUnits) {
      const hasChildren = await prisma.orgUnit.findFirst({
        where: { parentId: u.orgUnitId },
      });
      if (!hasChildren) leafOrgUnits.push(u.orgUnitId);
    }

    if (leafOrgUnits.length === 0) {
      return NextResponse.json({ error: "User has no leaf org units" }, { status: 400 });
    }

    // Pick the first leaf org unit (if multiple)
    const validOrgUnitId = leafOrgUnits[0];

    // Check if notice is active
    const notice = await prisma.proposalNotice.findUnique({ where: { id: noticeId } });
    if (!notice || notice.expiredAt <= new Date()) {
      return NextResponse.json({ error: "Notice expired or invalid" }, { status: 400 });
    }

    if (submissionId) {
      // Resubmission: add new version
      const existingSubmission = await prisma.submitProposal.findFirst({
        where: { id: submissionId, submittedById: userId },
        include: { versions: true },
      });

      if (!existingSubmission) {
        return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
      }

      const nextVersionNumber = existingSubmission.versions.length + 1;

      const newVersion = await prisma.proposalVersion.create({
        data: {
          submitProposalId: submissionId,
          versionNumber: nextVersionNumber,
          title,
          description,
          participants,
          fileUrl,
        },
      });

      return NextResponse.json(newVersion);
    } else {
      // New submission - check if already submitted
      const alreadySubmitted = await prisma.submitProposal.findFirst({
        where: { noticeId, submittedById: userId },
      });

      if (alreadySubmitted) {
        return NextResponse.json({ error: "Proposal already submitted for this notice" }, { status: 400 });
      }

      // Create new proposal with initial version
      const proposal = await prisma.submitProposal.create({
        data: {
          title,
          description,
          participants,
          fileUrl,
          submittedById: userId,
          orgUnitId: validOrgUnitId, // <-- leaf org unit
          noticeId,
          versions: {
            create: {
              versionNumber: 1,
              title,
              description,
              participants,
              fileUrl,
            },
          },
        },
        include: { versions: true },
      });

      return NextResponse.json(proposal);
    }
  } catch (error) {
    console.error("Error submitting proposal:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Fetch user's assigned org units
    const userOrgUnits = await prisma.userOrgUnit.findMany({
      where: { userId },
      select: { orgUnitId: true },
    });

    const orgUnitIds = userOrgUnits.map((u) => u.orgUnitId);

    if (orgUnitIds.length === 0) return NextResponse.json([]);

    // Fetch all proposals in user's org units, including forwarding info
    const proposals = await prisma.submitProposal.findMany({
      where: {
        orgUnitId: { in: orgUnitIds },
      },
      orderBy: { createdAt: "desc" },
      include: {
        submittedBy: { select: { fullName: true } },
        orgUnit: { select: { name: true } },
        notice: { select: { type: true } },
        ProposalForwarding: true, // include all forwarding records
      },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      title: p.title,
      submittedBy: p.submittedBy?.fullName || "Unknown",
      orgUnit: p.orgUnit?.name || "N/A",
      participants: p.participants.join(", "),
      submittedAt: new Date(p.createdAt).toLocaleString(),
      description: p.description,
      fileUrl: p.fileUrl || "",
      noticeType: p.notice?.type || null,
      forwarded: p.ProposalForwarding.length > 0, // <-- mark forwarded proposals
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/proposals error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}