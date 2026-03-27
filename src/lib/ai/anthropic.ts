import { TOOL_DEFINITIONS, executeToolCall } from "./tools";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
}

export interface AnthropicContentBlock {
  type: string;
  [key: string]: unknown;
}

const MAX_TOOL_ROUNDS = 10;
const MAX_TOOL_RESULT_CHARS = 12_000;

function capToolResult(result: string): string {
  if (result.length <= MAX_TOOL_RESULT_CHARS) return result;
  return (
    result.slice(0, MAX_TOOL_RESULT_CHARS) +
    "\n...[truncated to " +
    MAX_TOOL_RESULT_CHARS +
    " chars]"
  );
}

interface AnthropicAPIResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicContentBlock[];
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

async function callAnthropicAPI(
  systemPrompt: string,
  messages: AnthropicMessage[],
  includeTools: boolean
): Promise<AnthropicAPIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  const body: Record<string, unknown> = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  };

  if (includeTools) {
    body.tools = TOOL_DEFINITIONS;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Anthropic API error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}

function extractTextContent(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text as string)
    .join("");
}

export async function callLLMWithTools(
  systemPrompt: string,
  messages: AnthropicMessage[],
  onProgress?: (status: string) => Promise<void>
): Promise<{ response: string; skill_used: string | null }> {
  const conversationMessages: AnthropicMessage[] = [...messages];
  let skillUsed: string | null = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const apiResponse = await callAnthropicAPI(
      systemPrompt,
      conversationMessages,
      true
    );

    if (
      apiResponse.stop_reason === "end_turn" ||
      apiResponse.stop_reason === "max_tokens"
    ) {
      const text = extractTextContent(apiResponse.content);
      return { response: text, skill_used: skillUsed };
    }

    if (apiResponse.stop_reason === "tool_use") {
      // Push assistant message with full content (text + tool_use blocks)
      conversationMessages.push({
        role: "assistant",
        content: apiResponse.content,
      });

      // Find all tool_use blocks
      const toolUseBlocks = apiResponse.content.filter(
        (block) => block.type === "tool_use"
      );

      // Track first tool used as the skill
      if (skillUsed === null && toolUseBlocks.length > 0) {
        skillUsed = toolUseBlocks[0].name as string;
      }

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          const result = await executeToolCall(
            block.name as string,
            block.input as Record<string, unknown>
          );
          return {
            type: "tool_result" as const,
            tool_use_id: block.id as string,
            content: capToolResult(result),
          };
        })
      );

      // Push tool results as user message
      conversationMessages.push({
        role: "user",
        content: toolResults as unknown as AnthropicContentBlock[],
      });

      // Notify progress
      if (onProgress) {
        const toolNames = toolUseBlocks
          .map((b) => b.name as string)
          .join(", ");
        await onProgress(`Used tools: ${toolNames}`);
      }

      continue;
    }

    // Unknown stop reason — extract what we can
    const text = extractTextContent(apiResponse.content);
    return { response: text, skill_used: skillUsed };
  }

  // Exhausted all rounds — make a final call without tools
  const finalResponse = await callAnthropicAPI(
    systemPrompt,
    conversationMessages,
    false
  );
  const text = extractTextContent(finalResponse.content);
  return { response: text, skill_used: skillUsed };
}
