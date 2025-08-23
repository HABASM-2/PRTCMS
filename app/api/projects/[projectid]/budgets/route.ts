import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  id?: string;
}

// Helper to summarize totals
function summarize(project: {
  totalBudget: number | null;
  budgets: { amount: number | null }[];
}) {
  const totalSpent = project.budgets.reduce((sum, b) => sum + (b.amount ?? 0), 0);
  const totalAllocated = project.totalBudget ?? 0;
  const remaining = totalAllocated - totalSpent;
  return { totalAllocated, totalSpent, remaining };
}

// Universal function to get projectId
function getProjectId(req: Request, params: Params) {
  let projectId = Number(params.id);
  if (isNaN(projectId)) {
    const parts = new URL(req.url).pathname.split("/");
    projectId = Number(parts[3]); // /api/projects/:id/budgets
  }
  if (isNaN(projectId)) throw new Error("Invalid projectId");
  return projectId;
}

// GET budgets
export async function GET(req: Request, { params }: { params: Params }) {
  try {
    const projectId = getProjectId(req, params);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { budgets: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { totalAllocated, totalSpent, remaining } = summarize(project);

    return NextResponse.json({
      budgets: project.budgets.map((b) => ({
        id: b.id,
        item: b.item,
        amount: b.amount,
        spent: b.amount ?? 0, // calculated for UI
      })),
      totalAllocated,
      totalSpent,
      remaining,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// POST add budget
export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const projectId = getProjectId(req, params);
    const body = await req.json();
    const item = String(body?.item ?? "").trim();
    const amount = Number(body?.amount);

    if (!item || isNaN(amount)) throw new Error("Missing or invalid fields");

    await prisma.projectBudget.create({
      data: { projectId, item, amount },
    });

    return GET(req, { params });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// PUT update budget
export async function PUT(req: Request, { params }: { params: Params }) {
  try {
    const projectId = getProjectId(req, params);
    const url = new URL(req.url);
    const budgetId = Number(url.searchParams.get("budgetId"));
    if (isNaN(budgetId)) throw new Error("Invalid budgetId");

    const body = await req.json();
    if (!body.item || isNaN(Number(body.amount))) throw new Error("Missing or invalid fields");

    await prisma.projectBudget.update({
      where: { id: budgetId },
      data: {
        item: String(body.item),
        amount: Number(body.amount),
      },
    });

    return GET(req, { params });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE budget
export async function DELETE(req: Request, { params }: { params: Params }) {
  try {
    const projectId = getProjectId(req, params);
    const url = new URL(req.url);
    const budgetId = Number(url.searchParams.get("budgetId"));
    if (isNaN(budgetId)) throw new Error("Invalid budgetId");

    await prisma.projectBudget.delete({ where: { id: budgetId } });

    return GET(req, { params });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
