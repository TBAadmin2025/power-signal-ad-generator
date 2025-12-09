import { assistantId } from "@/app/assistant-config";
import { openai } from "@/app/openai";

export const runtime = "nodejs";

export async function POST(request, { params: { threadId } }) {
  const { content, file_id } = await request.json();

  /**
   * ===============================
   * CASE 1 — SIMPLE TEXT MESSAGE
   * ===============================
   */
  if (!file_id) {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: content || ""
    });

    const stream = openai.beta.threads.runs.stream(threadId, {
      assistant_id: assistantId
    });

    return new Response(stream.toReadableStream());
  }

  /**
   * ===============================
   * CASE 2 — FILE ATTACHED (CODE INTERPRETER)
   * ===============================
   */
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content || "",
    attachments: [
      {
        file_id,
        tools: [{ type: "code_interpreter" }]
      }
    ]
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId
  });

  return new Response(stream.toReadableStream());
}
