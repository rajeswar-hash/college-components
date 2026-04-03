import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ArrowRight, MessageCircle, Recycle, ShieldCheck, Sparkles, Store, Users, Wallet, Zap } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicPageLayout
      title="About CampusKart"
      subtitle="CampusKart is a campus-first marketplace built for engineering students who want faster deals, cleaner listings, and more trust inside their own college community."
    >
      <div className="space-y-6">
        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Why CampusKart exists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Students often need notes, components, gadgets, tools, or project kits quickly, while other students already have those items sitting unused. CampusKart is built to close that gap with a focused marketplace that feels local, simple, and useful from the first tap.
            </p>
            <p>
              Instead of searching random public marketplaces, students can browse relevant listings, filter by college, and connect directly with sellers inside their own academic environment.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Campus-first trust</p>
                <p className="mt-1 text-sm text-muted-foreground">Listings are designed for students buying and selling inside their own college network.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Made for student needs</p>
                <p className="mt-1 text-sm text-muted-foreground">Notes, components, gadgets, tools, and project items all fit naturally on the platform.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Transparent flow</p>
                <p className="mt-1 text-sm text-muted-foreground">Clear condition labels, photo-first listings, and direct seller contact keep things straightforward.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Mobile-friendly design</p>
                <p className="mt-1 text-sm text-muted-foreground">CampusKart is designed to feel quick, clean, and easy to use on both phone and laptop.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>How the platform works today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Students create an account with their name, email, phone number, and college details.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Sellers post clean listings with photos, title, description, category, condition, and price.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Buyers can search, filter by category or college, and like useful items to spot popular listings.</p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Interested buyers contact sellers directly, which keeps conversations quick and practical.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/70">
            <CardHeader>
              <CardTitle>What makes CampusKart useful</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3">
                <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Direct buyer-seller contact for faster decisions.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>Account and listing controls, including permanent account deletion.</p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <p>A polished browsing experience that feels more focused than a general public marketplace.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass border-border/70 shadow-[0_18px_50px_rgba(20,184,166,0.08)]">
          <CardHeader>
            <CardTitle>Why CampusKart is better for students</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Only for students</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                CampusKart is built around student communities, not random public traffic. That gives users a more trusted environment than a general marketplace.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Faster same-campus deals</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buyers and sellers are usually in the same campus environment, so there is no shipping delay and exchanges can happen much faster.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Better student pricing</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Many students sell items simply to recover some cost, not to maximize profit. That often means cheaper prices than online stores.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Made for engineering needs</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                CampusKart is a better fit for engineering students because it naturally supports notes, lab materials, components, gadgets, tools, and project kits.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Helps juniors and seniors</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Seniors can pass on useful books, notes, and components, while juniors get what they need faster and at lower cost. That builds a real student ecosystem.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Recycle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Smarter reuse, less waste</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Items used once for a project do not need to sit unused or get wasted. Reusing them saves money and makes the platform more sustainable.
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/80 p-4 md:col-span-2 xl:col-span-3">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground">Direct communication, no middleman</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buyers and sellers connect directly, which makes questions, negotiation, and final decisions quicker and clearer without unnecessary middle steps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
