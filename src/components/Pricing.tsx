import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "per user/month",
    description: "Perfect for small teams getting started with call analytics",
    features: [
      "Up to 100 calls per month",
      "Basic transcription",
      "Sentiment analysis",
      "Standard dashboard",
      "Email support",
      "7-day data retention"
    ],
    isPopular: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "per user/month",
    description: "Advanced features for growing sales and support teams",
    features: [
      "Up to 500 calls per month",
      "Advanced AI transcription",
      "Real-time coaching",
      "Custom dashboards",
      "Keyword tracking",
      "Compliance monitoring",
      "Priority support",
      "30-day data retention",
      "API access"
    ],
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "Tailored solutions for large organizations",
    features: [
      "Unlimited calls",
      "Advanced AI models",
      "Custom integrations",
      "Dedicated success manager",
      "Custom compliance rules",
      "Advanced analytics",
      "24/7 phone support",
      "Unlimited data retention",
      "SSO & SAML",
      "On-premise deployment"
    ],
    isPopular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your team size and needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.isPopular ? 'border-primary shadow-lg scale-105' : 'border-border/50'}`}>
              {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-3xl">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-muted-foreground">/{plan.period}</span>}
                  </div>
                  {plan.price === "Custom" && <div className="text-lg text-muted-foreground">{plan.period}</div>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>99.9% uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}