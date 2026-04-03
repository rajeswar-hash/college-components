import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, Store, Users } from "lucide-react";

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
      </div>
    </PublicPageLayout>
  );
}
