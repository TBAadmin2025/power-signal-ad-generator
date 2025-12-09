import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1"
  });

  return NextResponse.json({ text: transcription.text });
}
