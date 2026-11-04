type MetaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MetaResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

export async function askMeta(messages: MetaMessage[]): Promise<string> {
  const apiKey = process.env.META_API_KEY;
  const model = process.env.META_MODEL || "muse-spark-1.3";

  if (!apiKey) {
    throw new Error("META_API_KEY is missing from your environment variables.");
  }

  const response = await fetch("https://api.meta.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });

  const rawText = await response.text();

  if (!rawText.trim()) {
    throw new Error(
      `Meta API returned an empty response (HTTP ${response.status}).`,
    );
  }

  let data: MetaResponse;

  try {
    data = JSON.parse(rawText) as MetaResponse;
  } catch {
    console.error("Meta API returned non-JSON content", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });

    throw new Error(
      `Meta API returned an invalid response (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    console.error("Meta API request failed", {
      status: response.status,
      message: data.error?.message,
      code: data.error?.code,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Meta API authentication failed. Check your API key and account access.",
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Meta AI is receiving too many requests. Please try again shortly.",
      );
    }

    throw new Error(
      data.error?.message ||
        `Meta API request failed (HTTP ${response.status}).`,
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Meta AI returned no usable response.");
  }

  return content.trim();
}
