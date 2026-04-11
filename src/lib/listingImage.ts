import { normalizeCategory } from "@/lib/types";
import { getListingImageUrl } from "@/lib/storage";

const NOTES_PREVIEW_IMAGE = `${import.meta.env.BASE_URL}notes-preview-default.jpeg`;

export function getListingPreviewImages(category?: string | null, images?: string[] | null) {
  if (images && images.length > 0) {
    return images.filter(Boolean).map((image) => getListingImageUrl(image, "preview"));
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}

export function getListingCoverImage(category?: string | null, images?: string[] | null) {
  return getListingPreviewImages(category, images)[0] || "";
}

export function getListingDetailImages(category?: string | null, images?: string[] | null) {
  if (images && images.length > 0) {
    return images.filter(Boolean).map((image) => getListingImageUrl(image, "detail"));
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}
