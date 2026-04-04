import { supabase } from "@/integrations/supabase/client";

const CART_EVENT = "campuskart-cart-updated";

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
}

export function onCartUpdated(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CART_EVENT, callback);
  return () => window.removeEventListener(CART_EVENT, callback);
}

export async function hasUserLikedListing(listingId: string, userId: string) {
  const { data, error } = await supabase.rpc("has_user_liked_listing", {
    p_listing_id: listingId,
  });

  if (error) throw error;

  return !!data && !!userId;
}

export async function toggleListingLike(listingId: string, currentLikes: number, currentlyLiked: boolean) {
  const nextLiked = !currentlyLiked;

  const { data, error } = await supabase.rpc("toggle_listing_like_v2", {
    p_listing_id: listingId,
    p_should_like: nextLiked,
  });

  if (error) throw error;
  notifyCartUpdated();

  return {
    liked: nextLiked,
    likes: data ?? Math.max(0, currentLikes + (nextLiked ? 1 : -1)),
  };
}

export async function getSavedListingIds(userId: string) {
  const { data, error } = await supabase
    .from("listing_likes")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getSavedListingsCount(userId: string) {
  const { count, error } = await supabase
    .from("listing_likes")
    .select("listing_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return count || 0;
}
