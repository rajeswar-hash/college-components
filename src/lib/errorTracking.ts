import { supabase } from "@/integrations/supabase/client";

type ErrorSeverity = "error" | "warning";

interface ClientErrorLogPayload {
  message: string;
  stack?: string | null;
  route?: string | null;
  source: string;
  severity?: ErrorSeverity;
  context?: Record<string, unknown> | null;
}

const recentErrorMap = new Map<string, number>();
const ERROR_THROTTLE_MS = 30 * 1000;

function getRouteSnapshot() {
  if (typeof window === "undefined") return null;
  return `${window.location.pathname}${window.location.hash}${window.location.search}`;
}

function toSafeContext(context?: Record<string, unknown> | null) {
  if (!context) return null;
  try {
    return JSON.parse(JSON.stringify(context));
  } catch {
    return null;
  }
}

async function getCurrentUserSnapshot() {
  try {
    const { data } = await supabase.auth.getUser();
    return {
      userId: data.user?.id ?? null,
      userEmail: data.user?.email ?? null,
    };
  } catch {
    return {
      userId: null,
      userEmail: null,
    };
  }
}

function shouldThrottle(key: string) {
  const now = Date.now();
  const previous = recentErrorMap.get(key) ?? 0;
  if (now - previous < ERROR_THROTTLE_MS) return true;
  recentErrorMap.set(key, now);
  return false;
}

export async function logClientError(payload: ClientErrorLogPayload) {
  const route = payload.route ?? getRouteSnapshot();
  const dedupeKey = `${payload.source}:${route}:${payload.message}`;
  if (shouldThrottle(dedupeKey)) return;

  const { userId, userEmail } = await getCurrentUserSnapshot();

  await (supabase as any).from("frontend_error_logs").insert({
    message: payload.message.slice(0, 1000),
    stack: payload.stack?.slice(0, 8000) || null,
    route,
    source: payload.source.slice(0, 120),
    severity: payload.severity ?? "error",
    context: toSafeContext(payload.context),
    user_id: userId,
    user_email: userEmail,
  });
}

export function trackHandledError(source: string, error: unknown, context?: Record<string, unknown>) {
  const normalized =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown client error");

  void logClientError({
    message: normalized.message,
    stack: normalized.stack,
    source,
    severity: "error",
    context,
  });
}

export function installGlobalErrorTracking() {
  const handleWindowError = (event: ErrorEvent) => {
    void logClientError({
      message: event.message || "Unhandled window error",
      stack: event.error?.stack || null,
      source: "window.error",
      severity: "error",
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const normalized =
      reason instanceof Error
        ? reason
        : new Error(typeof reason === "string" ? reason : "Unhandled promise rejection");

    void logClientError({
      message: normalized.message,
      stack: normalized.stack,
      source: "window.unhandledrejection",
      severity: "error",
      context: null,
    });
  };

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
