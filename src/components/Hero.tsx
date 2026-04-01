import { Button } from "./ui/button";
import { ArrowRight, Sparkles, Link, FileText, Mic } from "lucide-react";

export function Hero() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full border">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">AI-Powered Content Repurposing</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight font-bold">
              Turn Any Content Into
              <span className="text-primary"> Viral Social Posts</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Paste a YouTube video, podcast, blog, or article link. Repurpost analyzes it and crafts
              ready-to-publish posts for LinkedIn and Twitter — in your voice, your tone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6">
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              See How It Works
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              No credit card required
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              10 free posts/month
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Mock product UI */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-primary/10 to-accent/20 rounded-2xl p-6 md:p-10 border backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6 items-center">

              {/* Input side */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Step 1 — Paste your content</div>
                <div className="bg-background rounded-xl border shadow-sm p-4 space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-dashed">
                    <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">https://youtu.be/dQw4w9WgXcQ</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { icon: FileText, label: "Blog" },
                      { icon: Mic, label: "Podcast" },
                      { icon: Link, label: "Article" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground border">
                        <Icon className="w-3 h-3" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Tone</div>
                    <div className="flex flex-wrap gap-2">
                      {["Thought Leader", "Casual", "Storytelling", "Data-Driven"].map((tone) => (
                        <div
                          key={tone}
                          className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${tone === "Thought Leader" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"}`}
                        >
                          {tone}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Output side */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Step 2 — Get your post</div>
                <div className="bg-background rounded-xl border shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">in</span>
                      </div>
                      <span className="text-xs font-medium">LinkedIn Post</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Ready</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    I just finished watching this talk on distributed systems and it completely changed how I think about consistency vs availability trade-offs...
                  </p>
                  <div className="text-xs text-muted-foreground">#buildinpublic #startups #engineering</div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="text-xs h-7 px-3">Copy Post</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 px-3">Regenerate</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat badge */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-background rounded-full shadow-lg px-5 py-2 border flex items-center space-x-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Generated in <span className="font-semibold text-foreground">4 seconds</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
