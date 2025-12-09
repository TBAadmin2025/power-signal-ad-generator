import { openai } from "@/app/openai";

export async function GET(_request, { params: { fileId } }) {

  // 1️⃣ Grab metadata (filename)
  const file = await openai.files.retrieve(fileId);

  // 2️⃣ Grab raw binary file content
  const content = await openai.files.content(fileId);

  // 3️⃣ Convert to ArrayBuffer → proper binary stream
  const data = await content.arrayBuffer();

  return new Response(data, {
    headers: {
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Type": "application/octet-stream"
    }
  });
}
