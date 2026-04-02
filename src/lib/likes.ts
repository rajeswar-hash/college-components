import { supabase } from "@/integrations/supabase/client";

const LIKES_KEY = "cc_likes";

export function getLikedIds(): string[] {
  const stored = localStorage.getItem(LIKES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function isListingLiked(listingId: string) {
  return getLikedIds().includes(listingId);
}

function saveLikedIds(ids: string[]) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(ids));
}

export function setListingLikedState(listingId: string, liked: boolean) {
  const current = new Set(getLikedIds());

  if (liked) {
    current.add(listingId);
  } else {
    current.delete(listingId);
  }

  saveLikedIds([...current]);
}

export async function toggleListingLike(listingId: string, currentLikes: number) {
  const liked = isListingLiked(listingId);
  const nextLiked = !liked;
  const nextLikes = Math.max(0, currentLikes + (nextLiked ? 1 : -1));

  const { data, error } = await supabase
    .from("listings")
    .update({ likes: nextLikes })
    .eq("id", listingId)
    .select("likes")
    .single();

  if (error) throw error;

  setListingLikedState(listingId, nextLiked);

  return {
    liked: nextLiked,
    likes: data?.likes ?? nextLikes,
  };
}
