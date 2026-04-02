import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, RotateCcw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    text: "Hi, how can I help? Ask me anything about login, registration, listings, likes, filters, publishing, or contacting sellers.",
  },
];

function getBotReply(question: string) {
  const normalized = question.toLowerCase().trim();

  if (!normalized) {
    return "Type your question and I will help instantly.";
  }
  if (["hi", "hello", "hey", "hii", "helo"].some((word) => normalized === word || normalized.startsWith(`${word} `))) {
    return "Hi, how can I help? You can ask about sign in, registration, publishing a listing, likes, account deletion, or contacting sellers.";
  }
  if (normalized.includes("login") || normalized.includes("sign in") || normalized.includes("signin")) {
    return "Use the exact email you registered with, type it in lowercase, and avoid extra spaces. If login still fails, refresh once and try again.";
  }
  if (normalized.includes("register") || normalized.includes("sign up") || normalized.includes("signup") || normalized.includes("create account")) {
    return "Open the account popup, switch to Register, then fill your full name, college, WhatsApp number, email, and password.";
  }
  if (normalized.includes("publish") || normalized.includes("listing") || normalized.includes("sell")) {
    return "Sign in first, press Sell, add the product details and images, then press Publish Listing. If images are still processing, wait a moment before submitting.";
  }
  if (normalized.includes("like") || normalized.includes("heart") || normalized.includes("favorite")) {
    return "You must be logged in to like a listing. Each account can like a product once, and the total count updates for all users.";
  }
  if (normalized.includes("delete") || normalized.includes("remove account")) {
    return "Go to your dashboard and use Delete Account. That permanently removes your account data and linked listings.";
  }
  if (normalized.includes("college") || normalized.includes("university") || normalized.includes("filter")) {
    return "Start typing your college name and choose the best suggestion. The same cleaned list is used in registration and filters.";
  }
  if (normalized.includes("contact") || normalized.includes("seller") || normalized.includes("whatsapp")) {
    return "Open a listing and use the WhatsApp contact button to reach the seller directly.";
  }
  if (normalized.includes("payment") || normalized.includes("price")) {
    return "Payments are not handled inside College Components. Buyers and sellers coordinate directly.";
  }
  if (normalized.includes("admin")) {
    return "The admin account opens a separate admin dashboard with management controls.";
  }

  return "I can help with account access, registration, publishing items, likes, filters, contacting sellers, and account deletion. If your issue needs a human reply, use the Contact Us page.";
}

export default function HelpBotPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);

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

    setChatMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: "user", text: nextMessage },
      { id: `${Date.now()}-bot`, role: "bot", text: getBotReply(nextMessage) },
    ]);
    setChatInput("");
  };

  const resetChat = () => {
    setChatMessages(initialMessages);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mx-auto max-w-4xl">
          <Card className="glass overflow-hidden border-border/70 shadow-lg">
            <CardHeader className="border-b border-border/60 bg-background/90 px-4 py-4 md:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-bg text-primary-foreground shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Sparkles className="h-4 w-4 text-primary" /> College Components Assistant
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">Fresh chat every time you open this page</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <Link to="/contact">Contact</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetChat}>
                    <RotateCcw className="mr-2 h-4 w-4" /> New Chat
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="space-y-3 bg-[linear-gradient(180deg,rgba(15,118,110,0.04),rgba(14,165,233,0.03))] px-4 py-5 md:px-5 md:py-6">
                {chatMessages.map((chat) => (
                  <div key={chat.id} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
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

              <div className="border-t border-border/60 bg-background p-4 md:p-5">
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
                    placeholder="Message College Components Assistant..."
                    className="bg-background/90"
                  />
                  <Button onClick={() => sendChatMessage()} className="shrink-0 gradient-bg border-0 text-primary-foreground hover:opacity-90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
