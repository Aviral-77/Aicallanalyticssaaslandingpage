import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Indie Hacker & Founder",
    company: "BuildFast.dev",
    initials: "PS",
    color: "bg-blue-500",
    content:
      "I was watching a podcast on my commute, pasted the link when I got home, and had a LinkedIn post ready in 30 seconds. It got 4x my usual engagement. Repost AI is now part of my daily routine.",
    rating: 5,
  },
  {
    name: "Marcus Webb",
    role: "Senior Software Engineer",
    company: "Vercel",
    initials: "MW",
    color: "bg-indigo-500",
    content:
      "I never had time to maintain a LinkedIn presence. Now I paste an article I'm reading anyway, tweak the output slightly, and post. My following has grown 800 followers in 6 weeks.",
    rating: 5,
  },
  {
    name: "Aisha Okonkwo",
    role: "Startup Founder",
    company: "Launchpad AI",
    initials: "AO",
    color: "bg-sky-500",
    content:
      "The LinkedIn persona matching is what sold me. It analyzed my previous posts and now the generated content actually sounds like me — not generic AI slop. My audience can't tell the difference.",
    rating: 5,
  },
  {
    name: "Daniel Torres",
    role: "Developer Advocate",
    company: "Supabase",
    initials: "DT",
    color: "bg-violet-500",
    content:
      "I repurpose conference talks from YouTube and turn them into Twitter threads. Saves me 2–3 hours a week and keeps my feed consistently active. The thread format is spot on.",
    rating: 5,
  },
  {
    name: "Rachel Kim",
    role: "Technical Writer & Creator",
    company: "Self-employed",
    initials: "RK",
    color: "bg-teal-500",
    content:
      "I have a newsletter and was struggling to also maintain Twitter and LinkedIn. Repost AI lets me go from one blog post to all three platforms in minutes. Game changer for solo creators.",
    rating: 5,
  },
  {
    name: "James Oduya",
    role: "CTO & Co-founder",
    company: "DevShift",
    initials: "JO",
    color: "bg-primary",
    content:
      "We use it for our company's LinkedIn page. We paste industry research articles, choose 'Thought Leader' tone, and get posts that position us as experts. Engagement went up 300% in a month.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Loved by Builders & Creators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Developers, founders, and tech creators use Repost AI to grow their audience without
            spending hours writing posts.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-medium text-foreground">4.9/5</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <span>from 1,200+ reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/60 hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-muted-foreground leading-relaxed">"{testimonial.content}"</p>

                  <div className="flex items-center space-x-3 pt-2 border-t border-border/50">
                    <Avatar>
                      <AvatarFallback className={`${testimonial.color} text-white text-sm font-semibold`}>
                        {testimonial.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role} · {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
