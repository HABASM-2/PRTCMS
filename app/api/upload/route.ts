import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a safe filename
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    // ✅ Change to public/uploads so it’s accessible by the client
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    // Ensure directory exists (optional if already present)
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`; // 👈 relative path for frontend

    return NextResponse.json({ url }); // ✅ Make sure to return { url }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
