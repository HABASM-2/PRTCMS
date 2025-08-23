import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  projectid: string;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const projectId = Number(params.projectid);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  try {
    const tasks = await prisma.projectTask.findMany({
      where: { projectId },
      include: { assignedTo: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Params }) {
  const projectId = Number(params.projectid);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
  }

  const body = await req.json();
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const newTask = await prisma.projectTask.create({
      data: {
        projectId,
        title,
      },
    });
    return NextResponse.json(newTask);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PUT and DELETE now handled dynamically per task
export async function PUT(req: Request, { params }: { params: Params }) {
  const projectId = Number(params.projectid);
  const url = new URL(req.url);
  const taskId = Number(url.searchParams.get("taskId"));

  if (isNaN(projectId) || isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid projectId or taskId" }, { status: 400 });
  }

  const body = await req.json();
  const { title, status } = body;

  try {
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: { 
        ...(title !== undefined ? { title } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(updatedTask);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const url = new URL(req.url);
  const taskId = Number(url.searchParams.get("taskId"));

  if (isNaN(taskId)) {
    return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
  }

  try {
    await prisma.projectTask.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
