import type { UIMessage } from "ai";
import ReactMarkdown, { type Components } from "react-markdown";

interface ChatMessageProps {
  message: UIMessage;
  userName: string;
}

type WebResult = {
  title: string;
  link: string;
  snippet?: string;
  date?: string | null;
};

type WebSearchPayload =
  | WebResult[]
  | {
      results?: WebResult[];
      error?: string;
    };

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const pushWebResults = (target: WebResult[], payload: unknown) => {
  if (!Array.isArray(payload)) return;

  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const link = typeof record.link === "string" ? record.link : "";
    if (!link) continue;

    target.push({
      title: typeof record.title === "string" ? record.title : "Untitled",
      link,
      snippet: typeof record.snippet === "string" ? record.snippet : undefined,
      date: typeof record.date === "string" ? record.date : null,
    });
  }
};

const extractWebSearch = (
  parts: UIMessage["parts"],
): { results: WebResult[]; errors: string[] } => {
  const results: WebResult[] = [];
  const errors: string[] = [];

  for (const part of parts) {
    if (part.type !== "tool-result") continue;
    if (part.toolName !== "web_search") continue;

    const payload = (part as { result?: unknown }).result as
      | WebSearchPayload
      | undefined;
    if (!payload) continue;

    if (Array.isArray(payload)) {
      pushWebResults(results, payload);
      continue;
    }

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      if (typeof record.error === "string" && record.error.trim()) {
        errors.push(record.error);
      }
      if (Array.isArray(record.results)) {
        pushWebResults(results, record.results);
      }
    }
  }

  return { results, errors };
};

export const ChatMessage = ({ message, userName }: ChatMessageProps) => {
  const isAI = message.role === "assistant";
  const { results: webResults, errors: webErrors } = extractWebSearch(
    message.parts,
  );

  // Extract text content from message parts
  const textContent = message.parts
    .map((part) => {
      switch (part.type) {
        case "text":
          return part.text;
        default:
          return null;
      }
    })
    .filter((text): text is string => text !== null)
    .join("");

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${
          isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
        }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        {webErrors.length > 0 && (
          <div className="mb-4 rounded-md border border-red-900/60 bg-red-950/60 p-3 text-sm text-red-300">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
              Web search error
            </p>
            <p>{webErrors.join(" ")}</p>
          </div>
        )}

        {webResults.length > 0 && (
          <div className="mb-4 rounded-md border border-gray-700 bg-gray-900/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Web results
            </p>
            <ul className="space-y-2 text-sm">
              {webResults.map((result, index) => (
                <li key={`${result.link}-${index}`}>
                  <a
                    href={result.link}
                    className="text-blue-400 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.title}
                  </a>
                  {result.snippet && (
                    <p className="mt-1 text-gray-400">{result.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="prose prose-invert max-w-none whitespace-pre-wrap">
          <Markdown>{textContent}</Markdown>
        </div>
      </div>
    </div>
  );
};
