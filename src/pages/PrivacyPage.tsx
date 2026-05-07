import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const privacySections = [
  {
    title: "Information you provide",
    body: "CampusKart may collect account details such as your name, email address, phone number, college, avatar choice, student ID verification image, and the listing content you choose to publish, including photos, item details, pricing, and resource links where applicable.",
  },
  {
    title: "How your information is used",
    body: "Your information is used to operate your account, verify email ownership during signup and password reset, review seller verification requests, show your listings, support buyer-seller contact, improve browsing and filtering, run manual listing review, and keep the platform functional and reliable.",
  },
  {
    title: "Account and listing visibility",
    body: "CampusKart is designed around college-based discovery. Listing information such as title, photos, price, category, condition, and college may be shown to other users in the browsing and product experience. Seller identity is not shown in listing moderation previews.",
  },
  {
    title: "Local device data",
    body: "CampusKart may store small preference data in your browser, such as selected college, theme preference, guest cart items, cooldown timers, or similar settings that help the app remember your current experience on the device.",
  },
  {
    title: "Support and feedback messages",
    body: "When you use the Contact Us page or support tools, the information you submit may be used to respond to your message, review feedback, and investigate platform issues. Contact form submissions may pass through connected support services needed to deliver the message to the CampusKart inbox.",
  },
  {
    title: "Account deletion and control",
    body: "Users can permanently delete their own account from the platform. The admin account may also permanently remove non-admin accounts when moderation or platform management requires it. When account deletion is completed, linked profile and listing data are removed from the platform database according to the current product flow.",
  },
  {
    title: "Seller verification records",
    body: "College ID images are used only for seller verification and moderation review. Selling stays locked until review is approved. If verification is rejected, the account may still be accessible for sign-in, but selling remains blocked unless the user creates a new valid seller account.",
  },
  {
    title: "Authentication and platform services",
    body: "CampusKart currently relies on connected platform services for email OTP verification, sign-in, database storage, and app hosting. Those services may process technical data needed to keep authentication, listings, and platform access working.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="A clearer summary of what data CampusKart handles, why it is used, and how users stay in control."
    >
      <div className="grid gap-4">
        {privacySections.map((section) => (
          <Card key={section.title} className="glass border-border/70 shadow-[0_16px_40px_rgba(20,184,166,0.06)]">
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
