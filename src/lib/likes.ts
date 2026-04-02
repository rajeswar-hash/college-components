import { supabase } from "@/integrations/supabase/client";

export async function hasUserLikedListing(listingId: string, userId: string) {
  const { data, error } = await supabase
    .from("listing_likes")
    .select("listing_id")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export async function toggleListingLike(listingId: string, currentLikes: number, currentlyLiked: boolean) {
  const nextLiked = !currentlyLiked;

  const { data, error } = await supabase.rpc("toggle_listing_like", {
    listing_id: listingId,
    should_like: nextLiked,
  });

  if (error) throw error;

  return {
    liked: nextLiked,
    likes: data ?? Math.max(0, currentLikes + (nextLiked ? 1 : -1)),
  };
}
