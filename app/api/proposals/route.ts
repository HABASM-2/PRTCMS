import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { title, description, participants, fileUrl, orgUnitId, noticeId } = body;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!title || !orgUnitId || !noticeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate notice is still active and not already submitted
    const existingNotice = await prisma.proposalNotice.findFirst({
      where: {
        id: noticeId,
        expiredAt: { gt: new Date() },
        SubmitProposal: {
          none: {
            submittedById: Number(session.user.id),
          },
        },
      },
    });

    if (!existingNotice) {
      return NextResponse.json({ error: "Invalid or already submitted notice" }, { status: 400 });
    }

    // Create the proposal
    const proposal = await prisma.submitProposal.create({
      data: {
        title,
        description,
        participants,
        fileUrl,
        submittedById: Number(session.user.id),
        orgUnitId,
        noticeId,
      },
    });

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error submitting proposal:", error);
    return NextResponse.json({ error: "Failed to submit proposal" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proposals = await prisma.submitProposal.findMany({
      where: {
        submittedById: Number(session.user.id),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        submittedBy: {
          select: { fullName: true },
        },
        orgUnit: {
          select: { name: true },
        },
      },
    });

    const formatted = proposals.map((p) => ({
      id: p.id,
      title: p.title,
      submittedBy: p.submittedBy?.fullName || "Unknown",
      orgUnit: p.orgUnit?.name || "N/A",
      participants: p.participants.join(", "), // ✅ Convert array to string
      submittedAt: new Date(p.createdAt).toLocaleString(),
      description: p.description,
      fileUrl: p.fileUrl || "",
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/proposals error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
