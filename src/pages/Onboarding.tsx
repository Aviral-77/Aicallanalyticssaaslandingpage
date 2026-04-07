import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, TopicSuggestion, PersonaOut, VoiceProfile } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Sparkles,
  Loader2,
  Linkedin,
  ArrowRight,
  Lightbulb,
  PenLine,
  CheckCircle2,
  Brain,
  Zap,
  MessageSquare,
  BarChart2,
  BookOpen,
  ChevronRight,
} from "lucide-react";

// ── Animated status messages during scrape/analyze ───────────────────────────

const LOADING_STEPS = [
  { icon: Linkedin,      text: "Connecting to LinkedIn…" },
  { icon: Brain,         text: "Reading your recent posts…" },
  { icon: Sparkles,      text: "Analyzing your writing style…" },
  { icon: Lightbulb,     text: "Building your voice profile…" },
];

function LoadingAnimation({ step }: { step: number }) {
  return (
    <div className="space-y-4">
      {LOADING_STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        const active = i === step;
        return (
          <div
            key={i}
            className={`flex items-center gap-3 transition-all duration-500 ${
              done ? "opacity-100" : active ? "opacity-100" : "opacity-30"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                done
                  ? "bg-green-500/20 text-green-500"
                  : active
                  ? "bg-primary/20 text-primary animate-pulse"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span
              className={`text-sm font-medium ${
                done ? "text-green-600 dark:text-green-400" : active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.text}
            </span>
            {active && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />}
          </div>
        );
      })}
    </div>
  );
}

// ── Voice profile card ────────────────────────────────────────────────────────

function VoiceCard({ profile }: { profile: VoiceProfile }) {
  const fields = [
    { icon: MessageSquare, label: "Hook Style",      value: profile.hook_style },
    { icon: Zap,           label: "Tone",            value: profile.tone_label || profile.tone },
    { icon: PenLine,       label: "Sentence Style",  value: profile.sentence_style },
    { icon: BookOpen,      label: "Structure",       value: profile.structure },
    { icon: BarChart2,     label: "Formatting",      value: profile.formatting },
    { icon: Sparkles,      label: "CTA Style",       value: profile.cta_style },
  ];
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-blue-800/40 p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-1">Your Voice Profile</p>
        <p className="text-sm text-blue-100/80 leading-relaxed">{profile.summary}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.filter((f) => f.value).map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-start gap-2.5 bg-white/5 rounded-xl p-3">
              <div className="mt-0.5 p-1.5 bg-blue-500/20 rounded-lg">
                <Icon className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-blue-400/70 font-medium">{f.label}</p>
                <p className="text-xs text-blue-100 mt-0.5 leading-snug">{f.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      {profile.key_phrases?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.key_phrases.slice(0, 6).map((kp) => (
            <span key={kp} className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
              "{kp}"
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topic suggestion chip ─────────────────────────────────────────────────────

function TopicChip({
  suggestion,
  onSelect,
}: {
  suggestion: TopicSuggestion;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group w-full text-left rounded-xl border border-border/60 bg-muted/30 hover:bg-primary/5 hover:border-primary/40 transition-all p-4 space-y-1.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug">{suggestion.topic}</p>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{suggestion.hook}</p>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url ?? "");
  const [loadingStep, setLoadingStep] = useState(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [persona, setPersona] = useState<PersonaOut | null>(null);
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [error, setError] = useState("");
  const [skipAnalyze, setSkipAnalyze] = useState(false);

  // If user already has a persona, skip step 1 and fetch topics directly
  useEffect(() => {
    if (step === 1 && user) {
      // Pre-fill from existing persona if present
      api.getPersona().then((p) => {
        if (p.has_profile) {
          setPersona(p);
          fetchTopics();
          setStep(2);
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const fetchTopics = async () => {
    try {
      const res = await api.suggestTopics();
      setTopics(res.topics ?? []);
    } catch {
      // silently fail — show empty state
    }
  };

  const handleAnalyze = async () => {
    if (!linkedinUrl.trim() && !skipAnalyze) return;
    setError("");
    setIsAnalyzing(true);
    setLoadingStep(0);

    // Animate through steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1800);

    try {
      if (linkedinUrl.trim()) {
        // Scrape LinkedIn
        const scraped = await api.scrapeLinkedin(linkedinUrl.trim());
        if (scraped.posts.length > 0) {
          // Save persona
          await api.savePersona({ linkedin_url: linkedinUrl.trim(), sample_posts: scraped.posts });
        } else if (scraped.error) {
          // LinkedIn requires auth — skip silently
        }
      }
      // Fetch the resulting persona + topics
      const [p] = await Promise.all([api.getPersona(), fetchTopics()]);
      setPersona(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      clearInterval(stepInterval);
      setLoadingStep(LOADING_STEPS.length); // all done
      setTimeout(() => {
        setIsAnalyzing(false);
        setStep(2);
      }, 600);
    }
  };

  const handleTopicSelect = async (topic: string) => {
    await completeOnboarding();
    navigate("/create", { state: { prefillTopic: topic } });
  };

  const handleSkipToCreate = async () => {
    await completeOnboarding();
    navigate("/create");
  };

  const completeOnboarding = async () => {
    try {
      await api.completeOnboarding();
      await refreshUser();
    } catch {
      // ignore
    }
  };

  // ── Step 0: Welcome ─────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-lg space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Repost AI</span>
          </div>

          {/* Hero */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Welcome, {user?.name?.split(" ")[0] ?? "there"}! 👋
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Let's set up your personal AI writing partner — one that writes in <em>your</em> voice, not a generic one.
            </p>
          </div>

          {/* Steps preview */}
          <div className="grid grid-cols-3 gap-3 text-left">
            {[
              { num: "1", title: "Link LinkedIn", desc: "We analyze your style" },
              { num: "2", title: "See your voice", desc: "Your persona, visualized" },
              { num: "3", title: "Start writing", desc: "AI-curated topic ideas" },
            ].map((s) => (
              <div key={s.num} className="rounded-xl border bg-muted/30 p-3 space-y-1">
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {s.num}
                </div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full text-base gap-2" onClick={() => setStep(1)}>
              Let's go <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={handleSkipToCreate}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip setup and go to Create →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: LinkedIn input + analysis ──────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/15 mb-2">
              <Linkedin className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Connect your LinkedIn</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We'll read your recent posts to understand how you write and personalize every generated post to match your voice.
            </p>
          </div>

          {isAnalyzing ? (
            <div className="rounded-2xl border bg-muted/30 p-6">
              <LoadingAnimation step={loadingStep} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your LinkedIn profile URL</label>
                <Input
                  placeholder="https://www.linkedin.com/in/yourname"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  e.g. https://www.linkedin.com/in/johndoe
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                className="w-full h-11 text-base"
                onClick={handleAnalyze}
                disabled={!linkedinUrl.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze my writing style
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={() => { setSkipAnalyze(true); handleAnalyze(); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Skip this step →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 2: Voice profile + topic suggestions ───────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-600 dark:text-green-400 text-sm font-medium px-3 py-1.5 rounded-full mb-1">
            <CheckCircle2 className="w-4 h-4" /> Profile analyzed
          </div>
          <h2 className="text-2xl font-bold">
            Here's your writing voice, {user?.name?.split(" ")[0] ?? ""}
          </h2>
          <p className="text-muted-foreground text-sm">
            Every post we generate will match this style — you can update it anytime in Settings.
          </p>
        </div>

        {/* Voice profile card */}
        {persona?.voice_profile ? (
          <VoiceCard profile={persona.voice_profile} />
        ) : (
          <div className="rounded-2xl border bg-muted/30 p-5 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No voice profile yet — add sample posts in Settings to personalize your writing style.
            </p>
          </div>
        )}

        {/* Topic suggestions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">What should you write about today?</h3>
          </div>

          {topics.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {topics.map((t, i) => (
                <TopicChip key={i} suggestion={t} onSelect={() => handleTopicSelect(t.topic)} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating personalized topics…</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkipToCreate}
          >
            <PenLine className="w-4 h-4 mr-2" />
            Write my own topic
          </Button>
        </div>
      </div>
    </div>
  );
}
