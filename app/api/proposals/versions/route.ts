import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      submitProposalId,
      title,
      description,
      participants,
      fileUrl,
    } = body;

    if (!submitProposalId || !title || !participants?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the max versionNumber for this submitProposalId
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { submitProposalId },
      orderBy: { versionNumber: "desc" },
    });

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const newVersion = await prisma.proposalVersion.create({
      data: {
        submitProposalId,
        versionNumber: nextVersionNumber,
        title,
        description,
        participants,
        fileUrl,
      },
    });

    return NextResponse.json({ version: newVersion });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create new version" }, { status: 500 });
  }
}
