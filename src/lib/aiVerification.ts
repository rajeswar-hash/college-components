import { supabase } from "@/integrations/supabase/client";

export type AIVerificationResult =
  | { status: "valid"; similarity: number }
  | { status: "warning"; similarity: number }
  | { status: "invalid"; similarity: number }
  | { status: "skipped"; similarity: null; reason?: string };

export async function verifyListingImageWithAI(params: {
  title: string;
  category: string;
  imageDataUrl: string;
}): Promise<AIVerificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke("verify-listing-image", {
      body: params,
    });

    if (error) {
      return { status: "skipped", similarity: null };
    }

    const status = data?.status;
    if (status === "valid" || status === "warning" || status === "invalid") {
      return { status, similarity: Number(data?.similarity ?? 0) };
    }

    return { status: "skipped", similarity: null, reason: data?.reason };
  } catch {
    return { status: "skipped", similarity: null };
  }
}
