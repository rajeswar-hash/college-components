import { PublicPageLayout } from "@/components/PublicPageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How do I create an account?",
    answer: "Use the sign in dialog, switch to register, fill in your details, and submit. Once your account is created, you can sign in from mobile or laptop.",
  },
  {
    question: "How do I publish a listing?",
    answer: "Open Sell, add title, description, category, condition, price, and optionally images. The app now prepares images before publishing so the listing process stays stable.",
  },
  {
    question: "How do I contact a seller?",
    answer: "Open a product and use the WhatsApp contact button. That message includes the listing title and price for quick context.",
  },
  {
    question: "Can I delete my account?",
    answer: "Yes. Signed-in users can open the dashboard and use the Delete Account option. That permanently removes their account and linked data.",
  },
];

export default function HelpPage() {
  return (
    <PublicPageLayout
      title="Help Center"
      subtitle="Find quick answers about accounts, listings, publishing, and platform usage."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Frequently asked questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card className="glass border-border/70">
          <CardHeader>
            <CardTitle>Need direct support?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>For platform questions, bug reports, account issues, or suggestions, use the Contact Us page.</p>
            <p>The built-in help bot can answer simple doubts instantly, and the feedback form lets users write directly to support.</p>
          </CardContent>
        </Card>
      </div>
    </PublicPageLayout>
  );
}
