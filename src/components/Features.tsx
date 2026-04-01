import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  Brain,
  Link2,
  Linkedin,
  Twitter,
  Sliders,
  RefreshCw,
  Layers,
  BarChart3,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Any Link, Instantly",
    description: "Paste a YouTube video, podcast episode, blog post, or article URL and Repurpost handles the rest — no copy-pasting needed.",
  },
  {
    icon: Brain,
    title: "Deep Content Analysis",
    description: "Our AI reads the full transcript, article, or show notes to extract the most impactful ideas, stories, and insights.",
  },
  {
    icon: Linkedin,
    title: "LinkedIn-Optimized Posts",
    description: "Generate long-form LinkedIn posts with hooks, storytelling structure, and hashtags tuned for maximum reach and engagement.",
  },
  {
    icon: Twitter,
    title: "Twitter Threads",
    description: "Auto-generate punchy tweet threads that break down complex ideas into scroll-stopping, shareable content.",
  },
  {
    icon: Sliders,
    title: "Tone Customization",
    description: "Choose from Thought Leader, Casual, Storytelling, Data-Driven, or Contrarian — or mix and match to fit your brand.",
  },
  {
    icon: Wand2,
    title: "LinkedIn Persona Matching",
    description: "Link your LinkedIn profile and let AI analyze your past posts to generate content that sounds exactly like you.",
  },
  {
    icon: RefreshCw,
    title: "One-Click Regeneration",
    description: "Not happy with the output? Regenerate with a different angle, tone, or length with a single click.",
  },
  {
    icon: Layers,
    title: "Multi-Format Output",
    description: "From a single source, get a LinkedIn post, a Twitter thread, a newsletter blurb, and a short-form hook — all at once.",
  },
  {
    icon: BarChart3,
    title: "Post Performance Tracking",
    description: "Connect your accounts to see which repurposed posts drive the most impressions, clicks, and followers over time.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Everything You Need to Build in Public
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop spending hours writing posts from scratch. Repurpost turns the content you already
            consume into the audience you've always wanted.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
