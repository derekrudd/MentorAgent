export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "web_search",
    description:
      "Search the web for current information using Google. Use this when you need real-time data, recent news, market information, company details, or any facts that may have changed after your training cutoff.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to look up on Google.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "n8n_webhook",
    description:
      "Trigger an n8n automation workflow by sending a payload to a named webhook. Use this to run backend automations such as sending emails, updating spreadsheets, or triggering multi-step workflows.",
    input_schema: {
      type: "object",
      properties: {
        workflow_name: {
          type: "string",
          description:
            "The name of the n8n webhook workflow to trigger (appended to the base URL).",
        },
        payload: {
          type: "object",
          description: "The JSON payload to send to the webhook.",
        },
      },
      required: ["workflow_name", "payload"],
    },
  },
];

async function executeWebSearch(
  query: string
): Promise<{
  query: string;
  results: { title: string; link: string; snippet: string }[];
  answer_box?: Record<string, unknown>;
}> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY environment variable is not set.");
  }

  const params = new URLSearchParams({
    engine: "google",
    q: query,
    api_key: apiKey,
  });

  const response = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const results = (data.organic_results ?? [])
    .slice(0, 5)
    .map((r: { title?: string; link?: string; snippet?: string }) => ({
      title: r.title ?? "",
      link: r.link ?? "",
      snippet: r.snippet ?? "",
    }));

  return {
    query,
    results,
    ...(data.answer_box ? { answer_box: data.answer_box } : {}),
  };
}

async function executeN8nWebhook(
  workflowName: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (!baseUrl) {
    throw new Error("N8N_WEBHOOK_BASE_URL environment variable is not set.");
  }

  const url = `${baseUrl}/${workflowName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `n8n webhook request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  try {
    switch (toolName) {
      case "web_search": {
        const result = await executeWebSearch(toolInput.query as string);
        return JSON.stringify(result);
      }
      case "n8n_webhook": {
        const result = await executeN8nWebhook(
          toolInput.workflow_name as string,
          (toolInput.payload as Record<string, unknown>) ?? {}
        );
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return JSON.stringify({ error: message });
  }
}
