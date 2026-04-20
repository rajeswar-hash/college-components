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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("SELLER_APPROVAL_FROM_EMAIL") || "CampusKart <onboarding@resend.dev>";

    const { email, name, college, status, rejectionReason } = await req.json();
    if (!email || !name) {
      return json(400, { error: "Missing email or name" });
    }

    if (!resendApiKey) {
      return json(200, { status: "skipped", reason: "RESEND_API_KEY missing" });
    }

    const normalizedStatus = status === "rejected" ? "rejected" : "approved";
    const subject =
      normalizedStatus === "approved"
        ? "Your CampusKart seller account is approved"
        : "CampusKart verification update";
    const html =
      normalizedStatus === "approved"
        ? `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2 style="margin-bottom:12px;">Your CampusKart seller account is approved</h2>
            <p>Hello ${String(name).replace(/</g, "&lt;")},</p>
            <p>Your account has been approved for selling items on CampusKart.</p>
            ${college ? `<p>Approved college: <strong>${String(college).replace(/</g, "&lt;")}</strong></p>` : ""}
            <p>You can now sign in and start posting listings.</p>
            <p>CampusKart</p>
          </div>
        `
        : `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
            <h2 style="margin-bottom:12px;">CampusKart verification update</h2>
            <p>Hello ${String(name).replace(/</g, "&lt;")},</p>
            <p>Your account could not be approved right now due to a general verification issue.</p>
            <p>${rejectionReason ? String(rejectionReason).replace(/</g, "&lt;") : "Please register again carefully with correct details and a clear current college ID card."}</p>
            <p>You can try again with the proper details.</p>
            <p>CampusKart</p>
          </div>
        `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      return json(200, { status: "skipped", reason: "Email provider request failed" });
    }

    return json(200, { status: "sent" });
  } catch {
    return json(200, { status: "skipped", reason: "Unexpected error" });
  }
});
