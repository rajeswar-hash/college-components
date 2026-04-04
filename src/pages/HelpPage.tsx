import { PublicPageLayout } from "@/components/PublicPageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bot, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

const faqs = [
  {
    question: "How do I create an account?",
    answer:
      "Open the sign in modal, switch to Register, fill in the full form, and press Create Account. CampusKart then sends an email OTP. After you verify that OTP, your account setup is completed.",
  },
  {
    question: "How do I publish a listing?",
    answer:
      "Open Sell Item, choose the right category first, add clear photos or the required file or link, write strong details, choose condition if needed, set the price, and post the item. Category-based price limits apply, and most product listings currently stay within Rs. 5,000.",
  },
  {
    question: "How do I contact a seller?",
    answer:
      "Open any product and use Contact on WhatsApp. Logged-out users and other buyers can contact the seller directly, but sellers cannot contact their own listing.",
  },
  {
    question: "Can I delete my account?",
    answer:
      "Yes. Signed-in users can use the Delete Account option, confirm with their password, and permanently remove their own account. Admin can also permanently delete non-admin accounts from Member Snapshot.",
  },
  {
    question: "Why is my sell button disabled?",
    answer:
      "If your WhatsApp number is missing or invalid, CampusKart blocks posting. Update your profile with a valid WhatsApp number before you list an item.",
  },
  {
    question: "What should I do after my item is sold?",
    answer:
      "Delete the listing once the item is sold so buyers do not waste time opening unavailable products.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "Use Forgot Password on the sign in form, enter your email, verify the OTP from your inbox, and then set a new password on the reset page.",
  },
];

export default function HelpPage() {
  return (
    <PublicPageLayout
      title="Help Center"
      subtitle="Get quick answers about accounts, listings, seller contact, cart saving, password reset, and the way CampusKart works today."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>Get help faster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Use the Help Bot for quick doubts, basic questions, and simple platform guidance without leaving the app.</p>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Use Contact Us for feedback, bug reports, or anything that needs a human reply.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>Keep listings honest, use a valid WhatsApp number, and delete sold items to build trust for the campus community.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/help-bot">
                <Button className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
                  <Sparkles className="mr-2 h-4 w-4" /> Open Help Bot
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageLayout>
  );
}