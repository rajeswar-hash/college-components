import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VerifyResponse =
  | { status: "approved"; response: "YES" }
  | { status: "rejected"; response: "NO" }
  | { status: "low_confidence"; response: "UNSURE" }
  | { status: "skipped"; response: "SKIPPED" };

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function extractDecision(data: any): VerifyResponse {
  const rawText =
    data?.output_text ||
    data?.output
      ?.flatMap((item: any) => item?.content || [])
      ?.map((content: any) => content?.text || content?.output_text || "")
      ?.join(" ") ||
    "";

  const text = String(rawText).trim().toUpperCase().replace(/[^A-Z]/g, "");

  if (text === "YES") return { status: "approved", response: "YES" };
  if (text === "NO") return { status: "rejected", response: "NO" };
  if (text === "UNSURE") return { status: "low_confidence", response: "UNSURE" };
  return { status: "skipped", response: "SKIPPED" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { error: "Missing authorization" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    if (!supabaseUrl || !supabaseAnonKey) {
      return json(500, { error: "Supabase environment is not configured" });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return json(401, { error: "Unauthorized" });
    }

    const { title, category, imageDataUrl } = await req.json();
    if (!title || !category || !imageDataUrl) {
      return json(400, { error: "Missing title, category, or image" });
    }

    if (!openaiApiKey) {
      return json(200, { status: "skipped", response: "SKIPPED", reason: "OPENAI_API_KEY missing" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          input: [
            {
              role: "developer",
              content: [
                {
                  type: "input_text",
                  text: "You are a strict marketplace product image verifier. Reply with exactly one word: YES, NO, or UNSURE.",
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text:
                    `Check whether the uploaded image clearly matches the product title and category.\n` +
                    `Be strict.\n` +
                    `If the image is a building, scenery, unrelated person, unrelated object, or does not clearly show the item/service in the title, answer NO.\n` +
                    `If the match is unclear, answer UNSURE.\n` +
                    `Title: ${title}\n` +
                    `Category: ${category}`,
                },
                {
                  type: "input_image",
                  image_url: imageDataUrl,
                  detail: "low",
                },
              ],
            },
          ],
          max_output_tokens: 5,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return json(200, { status: "skipped", response: "SKIPPED", reason: "OpenAI request failed" });
      }

      const data = await response.json();
      return json(200, extractDecision(data));
    } catch {
      return json(200, { status: "skipped", response: "SKIPPED", reason: "OpenAI unavailable" });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json(200, { status: "skipped", response: "SKIPPED", reason: "Unexpected error" });
  }
});
