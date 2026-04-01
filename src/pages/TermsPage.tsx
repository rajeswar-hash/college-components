import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Use of the platform",
    body: "College Components is provided for students to create, browse, and manage listings. Users are responsible for the accuracy of their listings and communications.",
  },
  {
    title: "User responsibilities",
    body: "Users must provide correct information, avoid misleading listings, and use the platform lawfully. Prohibited or unsafe items should not be listed.",
  },
  {
    title: "Transactions",
    body: "Transactions happen between users. College Components provides the marketplace interface but does not guarantee any listing, payment, or exchange.",
  },
  {
    title: "Account actions",
    body: "The platform may limit or remove access where misuse, abuse, or policy violations are identified. Users may also permanently delete their own account through the dashboard.",
  },
];

export default function TermsPage() {
  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Clear platform terms designed to support responsible marketplace use."
    >
      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="glass border-border/70">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{section.body}</CardContent>
          </Card>
        ))}
      </div>
    </PublicPageLayout>
  );
}
