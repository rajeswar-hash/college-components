const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MULTI_SPACE = /[ \t]{2,}/g;
const MULTI_NEWLINE = /\n{3,}/g;

function normalizeText(value: string) {
  return value.normalize("NFKC").replace(CONTROL_CHARS, "");
}

export function sanitizeSingleLineInput(value: string) {
  return normalizeText(value)
    .replace(/\r?\n|\r/g, " ")
    .replace(MULTI_SPACE, " ")
    .trim();
}

export function sanitizeMultilineInput(value: string) {
  return normalizeText(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(MULTI_SPACE, " ")
    .replace(MULTI_NEWLINE, "\n\n")
    .trim();
}

export function sanitizeEmailInput(value: string) {
  return sanitizeSingleLineInput(value).toLowerCase();
}
