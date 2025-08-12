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

    if (!title || !orgUnitId || !noticeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if notice is active
    const notice = await prisma.proposalNotice.findUnique({
      where: { id: noticeId },
    });

    if (!notice || notice.expiredAt <= new Date()) {
      return NextResponse.json({ error: "Notice expired or invalid" }, { status: 400 });
    }

    if (submissionId) {
      // Resubmission: add new version for existing SubmitProposal

      // Verify submission belongs to this user
      const existingSubmission = await prisma.submitProposal.findFirst({
        where: { id: submissionId, submittedById: Number(session.user.id) },
        include: { versions: true },
      });

      if (!existingSubmission) {
        return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
      }

      // Determine next version number
      const nextVersionNumber = existingSubmission.versions.length + 1;

      // Create new ProposalVersion
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
      // New submission - check if user already submitted for this notice
      const alreadySubmitted = await prisma.submitProposal.findFirst({
        where: { noticeId, submittedById: Number(session.user.id) },
      });

      if (alreadySubmitted) {
        return NextResponse.json({ error: "Proposal already submitted for this notice" }, { status: 400 });
      }

      // Create SubmitProposal + initial version
      const proposal = await prisma.submitProposal.create({
        data: {
          title,
          description,
          participants,
          fileUrl,
          submittedById: Number(session.user.id),
          orgUnitId,
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
        include: {
          versions: true,
        },
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
    // Fetch proposals that have **no** reviewers assigned to any version
    const proposals = await prisma.submitProposal.findMany({
      where: {
        versions: {
          none: {
            reviews: {
              some: {}, // If there's any review, it will be excluded
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        submittedBy: { select: { fullName: true } },
        orgUnit: { select: { name: true } },
        notice: { select: { type: true } },
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
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/proposals error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
