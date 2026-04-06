import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, PersonaOut } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  Sparkles,
  LogOut,
  ArrowLeft,
  Linkedin,
  Brain,
  Loader2,
  CheckCheck,
  AlertCircle,
  Plus,
  Trash2,
  CalendarClock,
} from "lucide-react";

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [posts, setPosts] = useState<string[]>(["", "", ""]);
  const [persona, setPersona] = useState<PersonaOut | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPersona()
      .then((p) => {
        setPersona(p);
        setLinkedinUrl(p.linkedin_url ?? "");
        if (p.sample_posts.length > 0) {
          // Pad to at least 3 slots
          const padded = [...p.sample_posts];
          while (padded.length < 3) padded.push("");
          setPosts(padded);
        }
      })
      .catch(() => {}) // no persona yet — fine
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    const cleanPosts = posts.filter((p) => p.trim().length > 0);
    if (cleanPosts.length === 0) {
      setError("Paste at least one LinkedIn post so Repost AI can learn your voice.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const updated = await api.savePersona({
        linkedin_url: linkedinUrl.trim() || undefined,
        sample_posts: cleanPosts,
      });
      setPersona(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const addPost = () => setPosts((p) => [...p, ""]);
  const removePost = (i: number) => setPosts((p) => p.filter((_, idx) => idx !== i));
  const updatePost = (i: number, val: string) =>
    setPosts((p) => p.map((v, idx) => (idx === i ? val : v)));

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto max-w-3xl px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/create" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold">Repost AI</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/scheduled" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <CalendarClock className="w-4 h-4" />
              <span className="hidden sm:inline">Scheduled</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1.5" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Voice Settings</h1>
          <p className="text-muted-foreground mt-1">
            Link your LinkedIn profile and paste 3-4 of your recent posts.
            Repost AI will learn your writing style and match it in every generated post.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Voice profile banner */}
            {persona?.voice_profile && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                    <Brain className="w-4 h-4" />
                    Voice Profile Active
                  </div>
                  <p className="text-sm text-green-800 leading-relaxed">{persona.voice_profile}</p>
                  <p className="text-xs text-green-600">
                    All generated posts will match this voice. Update your sample posts below to refine it.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* LinkedIn URL */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Linkedin className="w-3.5 h-3.5 text-white" />
                </div>
                <Label className="text-sm font-semibold">LinkedIn Profile URL</Label>
              </div>
              <Input
                type="url"
                placeholder="https://linkedin.com/in/yourhandle"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional — used to personalise your profile context.
              </p>
            </section>

            {/* Sample posts */}
            <section className="space-y-3">
              <div>
                <Label className="text-sm font-semibold">Your Recent LinkedIn Posts</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste 3-4 posts you've written. Repost AI will analyse your tone, structure,
                  and phrasing to write all new posts in your exact style.
                </p>
              </div>

              <div className="space-y-3">
                {posts.map((post, i) => (
                  <div key={i} className="relative">
                    <textarea
                      rows={5}
                      className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/50"
                      placeholder={`Post ${i + 1} — paste your LinkedIn post here`}
                      value={post}
                      onChange={(e) => updatePost(i, e.target.value)}
                    />
                    {posts.length > 1 && (
                      <button
                        onClick={() => removePost(i)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {posts.length < 6 && (
                <Button variant="outline" size="sm" onClick={addPost} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Add another post
                </Button>
              )}
            </section>

            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button size="lg" onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analysing your voice…</>
              ) : saved ? (
                <><CheckCheck className="w-4 h-4 text-green-300" />Voice profile saved!</>
              ) : (
                <><Brain className="w-4 h-4" />Analyse & Save My Voice</>
              )}
            </Button>

            {!persona?.voice_profile && (
              <p className="text-xs text-muted-foreground">
                Gemini will analyse your posts and create a voice profile. This takes about 5 seconds.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
