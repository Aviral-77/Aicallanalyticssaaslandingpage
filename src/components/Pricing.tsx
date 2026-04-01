import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, Sparkles, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try Repost AI with no commitment. Perfect for exploring the product.",
    features: [
      "10 posts per month",
      "LinkedIn & Twitter output",
      "3 tone presets",
      "YouTube & blog support",
      "Basic post templates",
      "Copy to clipboard",
    ],
    isPopular: false,
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For creators and founders who post consistently and want to grow fast.",
    features: [
      "Unlimited posts",
      "All platforms (LinkedIn, Twitter, Email)",
      "All tone presets + custom tone",
      "LinkedIn persona matching",
      "3 angle variants per post",
      "Twitter thread generator",
      "Hot takes generator",
      "Post performance tracking",
      "Priority support",
    ],
    isPopular: true,
    cta: "Start Pro Free Trial",
  },
  {
    name: "Team",
    price: "$49",
    period: "per month",
    description: "For startup teams building their brand and amplifying company content.",
    features: [
      "Everything in Pro",
      "Up to 5 seats",
      "Shared brand voice settings",
      "Team content library",
      "Bulk repurposing",
      "Analytics dashboard",
      "Slack / Notion integrations",
      "Dedicated onboarding",
      "Custom invoicing",
    ],
    isPopular: false,
    cta: "Contact Sales",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Simple, Honest Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you're ready. No surprise fees, no locked-in contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.isPopular ? "border-primary shadow-lg ring-1 ring-primary/30 scale-105" : "border-border/60"}`}
            >
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-base mb-1">/{plan.period}</span>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2.5">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.isPopular && <Sparkles className="w-4 h-4 mr-2" />}
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-14 space-y-4">
          <p className="text-muted-foreground text-sm">All paid plans include:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {[
              "14-day free trial",
              "No setup fees",
              "Cancel anytime",
              "99.9% uptime SLA",
            ].map((item) => (
              <div key={item} className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
