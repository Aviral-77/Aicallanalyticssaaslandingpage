import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Mail, Sparkles, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold">Repost AI</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed">
              Turn any content into ready-to-publish social posts. Built for developers, founders,
              and tech creators.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="text-background hover:bg-background/10 hover:text-background">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-background hover:bg-background/10 hover:text-background">
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">Product</h3>
            <div className="space-y-2 text-background/70 text-sm">
              <div><a href="#features" className="hover:text-background transition-colors">Features</a></div>
              <div><a href="#how-it-works" className="hover:text-background transition-colors">How It Works</a></div>
              <div><a href="#pricing" className="hover:text-background transition-colors">Pricing</a></div>
              <div><a href="#" className="hover:text-background transition-colors">Changelog</a></div>
              <div><a href="#" className="hover:text-background transition-colors">Roadmap</a></div>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">Resources</h3>
            <div className="space-y-2 text-background/70 text-sm">
              <div><a href="#" className="hover:text-background transition-colors">Blog</a></div>
              <div><a href="#" className="hover:text-background transition-colors">Case Studies</a></div>
              <div><a href="#faq" className="hover:text-background transition-colors">FAQ</a></div>
              <div><a href="#" className="hover:text-background transition-colors">API Docs</a></div>
              <div><a href="#" className="hover:text-background transition-colors">Integrations</a></div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-background">Contact</h3>
            <div className="space-y-3 text-background/70 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>hello@repost.ai</span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-background/50 text-xs">Built for the builder community.</p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-background/20" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-background/60 text-sm">
            © 2025 Repost AI. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm text-background/60">
            <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-background transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
