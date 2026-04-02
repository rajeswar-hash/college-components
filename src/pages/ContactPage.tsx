import { useMemo, useState } from "react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

const supportEmail = "rajeswarbind39@gmail.com";
const formSubmitEndpoint = `https://formsubmit.co/ajax/${supportEmail}`;

function getBotReply(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes("login") || normalized.includes("sign in") || normalized.includes("account")) {
    return "Please make sure your email is typed in lowercase without extra spaces. If your account was created recently, sign in again after refreshing the page.";
  }
  if (normalized.includes("publish") || normalized.includes("listing") || normalized.includes("sell")) {
    return "To publish a listing, sign in, open Sell, add the product details, wait for image preparation to finish, and then press Publish Listing.";
  }
  if (normalized.includes("delete") || normalized.includes("remove account")) {
    return "Signed-in users can permanently delete their account from the dashboard. That also removes their linked profile and listings.";
  }
  if (normalized.includes("price") || normalized.includes("payment")) {
    return "Buyers and sellers handle pricing and exchange directly. The platform currently provides discovery and communication tools, not built-in payments.";
  }

  return "For simple platform questions, try keywords like login, listing, publish, delete account, or payment. For anything else, send a message through the feedback form below.";
}

export default function ContactPage() {
  const [question, setQuestion] = useState("");
  const [botReply, setBotReply] = useState("Ask a simple question and the helper bot will give a quick platform answer.");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const suggestedPrompts = useMemo(
    () => ["How do I publish a listing?", "Why is login failing?", "How can I delete my account?"],
    []
  );

  const handleAskBot = () => {
    if (!question.trim()) {
      toast.error("Please enter a question for the help bot.");
      return;
    }

    setBotReply(getBotReply(question));
  };

  const handleSendFeedback = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please complete all contact form fields.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("subject", `[College Components] ${subject.trim()}`);
      formData.append("message", message.trim());
      formData.append("_template", "table");
      formData.append("_captcha", "false");

      const response = await fetch(formSubmitEndpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || "Could not send your message.");
      }

      toast.success("Message sent successfully.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast.error(error?.message || "Could not send your message right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicPageLayout
      title="Contact Us"
      subtitle="Get quick help, ask simple questions with the support bot, or send professional feedback and suggestions directly to the team."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Help Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
              {botReply}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-question">Ask a quick question</Label>
              <Input
                id="bot-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: How do I publish a listing?"
              />
            </div>
            <Button onClick={handleAskBot} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
              <MessageSquare className="mr-2 h-4 w-4" /> Ask Bot
            </Button>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Suggested questions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setQuestion(prompt);
                      setBotReply(getBotReply(prompt));
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Feedback & Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input id="contact-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Feedback, issue report, or suggestion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Write your feedback or suggestion here..."
              />
            </div>
            <Button onClick={handleSendFeedback} disabled={sending} className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90">
              <Send className="mr-2 h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
