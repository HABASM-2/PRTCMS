import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const data = await req.json();

  const updated = await prisma.proposalNotice.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      orgUnitId: data.orgUnitId,
      expiredAt: new Date(data.expiredAt),
      type: data.type,         // <--- add type
      isActive: data.isActive, // <--- add isActive
    },
  });

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.proposalNotice.update({
    where: { id },
    data: { hidden: true },
  });
  return new Response(null, { status: 204 });
}
