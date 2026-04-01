import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";

const faqs = [
  {
    question: "How accurate is the AI transcription?",
    answer: "Our AI transcription achieves 99.5% accuracy in ideal conditions and maintains over 95% accuracy even in challenging environments with background noise or accents. The system continuously learns and improves from your specific use cases."
  },
  {
    question: "What phone systems do you integrate with?",
    answer: "We integrate with all major phone systems including Salesforce, HubSpot, Zoom Phone, RingCentral, 8x8, Avaya, Cisco, and many more. We also provide APIs for custom integrations and can work with any system that can provide call recordings."
  },
  {
    question: "How long does it take to set up?",
    answer: "Most customers are up and running in under 30 minutes. Our team provides white-glove onboarding to ensure smooth integration with your existing systems. No technical expertise required on your end."
  },
  {
    question: "Is my call data secure and compliant?",
    answer: "Absolutely. We're SOC 2 Type II certified, GDPR compliant, and follow industry-standard encryption protocols. Your data is encrypted in transit and at rest, and we never share or sell your information to third parties."
  },
  {
    question: "Can I customize the analytics and dashboards?",
    answer: "Yes! Our platform offers flexible dashboard customization, custom keyword tracking, and configurable alerts. Enterprise customers can also access our API to build completely custom analytics solutions."
  },
  {
    question: "What happens during the free trial?",
    answer: "During your 14-day free trial, you get full access to all features in the Professional plan. No credit card required. Our team will help you set up the system and provide training to ensure you get maximum value from the trial."
  },
  {
    question: "Do you offer training and support?",
    answer: "Yes! We provide comprehensive onboarding, training sessions, and ongoing support. All plans include email support, Professional plans get priority support, and Enterprise customers have access to dedicated success managers and 24/7 phone support."
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer: "You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle. We'll help you migrate your data and settings seamlessly."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our AI call analytics platform.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 rounded-lg px-6">
              <AccordionTrigger className="text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <Button variant="outline">Contact Support</Button>
        </div>
      </div>
    </section>
  );
}