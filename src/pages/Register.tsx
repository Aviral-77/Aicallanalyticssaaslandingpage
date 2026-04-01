import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const perks = [
  "10 free posts every month",
  "LinkedIn & Twitter formats",
  "Tone customization",
  "No credit card required",
];

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate("/create");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">

        {/* Left: pitch */}
        <div className="hidden md:block space-y-6">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Repost AI</span>
          </Link>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">
              Start turning links into posts today.
            </h2>
            <p className="text-muted-foreground">
              Join thousands of founders, developers, and creators who grow their audience
              without spending hours writing.
            </p>
          </div>

          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div className="space-y-6">
          {/* Mobile logo */}
          <div className="md:hidden text-center">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">Repost AI</span>
            </Link>
          </div>

          <Card className="shadow-md border-border/60">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
              <CardDescription>Free forever. No credit card required.</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Started Free
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Terms</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
