import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(
  replicateApiToken: string,
  input: Record<string, unknown>,
  signal: AbortSignal,
) {
  const response = await fetch("https://api.replicate.com/v1/models/openai/clip/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${replicateApiToken}`,
      Prefer: "wait",
    },
    body: JSON.stringify({ input }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Replicate request failed");
  }

  const data = await response.json();
  const output = data?.output;
  if (!Array.isArray(output) || output.length === 0 || !output.every((value: unknown) => typeof value === "number")) {
    throw new Error("Replicate output missing embedding");
  }

  return output as number[];
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
    const replicateApiToken = Deno.env.get("REPLICATE_API_TOKEN");

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

    if (!replicateApiToken) {
      return json(200, { status: "skipped", similarity: null, reason: "REPLICATE_API_TOKEN missing" });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const [imageEmbedding, textEmbedding] = await Promise.all([
        getEmbedding(replicateApiToken, { image: imageDataUrl }, controller.signal),
        getEmbedding(replicateApiToken, { text: `${category}. ${title}` }, controller.signal),
      ]);

      const similarity = Number(cosineSimilarity(imageEmbedding, textEmbedding).toFixed(4));

      if (similarity > 0.7) {
        return json(200, { status: "valid", similarity });
      }

      if (similarity >= 0.5) {
        return json(200, { status: "warning", similarity });
      }

      return json(200, { status: "invalid", similarity });
    } catch {
      return json(200, { status: "skipped", similarity: null, reason: "Replicate unavailable" });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return json(200, { status: "skipped", similarity: null, reason: "Unexpected error" });
  }
});
