import { supabase } from "@/integrations/supabase/client";

export type AIVerificationResult =
  | { status: "approved"; response: "YES" }
  | { status: "rejected"; response: "NO" }
  | { status: "low_confidence"; response: "UNSURE" }
  | { status: "skipped"; response: "SKIPPED" };

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
      return { status: "skipped", response: "SKIPPED" };
    }

    const status = data?.status;
    if (status === "approved" || status === "rejected" || status === "low_confidence") {
      return {
        status,
        response:
          status === "approved"
            ? "YES"
            : status === "rejected"
              ? "NO"
              : "UNSURE",
      };
    }

    return { status: "skipped", response: "SKIPPED" };
  } catch {
    return { status: "skipped", response: "SKIPPED" };
  }
}
