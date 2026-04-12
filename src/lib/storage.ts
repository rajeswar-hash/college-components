import { supabase } from "@/integrations/supabase/client";

export const LISTING_MEDIA_BUCKET = "listing-media";
const STORAGE_PREVIEW_SIZE = 480;
const STORAGE_DETAIL_SIZE = 1800;
const STORAGE_TINY_SIZE = 36;

const publicUrlCache = new Map<string, string>();

function isAbsoluteImageUrl(value: string) {
  return /^(data:|blob:|https?:\/\/|\/)/i.test(value);
}

export function isStorageImagePath(value?: string | null) {
  if (!value) return false;
  return !isAbsoluteImageUrl(value);
}

export function getListingImageUrl(imageRef?: string | null, variant: "preview" | "detail" = "preview") {
  if (!imageRef) return "";
  if (!isStorageImagePath(imageRef)) return imageRef;

  const cacheKey = `${variant}:${imageRef}`;
  const cached = publicUrlCache.get(cacheKey);
  if (cached) return cached;

  const transform =
    variant === "preview"
      ? {
          width: STORAGE_PREVIEW_SIZE,
          height: STORAGE_PREVIEW_SIZE,
          resize: "cover" as const,
          quality: 62,
        }
      : {
          width: STORAGE_DETAIL_SIZE,
          height: STORAGE_DETAIL_SIZE,
          resize: "contain" as const,
          quality: 92,
        };

  const { data } = supabase.storage.from(LISTING_MEDIA_BUCKET).getPublicUrl(imageRef, { transform });
  publicUrlCache.set(cacheKey, data.publicUrl);
  return data.publicUrl;
}

export function getListingImagePlaceholderUrl(imageRef?: string | null, variant: "preview" | "detail" = "preview") {
  if (!imageRef) return "";
  if (!isStorageImagePath(imageRef)) return imageRef;

  const cacheKey = `placeholder:${variant}:${imageRef}`;
  const cached = publicUrlCache.get(cacheKey);
  if (cached) return cached;

  const transform =
    variant === "preview"
      ? {
          width: STORAGE_TINY_SIZE,
          height: STORAGE_TINY_SIZE,
          resize: "cover" as const,
          quality: 24,
        }
      : {
          width: 48,
          height: 48,
          resize: "cover" as const,
          quality: 28,
        };

  const { data } = supabase.storage.from(LISTING_MEDIA_BUCKET).getPublicUrl(imageRef, { transform });
  publicUrlCache.set(cacheKey, data.publicUrl);
  return data.publicUrl;
}

export async function uploadListingImages(
  sellerId: string,
  listingId: string,
  files: File[],
) {
  const uploadedPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const path = `${sellerId}/${listingId}/${Date.now()}-${index}.webp`;
    const { error } = await supabase.storage.from(LISTING_MEDIA_BUCKET).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type || "image/webp",
      upsert: false,
    });

    if (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(LISTING_MEDIA_BUCKET).remove(uploadedPaths);
      }
      throw error;
    }

    uploadedPaths.push(path);
  }

  return uploadedPaths;
}

export async function deleteListingImages(imageRefs?: string[] | null) {
  const storagePaths = (imageRefs || []).filter(isStorageImagePath);
  if (storagePaths.length === 0) return;

  try {
    await supabase.storage.from(LISTING_MEDIA_BUCKET).remove(storagePaths);
  } catch {
    // Best-effort cleanup only.
  }
}
