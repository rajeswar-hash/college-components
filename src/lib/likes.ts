import { supabase } from "@/integrations/supabase/client";

const CART_EVENT = "campuskart-cart-updated";
const GUEST_CART_KEY = "campuskart-guest-cart";

function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
}

function readGuestCartIds() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function writeGuestCartIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(ids));
}

export function onCartUpdated(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CART_EVENT, callback);
  return () => window.removeEventListener(CART_EVENT, callback);
}

export async function hasUserLikedListing(listingId: string, userId?: string | null) {
  if (!userId) {
    return readGuestCartIds().includes(listingId);
  }

  const { data, error } = await supabase.rpc("has_user_liked_listing", {
    p_listing_id: listingId,
  });

  if (error) throw error;

  return !!data && !!userId;
}

export async function toggleListingLike(listingId: string, currentLikes: number, currentlyLiked: boolean, userId?: string | null) {
  const nextLiked = !currentlyLiked;

  if (!userId) {
    const currentGuestIds = readGuestCartIds();
    const nextGuestIds = nextLiked
      ? Array.from(new Set([...currentGuestIds, listingId]))
      : currentGuestIds.filter((id) => id !== listingId);
    writeGuestCartIds(nextGuestIds);
    notifyCartUpdated();

    return {
      liked: nextLiked,
      likes: currentLikes,
    };
  }

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

export async function getSavedListingIds(userId?: string | null) {
  if (!userId) {
    return readGuestCartIds().map((listing_id) => ({
      listing_id,
      created_at: new Date(0).toISOString(),
    }));
  }

  const { data, error } = await supabase
    .from("listing_likes")
    .select("listing_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getSavedListingsCount(userId?: string | null) {
  if (!userId) {
    return readGuestCartIds().length;
  }

  const { count, error } = await supabase
    .from("listing_likes")
    .select("listing_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return count || 0;
}
