import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { ShieldCheck, Sparkles, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicPageLayout
      title="About College Components"
      subtitle="College Components helps students buy and sell electronics, tools, and project parts in a cleaner, more trusted campus marketplace."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Why this platform exists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Engineering students often need a few parts quickly, while other students have unused boards, sensors, lab tools, or project kits sitting idle. College Components closes that gap with a focused marketplace designed for college communities.
            </p>
            <p>
              The platform is built to keep discovery simple, conversations direct, and listings easy to manage on both mobile and desktop.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Built for student communities</p>
                <p className="mt-1 text-sm text-muted-foreground">Focused on local trust, quick access, and practical listings.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Simple and transparent</p>
                <p className="mt-1 text-sm text-muted-foreground">Browse listings, contact sellers, and manage your own items clearly.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-border/70">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Designed to feel professional</p>
                <p className="mt-1 text-sm text-muted-foreground">A polished experience that works whether someone is logged in or just exploring.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicPageLayout>
  );
}
