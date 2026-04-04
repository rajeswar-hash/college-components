import { Category, Condition } from "@/lib/types";

export interface CategoryRule {
  category: Category;
  helper: string;
  maxPrice: number;
  requiresCondition: boolean;
  allowsConditionOptions: Condition[];
  requiresImages: boolean;
  imageLabel: string;
  imageHint: string;
  imageMinimum: number;
  requiresDriveLink: boolean;
  driveLinkLabel?: string;
  driveLinkHint?: string;
  requiresYearSubjectBranch: boolean;
  requiresAiCheck: boolean;
  aiCategoryLabel: string;
  priceLabel: string;
}

export const CATEGORY_RULES: Record<Category, CategoryRule> = {
  "Handwriting Service": {
    category: "Handwriting Service",
    helper: "Upload a handwriting sample and set a fair price per page.",
    maxPrice: 50,
    requiresCondition: false,
    allowsConditionOptions: [],
    requiresImages: true,
    imageLabel: "Upload handwriting sample",
    imageHint: "At least one handwriting sample is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: false,
    aiCategoryLabel: "Handwriting Service",
    priceLabel: "Price per page",
  },
  Notes: {
    category: "Notes",
    helper: "Digital notes only. Include year, subject, and branch clearly in the description.",
    maxPrice: 100,
    requiresCondition: false,
    allowsConditionOptions: [],
    requiresImages: false,
    imageLabel: "Optional preview image",
    imageHint: "Optional preview only. Access must be delivered digitally after payment.",
    imageMinimum: 0,
    requiresDriveLink: true,
    driveLinkLabel: "Google Drive link",
    driveLinkHint: "Upload Google Drive link",
    requiresYearSubjectBranch: true,
    requiresAiCheck: false,
    aiCategoryLabel: "Notes",
    priceLabel: "Price",
  },
  "Question Papers": {
    category: "Question Papers",
    helper: "Digital question papers only. Mention year, subject, and branch in the description.",
    maxPrice: 100,
    requiresCondition: false,
    allowsConditionOptions: [],
    requiresImages: false,
    imageLabel: "Optional preview image",
    imageHint: "Optional preview only. Share digitally after payment.",
    imageMinimum: 0,
    requiresDriveLink: true,
    driveLinkLabel: "Google Drive link",
    driveLinkHint: "Upload Google Drive link",
    requiresYearSubjectBranch: true,
    requiresAiCheck: false,
    aiCategoryLabel: "Question Papers",
    priceLabel: "Price",
  },
  Components: {
    category: "Components",
    helper: "Clear product images help buyers trust the exact part faster.",
    maxPrice: 5000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Used"],
    requiresImages: true,
    imageLabel: "Upload product images",
    imageHint: "At least one product image is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: true,
    aiCategoryLabel: "Components",
    priceLabel: "Price",
  },
  Gadgets: {
    category: "Gadgets",
    helper: "Use clear gadget photos so buyers can verify the model quickly.",
    maxPrice: 5000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Used"],
    requiresImages: true,
    imageLabel: "Upload product images",
    imageHint: "At least one product image is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: true,
    aiCategoryLabel: "Gadgets",
    priceLabel: "Price",
  },
  Tools: {
    category: "Tools",
    helper: "Show the actual tool condition clearly so buyers know what to expect.",
    maxPrice: 5000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Used"],
    requiresImages: true,
    imageLabel: "Upload product images",
    imageHint: "At least one product image is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: true,
    aiCategoryLabel: "Tools",
    priceLabel: "Price",
  },
  Books: {
    category: "Books",
    helper: "Show the book cover clearly and mention edition, branch, or semester when relevant.",
    maxPrice: 500,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Used"],
    requiresImages: true,
    imageLabel: "Upload book images",
    imageHint: "At least one image of the book is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: false,
    aiCategoryLabel: "Books",
    priceLabel: "Price",
  },
  Projects: {
    category: "Projects",
    helper: "Images are optional but recommended. A demo or drive link helps buyers understand the project faster.",
    maxPrice: 5000,
    requiresCondition: false,
    allowsConditionOptions: [],
    requiresImages: false,
    imageLabel: "Upload project images",
    imageHint: "Optional but recommended for faster trust",
    imageMinimum: 0,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: false,
    aiCategoryLabel: "Projects",
    priceLabel: "Price",
  },
  Others: {
    category: "Others",
    helper: "Clear photos and a specific title help buyers understand unusual items quickly.",
    maxPrice: 5000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Used"],
    requiresImages: true,
    imageLabel: "Upload product images",
    imageHint: "At least one product image is required",
    imageMinimum: 1,
    requiresDriveLink: false,
    requiresYearSubjectBranch: false,
    requiresAiCheck: true,
    aiCategoryLabel: "Others",
    priceLabel: "Price",
  },
};

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function normalizeListingTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isGoogleDriveLink(value: string) {
  try {
    const url = new URL(value);
    return /(^|\.)drive\.google\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function hasYearSubjectBranch(value: string) {
  const text = value.toLowerCase();
  const hasYear = /\b(20\d{2}|1st|2nd|3rd|4th|fy|sy|ty|final year)\b/.test(text);
  const hasSubject = /\b(subject|paper|module|topic|course|unit|semester|sem)\b/.test(text);
  const hasBranch = /\b(cse|it|ece|eee|mech|civil|branch|engineering|cs|electrical|mechanical)\b/.test(text);
  return hasYear && hasSubject && hasBranch;
}
