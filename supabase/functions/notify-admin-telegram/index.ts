const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMessage(event: string, payload: Record<string, unknown>) {
  if (event === "seller_verification_pending") {
    return [
      "🔔 <b>New seller verification pending</b>",
      "",
      `<b>Name:</b> ${escapeHtml(payload.name)}`,
      `<b>Email:</b> ${escapeHtml(payload.email)}`,
      `<b>Phone:</b> ${escapeHtml(payload.phone)}`,
      `<b>College:</b> ${escapeHtml(payload.college)}`,
    ].join("\n");
  }

  return [
    "🔔 <b>New listing pending review</b>",
    "",
    `<b>Title:</b> ${escapeHtml(payload.title)}`,
    `<b>Price:</b> ₹${escapeHtml(payload.price)}`,
    `<b>Category:</b> ${escapeHtml(payload.category)}`,
    `<b>College:</b> ${escapeHtml(payload.college)}`,
    `<b>Seller:</b> ${escapeHtml(payload.sellerName)}`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      return json(200, { status: "skipped", reason: "Telegram secrets not configured" });
    }

    const { event, payload } = await req.json();
    if (!event || !payload || typeof payload !== "object") {
      return json(400, { error: "Missing event or payload" });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(String(event), payload as Record<string, unknown>),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      return json(200, {
        status: "failed",
        reason: result?.description || `Telegram request failed (${response.status})`,
      });
    }

    return json(200, { status: "sent" });
  } catch {
    return json(200, { status: "failed", reason: "Unexpected error" });
  }
});
