import { PublicPageLayout } from "@/components/PublicPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const privacySections = [
  {
    title: "Information collected",
    body: "The platform may collect account details such as name, email, phone number, college, and listing information submitted by users.",
  },
  {
    title: "How information is used",
    body: "Information is used to operate accounts, connect buyers and sellers, support listings, and improve the reliability of the platform.",
  },
  {
    title: "Data control",
    body: "Users can manage their listings and may permanently delete their own account. Account deletion removes linked profile and listing data from the platform database.",
  },
  {
    title: "Support communication",
    body: "When users contact support, the details they provide may be used to respond to questions, suggestions, or issue reports.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="A straightforward summary of how user data is stored and handled on CampusKart."
    >
      <div className="grid gap-4">
        {privacySections.map((section) => (
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
