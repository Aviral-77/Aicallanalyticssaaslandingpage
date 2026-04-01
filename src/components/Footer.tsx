import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Mail, Phone, MapPin, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-foreground text-primary rounded-lg flex items-center justify-center">
                <span>AI</span>
              </div>
              <span className="text-xl">CallAnalytics</span>
            </div>
            <p className="text-primary-foreground/80">
              Transform your customer conversations with AI-powered call analytics and real-time insights.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3>Product</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <div><a href="#features" className="hover:text-primary-foreground transition-colors">Features</a></div>
              <div><a href="#pricing" className="hover:text-primary-foreground transition-colors">Pricing</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Integrations</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">API</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Security</a></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3>Company</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <div><a href="#" className="hover:text-primary-foreground transition-colors">About</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Blog</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Careers</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Press</a></div>
              <div><a href="#" className="hover:text-primary-foreground transition-colors">Partners</a></div>
            </div>
          </div>

          <div className="space-y-4">
            <h3>Contact</h3>
            <div className="space-y-3 text-primary-foreground/80">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>hello@callanalytics.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>1-800-CALL-AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-primary-foreground/80 text-sm">
            © 2025 CallAnalytics. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-primary-foreground/80">
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}