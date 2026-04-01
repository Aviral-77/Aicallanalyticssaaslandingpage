import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Shield, 
  Zap,
  BarChart3,
  Users,
  Clock
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Transcription",
    description: "Convert speech to text with 99.5% accuracy using advanced machine learning models.",
  },
  {
    icon: MessageSquare,
    title: "Sentiment Analysis",
    description: "Understand customer emotions and satisfaction levels throughout every conversation.",
  },
  {
    icon: TrendingUp,
    title: "Performance Insights",
    description: "Track team performance with detailed analytics on talk time, conversion rates, and more.",
  },
  {
    icon: Target,
    title: "Keyword Tracking",
    description: "Monitor competitor mentions, objections, and key topics automatically.",
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    description: "Ensure regulatory compliance with automated script adherence and flagging.",
  },
  {
    icon: Zap,
    title: "Real-time Coaching",
    description: "Get live suggestions and prompts during calls to improve outcomes.",
  },
  {
    icon: BarChart3,
    title: "Custom Dashboards",
    description: "Build personalized dashboards with the metrics that matter most to your business.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share insights, comments, and best practices across your entire sales team.",
  },
  {
    icon: Clock,
    title: "Automated Summaries",
    description: "Generate call summaries and action items automatically after each conversation.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform provides comprehensive call analytics to help you understand, 
            optimize, and scale your customer conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-border/50 hover:border-border transition-colors">
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