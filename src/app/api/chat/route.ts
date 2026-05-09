import { type UIMessage, convertToModelMessages, streamText } from "ai";
import { model } from "~/model";
import { auth } from "~/server/auth/index.ts";
import { searchSerper } from "~/serper";

export const maxDuration = 60;

const webSearchPrefixes = [/^\/web\s+/i, /^web:\s*/i, /^search:\s*/i];
const webSearchTriggerRegex =
  /\b(latest|today|current|now|this week|this month|this year|breaking|update|news|headline|price|stock|rate|weather|forecast|score|scores|scored|result|results|standings|table|match|vs|stats|statistics|record|injury|transfer|transfers|release|released|launch|schedule|fixture|points|ranking|rankings|poll|election|earnings|box office|free kick|free kicks|goal|goals)\b/i;

const extractSearchDirective = (rawQuery: string) => {
  let query = rawQuery.trim();
  let force = false;

  for (const prefix of webSearchPrefixes) {
    if (prefix.test(query)) {
      query = query.replace(prefix, "").trim();
      force = true;
      break;
    }
  }

  return { query, force };
};

const shouldUseWebSearch = (query: string, force: boolean) => {
  if (!query) return false;
  if (force) return true;

  if (webSearchTriggerRegex.test(query)) return true;

  const wordCount = query.split(/\s+/).filter(Boolean).length;
  return wordCount >= 8;
};

const extractLatestUserText = (messages: UIMessage[]): string => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const text = message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }

  return "";
};

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

  const rawQuery = extractLatestUserText(messages);
  const { query, force } = extractSearchDirective(rawQuery);
  let webContext = "";

  if (shouldUseWebSearch(query, force)) {
    try {
      const results = await searchSerper({ q: query, num: 5 }, req.signal);
      const organic = results.organic ?? [];
      webContext = organic
        .slice(0, 5)
        .map((result, index) => {
          const snippet = result.snippet ? `\n${result.snippet}` : "";
          return `[${index + 1}] ${result.title}\n${result.link}${snippet}`;
        })
        .join("\n\n");
    } catch (error) {
      console.warn(
        "Web search failed",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    system: webContext
      ? `Use the following web search results to answer. Include a brief Sources section with markdown links based on the results.\n\n${webContext}`
      : "Answer the user's question as best as you can.",
  });

  return result.toUIMessageStreamResponse();
}
