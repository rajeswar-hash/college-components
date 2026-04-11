import { useState } from "react";
import { Link } from "react-router-dom";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bot, MailCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { sanitizeEmailInput, sanitizeMultilineInput, sanitizeSingleLineInput } from "@/lib/inputSecurity";

const supportEmail = "rajeswarbind39@gmail.com";
const businessEmail = "businesscampuskart@gmail.com";
const formSubmitEndpoint = `https://formsubmit.co/ajax/${supportEmail}`;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please complete all contact form fields.");
      return;
    }

    if (!emailPattern.test(email.trim().toLowerCase())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      const cleanName = sanitizeSingleLineInput(name);
      const cleanEmail = sanitizeEmailInput(email);
      const cleanSubject = sanitizeSingleLineInput(subject);
      const cleanMessage = sanitizeMultilineInput(message);
      const uniqueSubject = `${cleanName} | ${cleanSubject} | ${new Date().toLocaleString("en-IN")}`;

      formData.append("name", cleanName);
      formData.append("email", cleanEmail);
      formData.append("subject", uniqueSubject);
      formData.append("_subject", uniqueSubject);
      formData.append("_replyto", cleanEmail);
      formData.append("message", cleanMessage);
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
      subtitle="Open the help bot in a dedicated chat page or send detailed feedback directly to the team."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Open Help Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(14,165,233,0.10))] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-bg text-primary-foreground shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Fresh support chat</p>
                  <p className="text-sm text-muted-foreground">Opens on a separate page with a new conversation every time.</p>
                </div>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Use it for quick doubts like login problems, publishing items, likes, filters, and account questions.
              </p>
              <Button asChild className="gradient-bg border-0 text-primary-foreground hover:opacity-90">
                <Link to="/help-bot">Open Help Bot</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Business & Partnerships</p>
              <p className="mt-2 leading-6">
                For business inquiries, partnerships, or collaboration opportunities, email{" "}
                <a href={`mailto:${businessEmail}`} className="font-medium text-primary hover:underline">
                  {businessEmail}
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Feedback & Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Send a suggestion, report an issue, or share product ideas. Messages are sent directly to the CampusKart support inbox.
            </div>
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
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={email && !emailPattern.test(email.trim().toLowerCase()) ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {email && !emailPattern.test(email.trim().toLowerCase()) && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <MailCheck className="h-3.5 w-3.5" /> Enter a valid email address.
                  </p>
                )}
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
