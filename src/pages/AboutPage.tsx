import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ArrowRight, MessageCircle, Recycle, ShieldCheck, Sparkles, Store, Users, Wallet, Zap } from "lucide-react";

const businessEmail = "businesscampuskart@gmail.com";

const currentHighlights = [
  {
    icon: Users,
    title: "Student-focused trust",
    body: "CampusKart is built for campus communities, so buyers and sellers are dealing in a more familiar student environment instead of a random public marketplace.",
  },
  {
    icon: Zap,
    title: "Faster same-campus deals",
    body: "Most exchanges can happen locally without shipping, which makes buying and selling quicker and more practical for students.",
  },
  {
    icon: Wallet,
    title: "Better prices for students",
    body: "Many listings are posted by students recovering cost from books, notes, gadgets, components, tools, or project kits rather than selling for profit.",
  },
  {
    icon: Recycle,
    title: "Reuse over waste",
    body: "Items used for one semester, lab, or project can move to the next student instead of staying unused or getting wasted.",
  },
];

export default function AboutPage() {
  return (
    <PublicPageLayout
      title="About CampusKart"
      subtitle="CampusKart is a campus-first marketplace for students who want faster local deals, clearer listings, and a simpler way to buy or sell useful academic and engineering items."
    >
      <div className="space-y-6">
        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Why CampusKart exists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Students often need notes, components, gadgets, tools, or project kits quickly, while other students already have those same items sitting unused. CampusKart is built to close that gap with a marketplace that feels local, focused, and simple to use.
            </p>
            <p>
              Instead of searching broad public platforms, students can browse relevant listings, filter by college, and contact sellers directly through WhatsApp when a listing is active.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {currentHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="glass border-border/70">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>How CampusKart works right now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Students register with their name, college, WhatsApp number, email, password, and a final email OTP verification step.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Sellers can post listings with up to five square-cropped photos, a clean title, product details, condition where required, category, and price.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Buyers can browse, search, filter by category, condition, price, or college, open item pages, share them, and save useful listings to their cart for later.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Interested buyers contact sellers directly through WhatsApp, and new listings go through manual review before they are made public.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>What makes the platform useful</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Direct buyer-seller contact without a middle layer.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Account tools such as email OTP verification, password reset, profile editing, theme selection, and permanent account deletion.</p>
              </div>
              <div className="flex items-start gap-3">
                <Store className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>A listing flow designed around student items instead of general public marketplace clutter.</p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Mobile-friendly browsing, a help bot for quick doubts, and a cleaner overall marketplace experience.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Why students may prefer CampusKart</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Campus community feeling</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The platform is built around student use, which can feel more trusted and more relevant than a broad marketplace with random public listings.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Academic and engineering fit</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                CampusKart is suited to notes, gadgets, components, tools, lab-related items, and student project needs in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Useful for juniors and seniors</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Seniors can pass on items they no longer need, while juniors can get useful things faster and often at a lower price.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 md:col-span-2 xl:col-span-3">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Direct communication, fewer steps</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buyers and sellers connect directly for questions and final coordination, which keeps the flow faster than a platform with heavy middleman steps.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Condition guide for buyers and sellers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="font-semibold text-foreground">New</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Unused item in fresh condition.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="font-semibold text-foreground">Like New</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Almost unused and very close to new condition.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="font-semibold text-foreground">Good</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Lightly used, working well, and still in solid condition.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="font-semibold text-foreground">Fair</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Used item that still works fine but may show more visible wear.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Business inquiries</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            For partnerships, collaborations, or business-related inquiries, contact{" "}
            <a href={`mailto:${businessEmail}`} className="font-medium text-primary hover:underline">
              {businessEmail}
            </a>
            .
          </CardContent>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
