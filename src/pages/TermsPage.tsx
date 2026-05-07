import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Use of the platform",
    body: "CampusKart is provided as a student marketplace for browsing, posting, and managing listings. Users are responsible for the accuracy of what they post and the way they communicate with others on or through the platform.",
  },
  {
    title: "User responsibilities",
    body: "Users must provide correct account information, including a valid email for OTP verification, a valid WhatsApp number if they want to sell, and a clear current college ID card for seller verification. Misleading, false, unsafe, or dishonest information should not be submitted.",
  },
  {
    title: "Listings and pricing",
    body: "Sellers are responsible for their listing content, photos, condition details, resource links, and price. CampusKart applies category-based listing rules and price limits, and sellers should delete listings once an item is sold.",
  },
  {
    title: "Manual review and moderation",
    body: "New listings are currently reviewed before they are made public. CampusKart may approve, reject, or keep a listing under review based on quality, safety, or policy concerns. Reported listings may stay visible while review is pending unless the platform decides otherwise.",
  },
  {
    title: "Transactions and contact",
    body: "CampusKart provides the marketplace interface, while buyers and sellers deal directly with each other. The platform does not guarantee payment, delivery, exchange quality, or the outcome of a transaction.",
  },
  {
    title: "Account access and recovery",
    body: "Users are responsible for keeping their password secure. Account creation currently includes email OTP verification, password reset uses an email OTP plus reset page flow, and users may permanently delete their own account through the in-app delete-account option.",
  },
  {
    title: "Seller verification and approval",
    body: "Account creation and seller approval are separate steps. A user account may be created after email OTP verification, while selling remains locked until the uploaded college ID card is reviewed. CampusKart may approve or reject seller access based on the submitted verification details.",
  },
  {
    title: "Platform actions",
    body: "CampusKart may limit, moderate, remove listings, reject listings, or ban accounts where misuse, abuse, suspicious activity, or policy violations are identified. Administrative actions are controlled by the platform owner and authorized moderators, and non-admin accounts may be permanently removed when required.",
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
