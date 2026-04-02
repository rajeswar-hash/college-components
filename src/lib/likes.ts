import { supabase } from "@/integrations/supabase/client";

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

  return {
    liked: nextLiked,
    likes: data ?? Math.max(0, currentLikes + (nextLiked ? 1 : -1)),
  };
}
