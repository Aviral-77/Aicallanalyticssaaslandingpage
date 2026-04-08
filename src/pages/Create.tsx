import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, ApiError, PostVersion, RepurposeResponse, TopicResponse, TopicSuggestion, PersonaOut } from "../lib/api";
import { CarouselPreview } from "../components/CarouselPreview";
import { UpgradeModal } from "../components/UpgradeModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { applyFormat } from "../lib/formatText";
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
  PenLine,
  LayoutTemplate,
  CalendarClock,
  Settings,
  Bold,
  Italic,
  RotateCcw,
  Calendar,
  X,
  Coins,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "topic" | "repurpose";
type RepurposeType = "youtube" | "blog" | "article" | "podcast";
type Platform = "linkedin" | "twitter";
type OutputTab = "post" | "carousel";

const REPURPOSE_TYPES = [
  { id: "youtube" as RepurposeType, label: "YouTube", icon: Youtube, placeholder: "https://youtu.be/...", hint: "YouTube video or podcast episode URL", color: "text-red-500", bg: "bg-red-50 border-red-200" },
  { id: "blog"    as RepurposeType, label: "Blog Post", icon: FileText, placeholder: "https://medium.com/...", hint: "Medium, Substack, Dev.to or any blog link", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  { id: "article" as RepurposeType, label: "Article", icon: Link2, placeholder: "https://...", hint: "Any publicly accessible article or webpage", color: "text-green-500", bg: "bg-green-50 border-green-200" },
  { id: "podcast" as RepurposeType, label: "Podcast", icon: Mic, placeholder: "https://open.spotify.com/episode/...", hint: "Spotify or podcast episode page URL", color: "text-purple-500", bg: "bg-purple-50 border-purple-200" },
];

const PLATFORMS = [
  { id: "linkedin" as Platform, label: "LinkedIn", icon: Linkedin, color: "bg-blue-600" },
  { id: "twitter" as Platform, label: "Twitter / X", icon: Twitter, color: "bg-sky-500" },
];

const TONES = [
  { id: "thought_leader", label: "Thought Leader" },
  { id: "casual",         label: "Casual" },
  { id: "storytelling",   label: "Storytelling" },
  { id: "data_driven",    label: "Data-Driven" },
  { id: "contrarian",     label: "Contrarian" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Create() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as { prefillTopic?: string } | null)?.prefillTopic ?? "";

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>(prefill ? "topic" : "topic");

  // ── Topic mode state ──────────────────────────────────────────────────────
  const [topic, setTopic] = useState(prefill);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [persona, setPersona] = useState<PersonaOut | null>(null);

  // ── Repurpose mode state ──────────────────────────────────────────────────
  const [repurposeType, setRepurposeType] = useState<RepurposeType | null>(null);
  const [repurposeUrl, setRepurposeUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("linkedin");

  // ── Shared form state ─────────────────────────────────────────────────────
  const [tone, setTone] = useState("thought_leader");

  // ── Output state ──────────────────────────────────────────────────────────
  const [result, setResult] = useState<RepurposeResponse | null>(null);
  const [topicResult, setTopicResult] = useState<TopicResponse | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("post");
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [generationStep, setGenerationStep] = useState<"idle" | "extracting" | "searching" | "generating">("idle");
  const [error, setError] = useState("");
  const [copiedVersion, setCopiedVersion] = useState<number | null>(null);
  const [editedContents, setEditedContents] = useState<Record<number, string>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Upgrade modal ─────────────────────────────────────────────────────────
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"out_of_credits" | "upgrade_click">("upgrade_click");

  // ── Schedule state ────────────────────────────────────────────────────────
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // ── On mount: fetch suggestions + persona ─────────────────────────────────
  useEffect(() => {
    setLoadingSuggestions(true);
    api.suggestTopics()
      .then((res) => setSuggestions(res.topics ?? []))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));

    api.getPersona()
      .then((p) => { if (p.has_profile) setPersona(p); })
      .catch(() => {});
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isGenerating = generationStep !== "idle";
  const isTopicMode = mode === "topic";
  const canGenerate = isTopicMode
    ? topic.trim().length > 0
    : repurposeType !== null && repurposeUrl.trim().length > 0;

  const activeVersions = isTopicMode ? (topicResult?.versions ?? []) : (result?.versions ?? []);
  const hasResult = isTopicMode ? !!topicResult : !!result;

  const ANGLE_ICONS: Record<string, React.ElementType> = {
    hook_insights: Lightbulb,
    story_arc: BookOpen,
    bold_take: Zap,
  };

  const topicSteps = [
    { step: "searching",  label: "Researching the web…",            done: "Research complete", icon: Brain },
    { step: "generating", label: "Gemini writing post + carousel…", done: "Content ready",     icon: Sparkles },
  ];
  const urlSteps = [
    { step: "extracting", label: "Extracting content…",        done: "Content extracted", icon: Link2 },
    { step: "searching",  label: "Searching the web…",          done: "Web context found", icon: Brain },
    { step: "generating", label: "Gemini writing 3 versions…",  done: "Versions ready",    icon: Sparkles },
  ];
  const loadingSteps = isTopicMode ? topicSteps : urlSteps;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const getContent = (v: PostVersion) => editedContents[v.version] ?? v.content;

  const handleFormat = (type: "bold" | "italic") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const updated = applyFormat(ta.value, start, end, type);
    setEditedContents((prev) => ({ ...prev, [activeVersion]: updated }));
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, end);
      }
    });
  };

  const handleScheduleSave = async () => {
    const versions = isTopicMode ? (topicResult?.versions ?? []) : (result?.versions ?? []);
    const activeV = versions.find((v) => v.version === activeVersion);
    if (!activeV || !scheduleDate) return;
    const content = getContent(activeV);
    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    const plt = isTopicMode ? "linkedin" : (result?.platform ?? "linkedin");
    const sourceLabel = isTopicMode
      ? `Topic: ${topicResult?.topic}`
      : result?.source_title ?? result?.source_url ?? "";
    setScheduleSaving(true);
    try {
      await api.schedulePost({ content, platform: plt, scheduled_for: scheduledFor, source_label: sourceLabel });
      setScheduleSaved(true);
      setTimeout(() => { setScheduleSaved(false); setShowSchedule(false); }, 2000);
    } catch { /* ignore */ } finally {
      setScheduleSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setError("");
    setResult(null);
    setTopicResult(null);
    setActiveVersion(1);
    setActiveTab("post");
    setEditedContents({});
    setShowSchedule(false);

    if (isTopicMode) {
      setGenerationStep("searching");
      try {
        const t1 = setTimeout(() => setGenerationStep("generating"), 4000);
        const res = await api.fromTopic({ topic: topic.trim(), tone });
        clearTimeout(t1);
        setTopicResult(res);
        await refreshUser();
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 402) { setUpgradeReason("out_of_credits"); setShowUpgrade(true); }
        else setError(err instanceof Error ? err.message : "Generation failed");
      } finally { setGenerationStep("idle"); }
    } else {
      setGenerationStep("extracting");
      try {
        const t1 = setTimeout(() => setGenerationStep("searching"),  3000);
        const t2 = setTimeout(() => setGenerationStep("generating"), 6000);
        const res = await api.repurpose({ source_url: repurposeUrl.trim(), source_type: repurposeType!, platform, tone });
        clearTimeout(t1); clearTimeout(t2);
        setResult(res);
        await refreshUser();
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 402) { setUpgradeReason("out_of_credits"); setShowUpgrade(true); }
        else setError(err instanceof Error ? err.message : "Generation failed");
      } finally { setGenerationStep("idle"); }
    }
  };

  const handleCopy = (version: PostVersion) => {
    navigator.clipboard.writeText(getContent(version));
    setCopiedVersion(version.version);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  const handleDownload = (version: PostVersion) => {
    const blob = new Blob([getContent(version)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repost-${isTopicMode ? "topic" : result?.platform ?? "post"}-v${version.version}-${Date.now()}.txt`;
    a.click();
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-muted/20">

      {/* Upgrade modal */}
      {showUpgrade && <UpgradeModal trigger={upgradeReason} onClose={() => setShowUpgrade(false)} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl px-4 flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">Repost AI</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {user && (
              <button
                onClick={() => { setUpgradeReason("upgrade_click"); setShowUpgrade(true); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
                  user.credits === 0 ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                  : user.credits <= 3 ? "bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                {user.credits} credit{user.credits !== 1 ? "s" : ""}
              </button>
            )}
            <Link to="/scheduled" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors">
              <CalendarClock className="w-4 h-4" /><span className="hidden sm:inline">Scheduled</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors">
              <Settings className="w-4 h-4" /><span className="hidden sm:inline">Voice</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">

          {/* ── Left: form ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Mode toggle tabs */}
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                onClick={() => { setMode("topic"); setResult(null); setTopicResult(null); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === "topic" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenLine className="w-4 h-4" /> Write a Post
              </button>
              <button
                onClick={() => { setMode("repurpose"); setResult(null); setTopicResult(null); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === "repurpose" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Link2 className="w-4 h-4" /> Repurpose from Link
              </button>
            </div>

            {/* ── TOPIC MODE ──────────────────────────────────────────────── */}
            {mode === "topic" && (
              <div className="space-y-5">

                {/* Voice chip */}
                {persona?.voice_profile && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-blue-800">
                        Writing in {firstName}'s voice
                      </span>
                      <span className="text-xs text-blue-600 ml-1.5 hidden sm:inline">
                        · {persona.voice_profile.tone_label || persona.voice_profile.tone}
                      </span>
                    </div>
                    <Link to="/settings" className="ml-auto text-xs text-blue-500 hover:text-blue-700 flex-shrink-0 hover:underline">
                      Edit voice
                    </Link>
                  </div>
                )}

                {/* Topic input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">What do you want to write about?</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border-2 border-border/60 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary resize-none transition-colors leading-relaxed"
                    placeholder={`e.g. "Why most startups fail at product-market fit" or "The future of AI in developer tools"`}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.metaKey && canGenerate && !isGenerating && handleGenerate()}
                  />
                  <p className="text-xs text-muted-foreground">Generates a LinkedIn post + carousel slide deck</p>
                </div>

                {/* AI topic suggestions */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {persona?.has_profile ? `Suggested for ${firstName}` : "Topic ideas"}
                    </span>
                    {loadingSuggestions && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  </div>
                  {suggestions.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {suggestions.slice(0, 5).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setTopic(s.topic)}
                          className={`text-left px-4 py-3 rounded-xl border transition-all group ${
                            topic === s.topic
                              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                              : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground leading-snug">{s.topic}</p>
                            <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${topic === s.topic ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-1">{s.hook}</p>
                        </button>
                      ))}
                    </div>
                  ) : !loadingSuggestions ? (
                    <p className="text-xs text-muted-foreground italic">
                      Add your LinkedIn posts in <Link to="/settings" className="underline text-primary">Voice settings</Link> to get personalised suggestions.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* ── REPURPOSE MODE ───────────────────────────────────────────── */}
            {mode === "repurpose" && (
              <div className="space-y-5">

                {/* Source type grid */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">What are you repurposing?</label>
                  <div className="grid grid-cols-2 gap-3">
                    {REPURPOSE_TYPES.map((rt) => {
                      const Icon = rt.icon;
                      const active = repurposeType === rt.id;
                      return (
                        <button
                          key={rt.id}
                          onClick={() => { setRepurposeType(rt.id); setRepurposeUrl(""); setResult(null); setError(""); }}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left ${
                            active
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : rt.color}`} />
                          {rt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* URL input */}
                {repurposeType && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Paste the link</label>
                    <Input
                      type="url"
                      placeholder={REPURPOSE_TYPES.find((r) => r.id === repurposeType)?.placeholder ?? "https://..."}
                      value={repurposeUrl}
                      onChange={(e) => setRepurposeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && canGenerate && !isGenerating && handleGenerate()}
                      className="h-11 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {REPURPOSE_TYPES.find((r) => r.id === repurposeType)?.hint}
                    </p>
                  </div>
                )}

                {/* Platform */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Platform</label>
                  <div className="flex gap-2">
                    {PLATFORMS.map((p) => {
                      const Icon = p.icon;
                      const active = platform === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-background text-muted-foreground hover:border-primary/30"
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
                </div>
              </div>
            )}

            {/* ── Tone — both modes ────────────────────────────────────────── */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      tone === t.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Generate button ──────────────────────────────────────────── */}
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity shadow-md"
              disabled={!canGenerate || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4" />{isTopicMode ? "Research & Generate Post" : "Generate Post"}</>
              )}
            </Button>
          </div>

          {/* ── Right: output ──────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Generated Content
            </div>

            {/* Empty state */}
            {!hasResult && !isGenerating && !error && (
              <Card className="border-dashed border-border/60 bg-background/50">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[240px]">
                    {isTopicMode
                      ? "Post + carousel will appear here — select a topic or type your own."
                      : "3 post versions will appear here — pick the one that fits best."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Loading: step indicators */}
            {isGenerating && (
              <Card className="border-border/60">
                <CardContent className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="flex flex-col items-start space-y-3 w-full max-w-[280px]">
                    {loadingSteps.map(({ step, label, done, icon: Icon }, i) => {
                      const stepIds = loadingSteps.map((s) => s.step);
                      const currentIdx = stepIds.indexOf(generationStep);
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
                  <p className="text-xs text-muted-foreground">
                    {isTopicMode
                      ? "Usually 30–60 seconds — post + carousel in parallel"
                      : "Usually 20–40 seconds for 3 versions"}
                  </p>
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

            {/* Results */}
            {hasResult && !isGenerating && (
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                      <Linkedin className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">
                      {isTopicMode ? "LinkedIn" : result?.platform ?? "LinkedIn"}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {(isTopicMode ? topicResult?.tone : result?.tone)?.replace(/_/g, " ")} tone
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleGenerate} disabled={isGenerating} className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>

                {/* Topic badge or source title */}
                {isTopicMode && topicResult && (
                  <div className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg truncate">
                    <span className="font-medium text-orange-700">Topic:</span>{" "}
                    <span className="text-orange-600">{topicResult.topic}</span>
                  </div>
                )}
                {!isTopicMode && result?.source_title && (
                  <div className="text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 truncate">
                    <span className="font-medium">Source:</span> {result.source_title}
                  </div>
                )}

                {/* Output tabs — Post | Carousel (topic mode only) */}
                {isTopicMode && (
                  <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit">
                    <button
                      onClick={() => setActiveTab("post")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "post"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Post
                    </button>
                    <button
                      onClick={() => setActiveTab("carousel")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === "carousel"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      Carousel
                      {topicResult?.carousel_slides && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          {topicResult.carousel_slides.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Carousel tab content */}
                {isTopicMode && activeTab === "carousel" && topicResult?.carousel_slides && (
                  <CarouselPreview slides={topicResult.carousel_slides} />
                )}

                {/* Version cards — shown in post tab (or always for URL flow) */}
                {(!isTopicMode || activeTab === "post") && (
                  <>
                    {activeVersions.map((v) => {
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

                            {/* Content — textarea with formatting toolbar when selected */}
                            {isActive ? (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                {/* Formatting toolbar */}
                                <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg w-fit">
                                  <button
                                    title="Bold — select text then click"
                                    onClick={() => handleFormat("bold")}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold hover:bg-background transition-colors"
                                  >
                                    <Bold className="w-3.5 h-3.5" /> Bold
                                  </button>
                                  <button
                                    title="Italic — select text then click"
                                    onClick={() => handleFormat("italic")}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs italic hover:bg-background transition-colors"
                                  >
                                    <Italic className="w-3.5 h-3.5" /> Italic
                                  </button>
                                  {editedContents[v.version] !== undefined && (
                                    <button
                                      title="Reset to original"
                                      onClick={() => setEditedContents((p) => { const n = {...p}; delete n[v.version]; return n; })}
                                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:bg-background transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Reset
                                    </button>
                                  )}
                                  <span className="text-xs text-muted-foreground/40 pl-1 hidden sm:inline">select text, then click</span>
                                </div>
                                <textarea
                                  ref={textareaRef}
                                  rows={10}
                                  className="w-full resize-y rounded-lg border border-border/40 bg-muted/20 p-3 text-sm text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                                  value={getContent(v)}
                                  onChange={(e) => setEditedContents((p) => ({ ...p, [v.version]: e.target.value }))}
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                {getContent(v)}
                              </p>
                            )}

                            {/* Actions — only for selected */}
                            {isActive && (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 flex-wrap">
                                  <Button size="sm" className="flex-1 min-w-[100px]" onClick={() => handleCopy(v)}>
                                    {isCopied ? (
                                      <><CheckCheck className="w-4 h-4 mr-1.5 text-green-300" />Copied!</>
                                    ) : (
                                      <><Copy className="w-4 h-4 mr-1.5" />Copy Post</>
                                    )}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDownload(v)}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => setShowSchedule((s) => !s)}
                                  >
                                    <CalendarClock className="w-4 h-4" />
                                    Schedule
                                  </Button>
                                </div>

                                {/* Inline schedule picker */}
                                {showSchedule && (
                                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        Schedule this post
                                      </span>
                                      <button onClick={() => setShowSchedule(false)} className="text-blue-400 hover:text-blue-600">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      <input
                                        type="date"
                                        value={scheduleDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        className="flex-1 min-w-[140px] rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className="w-[110px] rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      className="w-full"
                                      disabled={!scheduleDate || scheduleSaving}
                                      onClick={handleScheduleSave}
                                    >
                                      {scheduleSaving ? (
                                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving…</>
                                      ) : scheduleSaved ? (
                                        <><CheckCheck className="w-4 h-4 mr-1.5 text-green-300" />Scheduled!</>
                                      ) : (
                                        <><CalendarClock className="w-4 h-4 mr-1.5" />Confirm Schedule</>
                                      )}
                                    </Button>
                                    <p className="text-xs text-blue-600 text-center">
                                      View in{" "}
                                      <Link to="/scheduled" className="underline hover:text-blue-800">Scheduled Posts</Link>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    <p className="text-center text-xs text-muted-foreground pb-2">
                      Generated by Gemini 2.0 Flash · Click a card to expand it
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
