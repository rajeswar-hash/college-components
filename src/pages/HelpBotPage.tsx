import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    text: "Hi, how can I help?",
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
    return "Use Delete Account from the navigation and enter your password to confirm permanent deletion.";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = (behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      const chatScroll = chatScrollRef.current;

      if (!chatScroll) {
        return;
      }

      chatScroll.scrollTo({
        top: chatScroll.scrollHeight,
        behavior,
      });
    });
  };

  useEffect(() => {
    scrollToLatest(chatMessages.length > 1 ? "smooth" : "auto");
  }, [chatMessages]);

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

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      scrollToLatest("auto");
    });
  };

  const resetChat = () => {
    setChatMessages(initialMessages);
    setChatInput("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      scrollToLatest("auto");
    });
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link to="/contact" aria-label="Back to contact">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-primary-foreground shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">Help Bot</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={resetChat}>
            <RotateCcw className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden px-4">
        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 py-3 pb-4"
          style={{ scrollPaddingBottom: "20px" }}
        >
          <div className="flex min-h-full flex-col justify-end gap-3 pb-2">
            {chatMessages.map((chat) => (
              <div key={chat.id} className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    chat.role === "user"
                      ? "rounded-br-md bg-gradient-to-r from-teal-500 to-sky-500 text-white"
                      : "rounded-bl-md border border-border/70 bg-card text-foreground"
                  }`}
                >
                  {chat.text}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-border bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage();
            }}
          >
            <Input
              ref={inputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onFocus={() => scrollToLatest("auto")}
              placeholder="Message"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="send"
              className="h-12 bg-background"
            />
            <Button type="submit" className="h-12 shrink-0 gradient-bg border-0 px-4 text-primary-foreground hover:opacity-90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
