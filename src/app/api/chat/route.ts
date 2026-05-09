import { type UIMessage, convertToModelMessages, streamText, tool } from "ai";
import { model } from "~/model";
import { auth } from "~/server/auth/index.ts";
import { searchSerper } from "~/serper";
import { z } from "zod";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    system:
      "You can use the web_search tool to fetch current information when needed.",
    maxSteps: 3,
    tools: {
      web_search: tool({
        description: "Search the web for current information.",
        parameters: z.object({
          q: z.string().min(1).describe("Search query"),
          num: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ q, num }) => {
          const count = Math.min(Math.max(num ?? 5, 1), 10);
          const results = await searchSerper({ q, num: count }, req.signal);
          const organic = results.organic ?? [];
          return organic.slice(0, count).map((result) => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            date: result.date ?? null,
          }));
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
