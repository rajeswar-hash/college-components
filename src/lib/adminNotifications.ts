import { supabase } from "@/integrations/supabase/client";
import { trackHandledError } from "@/lib/errorTracking";

type ListingPendingReviewPayload = {
  title: string;
  price: number;
  category: string;
  college: string;
  sellerName: string;
};

type SellerVerificationPendingPayload = {
  name: string;
  email: string;
  college: string;
  phone: string;
};

async function sendAdminNotification(event: string, payload: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke("notify-admin-telegram", {
    body: {
      event,
      payload,
    },
  });

  if (error) {
    throw error;
  }
}

export async function notifyAdminListingPendingReview(payload: ListingPendingReviewPayload) {
  try {
    await sendAdminNotification("listing_pending_review", payload);
  } catch (error) {
    trackHandledError("admin-notify.listing-pending-review", error, payload);
  }
}

export async function notifyAdminSellerVerificationPending(payload: SellerVerificationPendingPayload) {
  try {
    await sendAdminNotification("seller_verification_pending", payload);
  } catch (error) {
    trackHandledError("admin-notify.seller-verification-pending", error, payload);
  }
}
