import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

interface PublicPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function PublicPageLayout({ title, subtitle, children }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="border-b border-border/70 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_45%)]">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">CampusKart</p>
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
