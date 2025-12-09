import { openai } from "@/app/openai";

export async function POST(request, { params: { threadId } }) {
  const { toolCallOutputs, runId } = await request.json();

  // 1. Normalize to array
  const array = Array.isArray(toolCallOutputs)
    ? toolCallOutputs
    : [toolCallOutputs];

  // 2. Enforce Assistants schema { tool_call_id: string, output: string }
  const normalized = array.map((item: any) => ({
    tool_call_id: String(item.tool_call_id),
    output: typeof item.output === "string"
      ? item.output
      : JSON.stringify(item.output ?? "")
  }));

  // 3. Submit + stream
  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    {
      tool_outputs: normalized
    }
  );

  return new Response(stream.toReadableStream());
}
