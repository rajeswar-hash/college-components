const RETRYABLE_ERROR_PATTERNS = [
  "fetch",
  "network",
  "timed out",
  "timeout",
  "gateway",
  "temporarily unavailable",
  "failed to fetch",
  "load failed",
  "503",
  "502",
  "504",
];

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return String((error as { message: string }).message);
  }
  return "";
}

export function isRetryableSupabaseError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  if (!message) return false;
  return RETRYABLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export async function retrySupabaseOperation<T>(
  operation: () => Promise<T>,
  {
    attempts = 2,
    baseDelayMs = 250,
  }: {
    attempts?: number;
    baseDelayMs?: number;
  } = {},
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < attempts - 1 && isRetryableSupabaseError(error);
      if (!shouldRetry) break;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}
