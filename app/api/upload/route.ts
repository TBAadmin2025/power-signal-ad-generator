import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 🔥 Create a real Node-compatible FileLike instance
    const fileForUpload = new File([file], file.name, { type: file.type });

    const uploaded = await openai.files.create({
      file: fileForUpload,
      purpose: "assistants"
    });

    return NextResponse.json({ file_id: uploaded.id });

  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
