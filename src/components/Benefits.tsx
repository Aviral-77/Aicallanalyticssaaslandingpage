import { CheckCircle, Link2, Sliders, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Link2,
    title: "Paste Any Link",
    description:
      "Drop in a YouTube video URL, podcast episode, blog post, or any article. Repost AI fetches the full content — transcript, text, show notes — instantly.",
    detail: "Supports YouTube, Spotify, Medium, Substack, Dev.to, and any public URL.",
  },
  {
    number: "02",
    icon: Sliders,
    title: "Choose Your Tone & Platform",
    description:
      "Pick from preset voices like Thought Leader, Casual, Contrarian, or Data-Driven. Or link your LinkedIn profile and let AI match your personal writing style.",
    detail: "LinkedIn, Twitter/X, newsletter blurbs — all optimized for each platform's algorithm.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get Your Post in Seconds",
    description:
      "In under 15 seconds you get a polished LinkedIn post, a Twitter thread, and multiple angle variants — ready to copy and publish.",
    detail: "Edit inline, regenerate with one click, or generate 3 different angle variants.",
  },
];

const benefits = [
  "Save 5+ hours a week on content creation",
  "10x your LinkedIn reach without extra effort",
  "Repurpose content you already consume",
  "Consistent posting without the burnout",
  "Sound like you — not like a robot",
  "Build a personal brand as a thought leader",
];

export function Benefits() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">

        {/* How it works */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full border text-sm font-medium">
            Simple 3-step workflow
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            How Repost AI Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From a raw link to a publish-ready post in under 15 seconds. No prompting, no templates, no
            copy-pasting.
          </p>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-px bg-border z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col items-center text-center space-y-4 group">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-background border-2 border-primary/20 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:shadow-md transition-all duration-200">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-base">{step.description}</p>
                  <p className="text-sm text-primary/80 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits list + CTA */}
        <div className="mt-24 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Stop Leaving Reach on the Table
            </h2>
            <p className="text-lg text-muted-foreground">
              You're already consuming great content — podcasts, articles, talks. Repost AI turns
              your consumption habits into a content engine that grows your audience while you sleep.
            </p>
            <div className="grid gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-base">{benefit}</span>
                </div>
              ))}
            </div>
            <a
              href="#pricing"
              className="inline-flex items-center text-primary font-medium hover:underline underline-offset-4"
            >
              Start for free — no credit card needed
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Visual: persona matching card */}
          <div className="bg-background border rounded-2xl shadow-md p-6 space-y-5">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">LinkedIn Persona Matching</div>
              <h3 className="text-xl font-semibold">Posts that sound like you</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Connect your LinkedIn profile and Repost AI analyzes your past posts to understand your
              vocabulary, structure, and storytelling style.
            </p>
            <div className="space-y-3">
              {[
                { label: "Writing Style", value: "Conversational with data", color: "bg-blue-500" },
                { label: "Avg Post Length", value: "Medium (300–500 words)", color: "bg-indigo-400" },
                { label: "Top Themes", value: "AI, Startups, Product", color: "bg-sky-400" },
                { label: "Best Hook Type", value: "Question-based opener", color: "bg-primary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <div className="flex-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Persona analysis complete — ready to generate</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
