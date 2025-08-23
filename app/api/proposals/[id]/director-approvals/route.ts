import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import fs from "fs";
import path from "path";

interface Params {
  id: string;
}

// ------------------ GET ------------------
export const GET = async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const approvals = await prisma.directorApproval.findMany({
      where: { submitProposalId: proposalId },
      include: {
        director: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        submitProposal: {
          select: {
            Project: {
              select: {
                totalBudget: true, // <-- include allocated budget
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = approvals.map((a) => ({
      id: a.id,
      status: a.status,
      reason: a.reason,
      signedFileUrl: a.signedFileUrl,
      approvedAt: a.approvedAt,
      director: {
        id: a.director.id,
        name: a.director.fullName,
        email: a.director.email,
      },
      totalBudget: a.submitProposal?.Project?.totalBudget ?? null, // allocated budget
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
};

// ------------------ POST ------------------
export const POST = async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const proposalId = parseInt(params.id);
    if (isNaN(proposalId)) {
      return NextResponse.json({ error: "Invalid proposal ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const directorId = Number(session.user.id);

    const formData = await req.formData();
    const status = formData.get("status") as
      | "PENDING"
      | "ACCEPTED"
      | "REJECTED"
      | "NEEDS_MODIFICATION";
    const reason = (formData.get("reason") as string) || "";
    const totalBudget = parseFloat(formData.get("totalBudget") as string) || 0;

    let signedFileUrl: string | null = null;
    const file = formData.get("file") as File | null;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadDir = path.join(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, buffer);
      signedFileUrl = `/uploads/${fileName}`;
    }

    // Check if already approved
    const existing = await prisma.directorApproval.findFirst({
      where: { submitProposalId: proposalId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Approval already exists for this proposal" },
        { status: 400 }
      );
    }

    const approval = await prisma.directorApproval.create({
      data: {
        submitProposalId: proposalId,
        directorId,
        status,
        reason,
        signedFileUrl,
        approvedAt: new Date(),
      },
    });

    // Transition to project if accepted
    if (status === "ACCEPTED") {
      const proposal = await prisma.submitProposal.findUnique({
        where: { id: proposalId },
      });

      if (proposal) {
        await prisma.project.create({
          data: {
            submitProposalId: proposal.id,
            title: proposal.title,
            description: proposal.description,
            totalBudget, // store allocated budget
          },
        });
      }
    }

    return NextResponse.json({ ...approval, totalBudget });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit approval" }, { status: 500 });
  }
};