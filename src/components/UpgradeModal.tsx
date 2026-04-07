import { X, Zap, Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface UpgradeModalProps {
  onClose: () => void;
  trigger?: "out_of_credits" | "upgrade_click";
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: 10,
    features: ["10 credits on sign-up", "LinkedIn & Twitter formats", "All 5 tones", "Voice persona"],
    cta: "Current plan",
    disabled: true,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/ month",
    credits: 100,
    features: ["100 credits / month", "Everything in Free", "Topic research", "Carousel generation", "Post scheduling"],
    cta: "Upgrade to Pro",
    disabled: false,
    highlight: true,
  },
  {
    name: "Scale",
    price: "$29",
    period: "/ month",
    credits: 500,
    features: ["500 credits / month", "Everything in Pro", "Priority support", "Bulk generation", "Team sharing (soon)"],
    cta: "Upgrade to Scale",
    disabled: false,
    highlight: false,
  },
];

export function UpgradeModal({ onClose, trigger = "upgrade_click" }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-2">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          {trigger === "out_of_credits" ? (
            <>
              <h2 className="text-2xl font-bold">You're out of credits</h2>
              <p className="text-muted-foreground">
                Upgrade your plan to keep generating posts and growing your audience.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Unlock more credits</h2>
              <p className="text-muted-foreground">
                Choose a plan that fits your content goals.
              </p>
            </>
          )}
        </div>

        {/* Plans */}
        <div className="px-8 pb-8 grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                plan.highlight
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-muted/30"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.credits} credits {plan.period === "forever" ? "total" : "per month"}
                </p>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.highlight ? "" : "variant-outline"}`}
                variant={plan.highlight ? "default" : "outline"}
                disabled={plan.disabled}
                onClick={() => {
                  // Payment integration placeholder
                  alert(`Payment integration coming soon! Plan: ${plan.name}`);
                }}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
