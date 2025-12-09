import { openai } from "@/app/openai"; // still imported for compatibility

export const runtime = "nodejs";

// Return your existing Assistant ID from environment variables
export async function POST() {
  const assistantId = process.env.ASSISTANT_ID;

  if (!assistantId) {
    return new Response(
      "ASSISTANT_ID is not set in Environment Variables.",
      { status: 500 }
    );
  }

  return Response.json({ assistantId });
}
