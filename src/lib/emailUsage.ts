import { supabase } from "@/integrations/supabase/client";

export async function trackEmailDispatch(
  emailType: "register_otp" | "forgot_password_otp",
  triggerSource: string,
  recipientEmail?: string
) {
  try {
    await (supabase as any).rpc("log_email_dispatch", {
      p_email_type: emailType,
      p_trigger_source: triggerSource,
      p_recipient_email: recipientEmail || null,
    });
  } catch {
    // We never block the user flow if metrics logging is unavailable.
  }
}
