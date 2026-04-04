export type QwenVerificationResult =
  | { status: "approved"; response: "YES" }
  | { status: "rejected"; response: "NO" }
  | { status: "low_confidence"; response: "UNSURE" }
  | { status: "skipped"; response: "SKIPPED" };

const QWEN_ENDPOINT = import.meta.env.VITE_QWEN_API_URL;
const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;
const QWEN_MODEL = import.meta.env.VITE_QWEN_MODEL || "qwen-vl-plus";

export async function verifyListingImageWithQwen(params: {
  title: string;
  category: string;
  imageDataUrl: string;
}): Promise<QwenVerificationResult> {
  if (!QWEN_ENDPOINT || !QWEN_API_KEY) {
    return { status: "skipped", response: "SKIPPED" };
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(QWEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${QWEN_API_KEY}`,
      },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Check if the uploaded image matches the product title and category.\nTitle: ${params.title}\nCategory: ${params.category}\nRespond strictly with:\nYES / NO / UNSURE`,
              },
              {
                type: "image_url",
                image_url: {
                  url: params.imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { status: "skipped", response: "SKIPPED" };
    }

    const data = await response.json();
    const text = String(
      data?.choices?.[0]?.message?.content?.[0]?.text ??
        data?.choices?.[0]?.message?.content ??
        data?.output?.text ??
        ""
    )
      .trim()
      .toUpperCase();

    if (text.includes("YES")) return { status: "approved", response: "YES" };
    if (text.includes("NO")) return { status: "rejected", response: "NO" };
    if (text.includes("UNSURE")) return { status: "low_confidence", response: "UNSURE" };
    return { status: "skipped", response: "SKIPPED" };
  } catch {
    return { status: "skipped", response: "SKIPPED" };
  } finally {
    window.clearTimeout(timeout);
  }
}
