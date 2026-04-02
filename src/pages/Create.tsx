import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, PostVersion, RepurposeResponse } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import {
  Youtube,
  FileText,
  Link2,
  Mic,
  Linkedin,
  Twitter,
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  RefreshCw,
  CheckCheck,
  LogOut,
  ChevronRight,
  Download,
  Brain,
  Lightbulb,
  BookOpen,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SourceType = "youtube" | "blog" | "article" | "podcast";
type Platform = "linkedin" | "twitter";

interface ContentType {
  id: SourceType;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  hint: string;
  color: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    id: "youtube",
    label: "YouTube Video",
    icon: Youtube,
    placeholder: "https://youtu.be/...",
    hint: "Paste the YouTube video or podcast URL",
    color: "text-red-500",
  },
  {
    id: "blog",
    label: "Blog Post",
    icon: FileText,
    placeholder: "https://medium.com/...",
    hint: "Paste a Medium, Substack, or Dev.to link",
    color: "text-blue-500",
  },
  {
    id: "article",
    label: "Article / URL",
    icon: Link2,
    placeholder: "https://...",
    hint: "Any publicly accessible article or webpage",
    color: "text-green-500",
  },
  {
    id: "podcast",
    label: "Podcast Episode",
    icon: Mic,
    placeholder: "https://open.spotify.com/episode/...",
    hint: "Paste a Spotify or podcast episode page URL",
    color: "text-purple-500",
  },
];

const PLATFORMS = [
  { id: "linkedin" as Platform, label: "LinkedIn", icon: Linkedin, color: "bg-blue-600" },
  { id: "twitter" as Platform, label: "Twitter / X", icon: Twitter, color: "bg-sky-500" },
];

const TONES = [
  { id: "thought_leader", label: "Thought Leader", description: "Authoritative & insightful" },
  { id: "casual", label: "Casual", description: "Friendly & conversational" },
  { id: "storytelling", label: "Storytelling", description: "Narrative with a personal angle" },
  { id: "data_driven", label: "Data-Driven", description: "Stats, evidence, analysis" },
  { id: "contrarian", label: "Contrarian", description: "Bold take, challenges norms" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Create() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [selectedType, setSelectedType] = useState<SourceType | null>(null);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [tone, setTone] = useState("thought_leader");

  // Output state
  const [result, setResult] = useState<RepurposeResponse | null>(null);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [generationStep, setGenerationStep] = useState<"idle" | "extracting" | "searching" | "generating">("idle");
  const [error, setError] = useState("");
  const [copiedVersion, setCopiedVersion] = useState<number | null>(null);

  const isGenerating = generationStep !== "idle";

  const handleGenerate = async () => {
    if (!selectedType || !url.trim()) return;
    setError("");
    setResult(null);
    setActiveVersion(1);
    setGenerationStep("extracting");
    try {
      const t1 = setTimeout(() => setGenerationStep("searching"), 3000);
      const t2 = setTimeout(() => setGenerationStep("generating"), 6000);
      const res = await api.repurpose({
        source_url: url.trim(),
        source_type: selectedType,
        platform,
        tone,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerationStep("idle");
    }
  };

  const handleCopy = (version: PostVersion) => {
    navigator.clipboard.writeText(version.content);
    setCopiedVersion(version.version);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  const handleDownload = (version: PostVersion) => {
    const blob = new Blob([version.content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repost-${result?.platform ?? "post"}-v${version.version}-${Date.now()}.txt`;
    a.click();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const selectedContentType = CONTENT_TYPES.find((c) => c.id === selectedType);
  const canGenerate = !!selectedType && url.trim().length > 0;

  const ANGLE_ICONS: Record<string, React.ElementType> = {
    hook_insights: Lightbulb,
    story_arc:     BookOpen,
    bold_take:     Zap,
  };

  return (
    <div className="min-h-screen bg-muted/20">

      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl px-4 flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">Repost AI</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-10 space-y-10">

        {/* Page title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Create a Post</h1>
          <p className="text-muted-foreground">
            Choose your content source, paste the link, and get a platform-ready post in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">

          {/* Left: form */}
          <div className="space-y-8">

            {/* Step 1: Content type */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">1</span>
                <span>What are you repurposing?</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CONTENT_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const active = selectedType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => {
                        setSelectedType(ct.id);
                        setUrl("");
                        setResult(null);
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                        ${active
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                    >
                      <Icon className={`w-6 h-6 ${active ? "text-primary" : ct.color}`} />
                      <span>{ct.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Paste link (shown only after type is selected) */}
            {selectedType && (
              <section className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">2</span>
                  <span>Paste your link</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="sr-only">Content URL</Label>
                  <div className="relative">
                    {selectedContentType && (
                      <selectedContentType.icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${selectedContentType.color}`} />
                    )}
                    <Input
                      id="url"
                      type="url"
                      className="pl-9"
                      placeholder={selectedContentType?.placeholder ?? "https://..."}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedContentType?.hint}</p>
                </div>
              </section>
            )}

            {/* Step 3: Platform */}
            {selectedType && (
              <section className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">3</span>
                  <span>Which platform?</span>
                </div>
                <div className="flex gap-3">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPlatform(p.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                          ${active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/60 bg-background text-muted-foreground hover:border-primary/40"
                          }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${p.color}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Step 4: Tone */}
            {selectedType && (
              <section className="space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">4</span>
                  <span>Choose your tone</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TONES.map((t) => {
                    const active = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTone(t.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                          ${active
                            ? "border-primary bg-primary/5"
                            : "border-border/60 bg-background hover:border-primary/40"
                          }`}
                      >
                        <div>
                          <div className={`font-medium ${active ? "text-primary" : "text-foreground"}`}>{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                        {active && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Generate button */}
            {selectedType && (
              <Button
                size="lg"
                className="w-full sm:w-auto px-8"
                disabled={!canGenerate || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Post
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Right: output */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Generated Posts
            </div>

            {/* Empty state */}
            {!result && !isGenerating && !error && (
              <Card className="border-dashed border-border/60 bg-background/50">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[220px]">
                    3 post versions will appear here — pick the one that fits best.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Loading: step indicators */}
            {isGenerating && (
              <Card className="border-border/60">
                <CardContent className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="flex flex-col items-start space-y-3 w-full max-w-[240px]">
                    {[
                      { step: "extracting",  label: "Extracting content…",        done: "Content extracted",    icon: Link2 },
                      { step: "searching",   label: "Searching the web…",          done: "Web context found",    icon: Brain },
                      { step: "generating",  label: "Claude writing 3 versions…",  done: "Versions ready",       icon: Sparkles },
                    ].map(({ step, label, done, icon: Icon }, i) => {
                      const steps = ["extracting", "searching", "generating"];
                      const currentIdx = steps.indexOf(generationStep);
                      const thisIdx = i;
                      const isPast    = thisIdx < currentIdx;
                      const isCurrent = thisIdx === currentIdx;
                      return (
                        <div key={step} className="flex items-center space-x-3">
                          {isCurrent ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                          ) : isPast ? (
                            <CheckCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Icon className="w-5 h-5 text-muted-foreground/30 flex-shrink-0" />
                          )}
                          <span className={`text-sm font-medium ${
                            isCurrent ? "text-foreground"
                            : isPast   ? "text-green-600"
                            :            "text-muted-foreground/40"
                          }`}>
                            {isPast ? done : label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Usually 20–40 seconds for 3 versions</p>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Results: 3 version cards */}
            {result && !isGenerating && (
              <div className="space-y-4">
                {/* Source + platform row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {result.platform === "linkedin" ? (
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                        <Linkedin className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center">
                        <Twitter className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium capitalize">{result.platform}</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground capitalize">{result.tone.replace(/_/g, " ")} tone</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={isGenerating} className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate all
                  </Button>
                </div>

                {result.source_title && (
                  <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 truncate">
                    <span className="font-medium">Source:</span> {result.source_title}
                  </div>
                )}

                {/* Version cards */}
                {result.versions.map((v) => {
                  const Icon = ANGLE_ICONS[v.angle_id] ?? Sparkles;
                  const isActive = activeVersion === v.version;
                  const isCopied = copiedVersion === v.version;
                  return (
                    <Card
                      key={v.version}
                      className={`transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "border-primary shadow-md ring-1 ring-primary/20"
                          : "border-border/60 hover:border-primary/30 hover:shadow-sm"
                      }`}
                      onClick={() => setActiveVersion(v.version)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Version header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Version {v.version}
                              </span>
                              <span className="ml-2 text-xs font-medium text-foreground">{v.angle_label}</span>
                            </div>
                          </div>
                          {isActive && (
                            <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                              Selected
                            </div>
                          )}
                        </div>

                        {/* Content — collapsed preview unless selected */}
                        {isActive ? (
                          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-lg p-3 border border-border/40 max-h-80 overflow-y-auto">
                            {v.content}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {v.content}
                          </p>
                        )}

                        {/* Actions — only for selected */}
                        {isActive && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleCopy(v); }}>
                              {isCopied ? (
                                <><CheckCheck className="w-4 h-4 mr-1.5 text-green-300" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-1.5" />Copy Post</>
                              )}
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDownload(v); }}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                <p className="text-center text-xs text-muted-foreground pb-2">
                  Generated by Claude Opus 4.6 · Click a card to expand it
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
