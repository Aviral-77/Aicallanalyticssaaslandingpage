import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, PersonaOut, VoiceProfile } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  MessageSquare,
  AlignLeft,
  Hash,
  Target,
  RefreshCw,
  User,
  ClipboardPaste,
} from "lucide-react";

// ── Tone badge colours ─────────────────────────────────────────────────────────
const TONE_COLORS: Record<string, string> = {
  thought_leader: "bg-purple-100 text-purple-700 border-purple-200",
  casual:         "bg-green-100  text-green-700  border-green-200",
  storytelling:   "bg-orange-100 text-orange-700 border-orange-200",
  data_driven:    "bg-blue-100   text-blue-700   border-blue-200",
  contrarian:     "bg-red-100    text-red-700    border-red-200",
};

// ── Voice profile card ─────────────────────────────────────────────────────────
function VoiceProfileCard({ profile, userName }: { profile: VoiceProfile; userName: string }) {
  const toneClass = TONE_COLORS[profile.tone] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const firstName = userName.split(" ")[0];

  const sections = [
    { icon: Zap,          label: "Hook Style",    value: profile.hook_style    },
    { icon: AlignLeft,    label: "Sentences",      value: profile.sentence_style },
    { icon: Brain,        label: "Structure",      value: profile.structure     },
    { icon: MessageSquare,label: "Formatting",     value: profile.formatting    },
    { icon: Target,       label: "CTA Style",      value: profile.cta_style     },
  ].filter((s) => s.value);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-gray-900 text-base">{firstName}'s Voice Profile</h3>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${toneClass}`}>
              {profile.tone_label || profile.tone}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
        </div>
      </div>

      {/* Grid sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm text-gray-700 leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* Key phrases */}
      {profile.key_phrases.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Phrases</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.key_phrases.map((phrase) => (
              <span
                key={phrase}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/8 text-primary border border-primary/20 font-medium"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Active — all generated posts will match {firstName}'s voice
      </p>
    </div>
  );
}

// ── Post sample card ───────────────────────────────────────────────────────────
function PostCard({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0 || value.length === 0);
  const preview = value.trim().slice(0, 120);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => value && setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
          {value ? (
            <p className="text-sm text-gray-600 truncate">{preview}{preview.length < value.trim().length ? "…" : ""}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Empty — paste a post</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {value && (
            expanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Textarea */}
      {expanded && (
        <div className="p-3">
          <textarea
            autoFocus={!value}
            rows={6}
            className="w-full resize-none text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none leading-relaxed"
            placeholder={`Paste LinkedIn post #${index + 1} here…`}
            value={value}
            onChange={(e) => { onChange(e.target.value); }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // "linkedin" = scrape tab, "paste" = manual paste tab
  const [inputTab, setInputTab] = useState<"linkedin" | "paste">("linkedin");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [posts, setPosts] = useState<string[]>(["", "", ""]);
  const [persona, setPersona] = useState<PersonaOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Scraping state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api.getPersona()
      .then((p) => {
        setPersona(p);
        setLinkedinUrl(p.linkedin_url ?? "");
        if (p.sample_posts.length > 0) {
          const padded = [...p.sample_posts];
          while (padded.length < 3) padded.push("");
          setPosts(padded);
          // If they already have pasted posts but no linkedin URL, start on paste tab
          if (!p.linkedin_url && p.sample_posts.some((s) => s.trim())) {
            setInputTab("paste");
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleScrape = async () => {
    if (!linkedinUrl.trim()) return;
    setScrapeError("");
    setScrapeSuccess(false);
    setIsScraping(true);
    try {
      const res = await api.scrapeLinkedin(linkedinUrl.trim());
      if (res.error) {
        setScrapeError(res.error);
      } else if (res.posts.length === 0) {
        setScrapeError("No posts found on this profile. Try pasting them manually instead.");
      } else {
        const padded = [...res.posts];
        while (padded.length < 3) padded.push("");
        setPosts(padded);
        setScrapeSuccess(true);
        setTimeout(() => setScrapeSuccess(false), 3000);
      }
    } catch (err: unknown) {
      setScrapeError(err instanceof Error ? err.message : "Scraping failed");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async () => {
    const cleanPosts = posts.filter((p) => p.trim().length > 0);
    if (cleanPosts.length === 0) {
      setSaveError("Add at least one LinkedIn post so Repost AI can learn your voice.");
      return;
    }
    setSaveError("");
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
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const addPost = () => setPosts((p) => [...p, ""]);
  const removePost = (i: number) => setPosts((p) => p.filter((_, idx) => idx !== i));
  const updatePost = (i: number, val: string) =>
    setPosts((p) => p.map((v, idx) => (idx === i ? val : v)));

  const filledCount = posts.filter((p) => p.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 to-white">
      {/* Top bar */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto max-w-3xl px-4 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/create" className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold">Repost AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/scheduled" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors">
              <CalendarClock className="w-4 h-4" />
              <span className="hidden sm:inline">Scheduled</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-10">

        {/* Hero section */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Settings</h1>
            <p className="text-gray-500 mt-1 text-sm leading-relaxed">
              Import posts from LinkedIn or paste them manually. Repost AI analyses your writing style and matches it in every generated post.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-gray-400">Loading your profile…</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Active voice profile ───────────────────────────────────────── */}
            {persona?.voice_profile && (
              <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50/60 overflow-hidden">
                <CardContent className="p-6">
                  <VoiceProfileCard profile={persona.voice_profile} userName={user?.name ?? "You"} />
                </CardContent>
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              </Card>
            )}

            {/* ── Input method tabs ──────────────────────────────────────────── */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setInputTab("linkedin")}
                  className={`flex items-center gap-2 flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    inputTab === "linkedin"
                      ? "bg-white text-blue-700 border-b-2 border-blue-600"
                      : "bg-gray-50 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Linkedin className="w-4 h-4" />
                  Import from LinkedIn
                </button>
                <button
                  onClick={() => setInputTab("paste")}
                  className={`flex items-center gap-2 flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    inputTab === "paste"
                      ? "bg-white text-primary border-b-2 border-primary"
                      : "bg-gray-50 text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Paste Posts Manually
                </button>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* LinkedIn tab */}
                {inputTab === "linkedin" && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Paste your LinkedIn profile URL and we'll try to auto-import your recent posts. If your profile is private, switch to the manual tab instead.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/yourhandle"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                      />
                      <Button
                        variant="outline"
                        onClick={handleScrape}
                        disabled={!linkedinUrl.trim() || isScraping}
                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 flex-shrink-0"
                      >
                        {isScraping ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Scraping…</>
                        ) : scrapeSuccess ? (
                          <><CheckCheck className="w-4 h-4 text-green-500" />Imported!</>
                        ) : (
                          <><Download className="w-4 h-4" />Import Posts</>
                        )}
                      </Button>
                    </div>

                    {scrapeError && (
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-xl">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                        <span>{scrapeError} — <button onClick={() => setInputTab("paste")} className="underline font-medium">paste posts manually</button></span>
                      </div>
                    )}

                    {scrapeSuccess && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-4 py-3 rounded-xl">
                        <CheckCheck className="w-4 h-4" />
                        <span>Imported {posts.filter((p) => p.trim()).length} posts! Review them in the Paste Posts tab, then click Analyse.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste posts tab */}
                {inputTab === "paste" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Sample Posts
                          {filledCount > 0 && (
                            <span className="ml-2 text-xs font-normal text-gray-400">{filledCount} added</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Copy-paste 3–5 of your best LinkedIn posts. More examples = better voice match.
                        </p>
                      </div>
                      {persona?.has_profile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-400 gap-1"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Re-analyse
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {posts.map((post, i) => (
                        <PostCard
                          key={i}
                          index={i}
                          value={post}
                          onChange={(v) => updatePost(i, v)}
                          onRemove={() => removePost(i)}
                          canRemove={posts.length > 1}
                        />
                      ))}
                    </div>

                    {posts.length < 6 && (
                      <button
                        onClick={addPost}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add another post
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Save / analyse ─────────────────────────────────────────────── */}
            {saveError && (
              <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysing your voice…
                </>
              ) : saved ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Voice profile saved!
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {persona?.has_profile ? "Update Voice Profile" : "Analyse & Build Voice Profile"}
                </>
              )}
            </Button>

            {!persona?.has_profile && (
              <p className="text-xs text-gray-400 text-center">
                Gemini reads your posts and creates a personal style guide. Takes ~5 seconds.
              </p>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
