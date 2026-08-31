// Shared client-side helper for requesting and persisting a Matter's Leo reply,
// reused by both the New Matter creation flow (Route B) and the Matter Detail page.
import { readAskLeoStream } from "./streamClient";

export type MatterReplyContext = {
  id: number;
  title: string;
  subject: string;
  matterType: string;
  description: string;
  status: string;
};

export type MatterConversationMessage = {
  role: "user" | "leo";
  content: string;
};

export async function requestMatterLeoReply(input: {
  matter: MatterReplyContext;
  conversation: MatterConversationMessage[];
  onDelta?: (delta: string, fullResponseSoFar: string) => void;
}): Promise<string> {
  const latestMessage =
    input.conversation[input.conversation.length - 1]?.content || "";

  const response = await fetch("/api/ask-leo", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: latestMessage,
      latestMessage,
      contextType: "matter",
      activeMatterId: input.matter.id,
      matter: input.matter,
      conversation: input.conversation,
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(errorPayload?.error || "Leo could not complete the response.");
  }

  let fullResponse = "";
  let streamError: string | null = null;

  await readAskLeoStream(response, (event) => {
    if (event.type === "delta" && event.delta) {
      fullResponse += event.delta;
      input.onDelta?.(event.delta, fullResponse);
    }

    if (event.type === "error") {
      streamError = event.error || "Leo could not complete the response.";
    }
  });

  if (streamError && !fullResponse.trim()) {
    throw new Error(streamError);
  }

  return fullResponse.trim() || "Leo was unable to generate a response.";
}

export async function saveMatterMessage(
  matterId: number,
  message: MatterConversationMessage,
) {
  const response = await fetch(`/api/matters/${matterId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  const result = (await response.json()) as {
    success: boolean;
    message?: {
      id: number;
      role: "user" | "leo";
      content: string;
      created_at: string;
    };
    error?: string;
  };

  if (!response.ok || !result.success || !result.message) {
    throw new Error(result.error || "The conversation message could not be saved.");
  }

  return result.message;
}
