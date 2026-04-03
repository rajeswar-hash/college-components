import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Use of the platform",
    body: "CampusKart is provided as a student marketplace for browsing, posting, and managing listings. Users are responsible for the accuracy of what they post and the way they communicate with others on or through the platform.",
  },
  {
    title: "User responsibilities",
    body: "Users must provide correct account information, including a valid WhatsApp number if they want to sell, avoid misleading listings, and use the platform lawfully. Prohibited, unsafe, or dishonest listings should not be posted.",
  },
  {
    title: "Listings and pricing",
    body: "Sellers are responsible for their listing content, photos, condition details, and price. CampusKart may limit certain listing types or price ranges, and listings should be deleted once an item is sold.",
  },
  {
    title: "Transactions and contact",
    body: "CampusKart provides the marketplace interface, while buyers and sellers deal directly with each other. The platform does not guarantee payment, delivery, exchange quality, or the outcome of a transaction.",
  },
  {
    title: "Account access and recovery",
    body: "Users are responsible for keeping their password secure. Password reset is available through the account recovery flow, and users may permanently delete their own account through the in-app delete-account option.",
  },
  {
    title: "Platform actions",
    body: "CampusKart may limit, moderate, or remove listings, accounts, or access where misuse, abuse, suspicious activity, or policy violations are identified. Administrative actions are controlled by the platform owner.",
  },
];

export default function TermsPage() {
  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Clear platform terms based on the way CampusKart currently works."
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
