import { Button } from "./ui/button";
import { Play, BarChart3, Brain, Zap } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Hero() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full border">
              <Brain className="w-4 h-4 mr-2" />
              <span className="text-sm">AI-Powered Call Intelligence</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl tracking-tight">
              Transform Your Calls Into
              <span className="text-primary"> Actionable Insights</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the power of AI to analyze every customer conversation, identify opportunities, 
              and boost your team's performance with real-time insights and automated coaching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6">
              <Zap className="w-5 h-5 mr-2" />
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              No setup required
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              14-day free trial
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Cancel anytime
            </div>
          </div>
        </div>

        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-8 backdrop-blur-sm border">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600"
              alt="Call Analytics Dashboard"
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
          
          <div className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 border">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <div>
                <div className="text-sm">Conversion Rate</div>
                <div className="text-xl">+32%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}