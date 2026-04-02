import { useMemo, useState } from "react";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bot, MailCheck, RotateCcw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

const supportEmail = "rajeswarbind39@gmail.com";
const formSubmitEndpoint = `https://formsubmit.co/ajax/${supportEmail}`;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    text: "Hi, how can I help? Ask me anything about login, listings, likes, account deletion, filters, publishing, or contacting sellers.",
  },
];

function getBotReply(question: string) {
  const normalized = question.toLowerCase().trim();

  if (!normalized) {
    return "Type your question and I will help instantly.";
  }
  if (["hi", "hello", "hey", "hii", "helo"].some((word) => normalized === word || normalized.startsWith(`${word} `))) {
    return "Hi, how can I help? You can ask about sign in, registration, publishing a listing, likes, deleting your account, or contacting sellers.";
  }
  if (normalized.includes("login") || normalized.includes("sign in") || normalized.includes("signin")) {
    return "Use the exact email you registered with, type it in lowercase, and avoid extra spaces. If login still fails, create a fresh account once and try again after refreshing.";
  }
  if (normalized.includes("register") || normalized.includes("sign up") || normalized.includes("signup") || normalized.includes("create account")) {
    return "Open the Sign In popup, switch to Register, then fill your full name, college, WhatsApp number, email, and password. After account creation, you can start listing and liking items.";
  }
  if (normalized.includes("publish") || normalized.includes("listing") || normalized.includes("sell")) {
    return "To publish an item, sign in first, press Sell, add title, price, condition, category, details, and images, then press Publish Listing. Wait a moment if images are still preparing.";
  }
  if (normalized.includes("like") || normalized.includes("heart") || normalized.includes("favorite")) {
    return "You need to be logged in to like an item. Each account can like a listing once, and the total like count updates for everyone.";
  }
  if (normalized.includes("delete") || normalized.includes("remove account")) {
    return "Open your dashboard and use Delete Account. That permanently removes your account data and your linked listings.";
  }
  if (normalized.includes("college") || normalized.includes("university") || normalized.includes("filter")) {
    return "Start typing your college name and select the best match from the suggestions. The same college list is used in registration and filters for cleaner matching.";
  }
  if (normalized.includes("contact") || normalized.includes("seller") || normalized.includes("whatsapp")) {
    return "Open any listing and use the WhatsApp contact button to message the seller directly if the item is still available.";
  }
  if (normalized.includes("price") || normalized.includes("payment")) {
    return "College Components does not handle payments inside the app. Buyers and sellers discuss price and complete the exchange directly.";
  }
  if (normalized.includes("admin")) {
    return "The admin account opens a separate admin panel where marketplace status and management options are available.";
  }

  return "I can help with account access, registration, publishing items, likes, colleges, contacting sellers, and account deletion. If your issue is more specific, send it in the feedback form and it will go directly to support.";
}

export default function ContactPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const suggestedPrompts = useMemo(
    () => ["How do I publish a listing?", "Why is login failing?", "How can I delete my account?"],
    []
  );

  const sendChatMessage = (rawMessage?: string) => {
    const nextMessage = (rawMessage ?? chatInput).trim();

    if (!nextMessage) {
      toast.error("Please type a message for the help bot.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: nextMessage,
    };
    const botMessage: ChatMessage = {
      id: `${Date.now()}-bot`,
      role: "bot",
      text: getBotReply(nextMessage),
    };

    setChatMessages((current) => [...current, userMessage, botMessage]);
    setChatInput("");
  };

  const resetChat = () => {
    setChatMessages(initialMessages);
    setChatInput("");
  };

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
      formData.append("name", name.trim());
      formData.append("email", email.trim().toLowerCase());
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
      subtitle="Get instant help from the support bot or send detailed feedback directly to the team."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass border-border/70">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Instant Help Bot
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fresh chat every time this page opens. Nothing is stored.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetChat} className="shrink-0">
                <RotateCcw className="mr-2 h-4 w-4" /> New Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-blue-500/10 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-primary-foreground shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">College Components Help</p>
                  <p className="text-xs text-muted-foreground">Instant replies for common doubts</p>
                </div>
              </div>

              <div className="space-y-3 bg-[linear-gradient(180deg,rgba(15,118,110,0.04),rgba(14,165,233,0.03))] px-3 py-4">
                {chatMessages.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        chat.role === "user"
                          ? "rounded-br-md bg-gradient-to-r from-teal-500 to-sky-500 text-white"
                          : "rounded-bl-md border border-border/70 bg-background text-foreground"
                      }`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 bg-background p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendChatMessage(prompt)}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="bg-background/90"
                  />
                  <Button
                    onClick={() => sendChatMessage()}
                    className="shrink-0 gradient-bg border-0 text-primary-foreground hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Feedback & Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              Send a suggestion, report an issue, or share product ideas. Messages are sent directly to the College Components support inbox.
            </div>
            <div className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              Add the issue clearly, mention the page where it happened, and include your contact email so the team can reply faster.
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
