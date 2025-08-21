// /app/api/central-committee/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: get or create a central committee for this user
async function getOrCreateCommittee(userId: number) {
  let committee = await prisma.centralCommittee.findFirst();
  if (!committee) {
    committee = await prisma.centralCommittee.create({
      data: {
        name: "Main Committee",
        createdById: userId, // use the userId passed from frontend
      },
    });
  }
  return committee;
}

// GET: fetch all users and current committee members
export async function GET(req: Request) {
  try {
    let committee = await prisma.centralCommittee.findFirst();

    // Create if not exists (optional)
    if (!committee) {
      committee = await prisma.centralCommittee.create({
        data: {
          name: "Main Committee",
          createdById: 1, // default user or pass userId
        },
      });
    }

    // fetch members
    const memberRecords = await prisma.centralCommitteeMember.findMany({
      where: { committeeId: committee.id },
      include: { user: { select: { id: true, fullName: true } } },
    });
    const members = memberRecords.map((m) => m.user);

    // fetch all users
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ users, members, committee });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// POST: add a new member
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const committee = await getOrCreateCommittee(userId);

    const existing = await prisma.centralCommitteeMember.findFirst({
      where: { committeeId: committee.id, userId },
    });

    if (existing) {
      return NextResponse.json({ message: "User is already a member" }, { status: 400 });
    }

    await prisma.centralCommitteeMember.create({
      data: { userId, committeeId: committee.id },
    });

    return NextResponse.json({ message: "Member added successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE: remove a member
export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const committee = await prisma.centralCommittee.findFirst();
    if (!committee) return NextResponse.json({ message: "No committee exists" });

    await prisma.centralCommitteeMember.deleteMany({
      where: { committeeId: committee.id, userId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
