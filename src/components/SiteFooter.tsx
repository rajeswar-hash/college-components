import { Link } from "react-router-dom";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border bg-background/80">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
        <p className="font-display text-lg font-semibold text-foreground">CampusKart</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A professional marketplace for students to buy and sell electronics, tools, and project gear inside their college network.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Built for campus communities that want faster discovery, cleaner listings, and direct student-to-student coordination.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/about" className="text-muted-foreground transition-colors hover:text-foreground">About</Link>
            <Link to="/help" className="text-muted-foreground transition-colors hover:text-foreground">Help</Link>
            <Link to="/contact" className="text-muted-foreground transition-colors hover:text-foreground">Contact Us</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to="/terms" className="text-muted-foreground transition-colors hover:text-foreground">Terms & Conditions</Link>
            <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>&copy; {currentYear} CampusKart. Trusted listings for serious student builders.</p>
      </div>
      </div>
    </footer>
  );
}
