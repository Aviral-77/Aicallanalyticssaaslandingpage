import { Button } from "./ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-6xl">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold">Repost AI</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">Hi, {user.name.split(" ")[0]}</span>
              <Button onClick={() => navigate("/create")}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                Create Post
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")}>Sign In</Button>
              <Button onClick={() => navigate("/register")}>Get Started Free</Button>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col space-y-4 p-4">
            <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            {user ? (
              <>
                <Button className="justify-start" onClick={() => { navigate("/create"); setIsMenuOpen(false); }}>
                  Create Post
                </Button>
                <Button variant="ghost" className="justify-start text-muted-foreground" onClick={handleLogout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" onClick={() => { navigate("/login"); setIsMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button className="justify-start" onClick={() => { navigate("/register"); setIsMenuOpen(false); }}>
                  Get Started Free
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
