import { normalizeCategory } from "@/lib/types";

const NOTES_PREVIEW_IMAGE = `${import.meta.env.BASE_URL}notes-preview-default.jpeg`;

export function getListingPreviewImages(category?: string | null, images?: string[] | null) {
  if (images && images.length > 0) {
    return images.filter(Boolean);
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}

export function getListingCoverImage(category?: string | null, images?: string[] | null) {
  return getListingPreviewImages(category, images)[0] || "";
}
