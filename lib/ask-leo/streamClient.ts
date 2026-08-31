// Shared client-side reader for the /api/ask-leo newline-delimited JSON stream.
export type AskLeoStreamEvent = {
  type?: string;
  delta?: string;
  conversationId?: number | null;
  shouldCreateMatter?: boolean;
  matterRecommendationReason?: string;
  documentKnowledge?: unknown;
  error?: string;
};

export async function readAskLeoStream(
  response: Response,
  onEvent: (event: AskLeoStreamEvent) => void
): Promise<void> {
  if (!response.body) {
    throw new Error("Leo returned an empty response stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      onEvent(JSON.parse(trimmed) as AskLeoStreamEvent);
    }

    if (done) {
      break;
    }
  }

  if (buffer.trim()) {
    onEvent(JSON.parse(buffer.trim()) as AskLeoStreamEvent);
  }
}
