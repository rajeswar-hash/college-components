import { normalizeCategory } from "@/lib/types";
import { getListingImagePlaceholderUrl, getListingImageUrl } from "@/lib/storage";

const NOTES_PREVIEW_IMAGE = `${import.meta.env.BASE_URL}notes-preview-default.jpeg`;
const MAX_SAFE_IMAGE_REF_LENGTH = 600;

export function getSafeListingImageRefs(images?: string[] | null) {
  return (images || []).filter((image) => {
    if (!image) return false;
    if (image.length > MAX_SAFE_IMAGE_REF_LENGTH) return false;
    if (/^(data:|blob:)/i.test(image)) return false;
    return true;
  });
}

export function getBuiltInListingImageUrls() {
  return [NOTES_PREVIEW_IMAGE];
}

export function getListingPreviewImages(category?: string | null, images?: string[] | null) {
  const safeImages = getSafeListingImageRefs(images);
  if (safeImages.length > 0) {
    return safeImages.map((image) => getListingImageUrl(image, "preview"));
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}

export function getListingPreviewPlaceholders(category?: string | null, images?: string[] | null) {
  const safeImages = getSafeListingImageRefs(images);
  if (safeImages.length > 0) {
    return safeImages.map((image) => getListingImagePlaceholderUrl(image, "preview"));
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
  const safeImages = getSafeListingImageRefs(images);
  if (safeImages.length > 0) {
    return safeImages.map((image) => getListingImageUrl(image, "detail"));
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}

export function getListingDetailPlaceholders(category?: string | null, images?: string[] | null) {
  const safeImages = getSafeListingImageRefs(images);
  if (safeImages.length > 0) {
    return safeImages.map((image) => getListingImagePlaceholderUrl(image, "detail"));
  }

  if (normalizeCategory(category || "") === "Notes") {
    return [NOTES_PREVIEW_IMAGE];
  }

  return [];
}
