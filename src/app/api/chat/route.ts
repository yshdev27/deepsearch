import { type UIMessage, convertToModelMessages, streamText } from "ai";
import { model } from "~/model";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
