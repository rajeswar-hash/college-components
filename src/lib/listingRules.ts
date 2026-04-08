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
    helper: "Offer neat handwritten files, notes, assignments, and record work with a fair per-page rate.",
    maxPrice: 20,
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
    requiresYearSubjectBranch: false,
    requiresAiCheck: false,
    aiCategoryLabel: "Notes",
    priceLabel: "Price",
  },
  Components: {
    category: "Components",
    helper: "Clear product images help buyers trust the exact part faster.",
    maxPrice: 10000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Like New", "Fair", "Used"],
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
    maxPrice: 20000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Like New", "Fair", "Used"],
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
    maxPrice: 10000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Like New", "Fair", "Used"],
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
    maxPrice: 1000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Like New", "Fair", "Used"],
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
    maxPrice: 40000,
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
    maxPrice: 30000,
    requiresCondition: true,
    allowsConditionOptions: ["New", "Like New", "Fair", "Used"],
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

function isLikelyHumanWord(word: string) {
  const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return false;
  if (cleaned.length <= 2) return true;
  if (/^\d+$/.test(cleaned)) return true;

  const vowelCount = (cleaned.match(/[aeiou]/g) || []).length;
  const uniqueChars = new Set(cleaned).size;
  const hasCommonBlend = /(ing|tion|ment|able|with|from|your|camp|book|note|wire|chip|used|good|clean|year|sem|calc|kit|set|pdf|drive)/.test(cleaned);
  const longConsonantRun = /[^aeiou]{6,}/.test(cleaned);
  const repeatedPattern = /(.)\1{3,}/.test(cleaned);

  if (repeatedPattern || longConsonantRun) return false;
  if (hasCommonBlend) return true;
  if (cleaned.length >= 5 && vowelCount === 0) return false;
  if (cleaned.length >= 6 && vowelCount <= 1 && uniqueChars >= 5) return false;
  if (cleaned.length >= 10 && vowelCount <= 2) return false;

  return true;
}

const DESCRIPTION_KEYWORDS = new Set([
  "assignment", "assignments", "available", "battery", "board", "book", "books", "box",
  "branch", "brand", "calculator", "cable", "cables", "charger", "chip", "clean", "college",
  "condition", "component", "components", "copy", "cover", "demo", "digital", "drive", "edition",
  "electronics", "engineering", "exam", "fair", "file", "files", "folder", "gadgets", "good",
  "handwriting", "included", "kit", "lab", "like", "manual", "mech", "model", "module", "new",
  "note", "notes", "original", "paper", "papers", "page", "pages", "pdf", "practical", "price",
  "project", "projects", "question", "record", "semester", "sem", "service", "selling", "set",
  "subject", "tool", "tools", "unit", "uno", "used", "very", "wire", "wires", "working", "year",
  "author", "edition", "topic", "language", "neat", "ready", "robot", "arduino", "booklet",
]);

export function hasClearHumanDescription(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length < 10) return false;

  const humanWords = words.filter(isLikelyHumanWord);
  const suspiciousWords = words.length - humanWords.length;
  const humanRatio = humanWords.length / words.length;
  const suspiciousRatio = suspiciousWords / words.length;
  const hasMeaningfulPhrase = /[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}/i.test(value);
  const normalizedWords = words.map((word) => word.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean);
  const keywordMatches = normalizedWords.filter((word) => DESCRIPTION_KEYWORDS.has(word)).length;
  const averageWordLength =
    normalizedWords.reduce((total, word) => total + word.length, 0) / Math.max(normalizedWords.length, 1);
  const veryLongWordCount = normalizedWords.filter((word) => word.length >= 12).length;

  return (
    humanRatio >= 0.7 &&
    suspiciousRatio <= 0.3 &&
    hasMeaningfulPhrase &&
    keywordMatches >= 2 &&
    averageWordLength <= 9 &&
    veryLongWordCount <= Math.max(2, Math.floor(normalizedWords.length * 0.2))
  );
}
