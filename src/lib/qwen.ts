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
                text: `Check whether the uploaded image clearly matches the product title and category.\nBe strict.\nIf the image is a building, landscape, person, unrelated object, or does not clearly show the product/service in the title, answer NO.\nIf the match is not clear enough, answer UNSURE.\nTitle: ${params.title}\nCategory: ${params.category}\nRespond with exactly one word only:\nYES\nNO\nUNSURE`,
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
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    if (text === "YES") return { status: "approved", response: "YES" };
    if (text === "NO") return { status: "rejected", response: "NO" };
    if (text === "UNSURE") return { status: "low_confidence", response: "UNSURE" };
    return { status: "skipped", response: "SKIPPED" };
  } catch {
    return { status: "skipped", response: "SKIPPED" };
  } finally {
    window.clearTimeout(timeout);
  }
}
