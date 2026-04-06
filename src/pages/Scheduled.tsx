import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, ScheduledPostOut } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Sparkles,
  LogOut,
  ArrowLeft,
  CalendarClock,
  Linkedin,
  Twitter,
  Copy,
  CheckCheck,
  Trash2,
  Loader2,
  Clock,
  Settings,
} from "lucide-react";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: string, scheduledFor: string) {
  const isPast = new Date(scheduledFor) < new Date();
  if (status === "posted") return { label: "Posted", cls: "bg-green-100 text-green-700" };
  if (status === "cancelled") return { label: "Cancelled", cls: "bg-gray-100 text-gray-500" };
  if (isPast) return { label: "Due Now", cls: "bg-orange-100 text-orange-700" };
  return { label: "Scheduled", cls: "bg-blue-100 text-blue-700" };
}

export function Scheduled() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<ScheduledPostOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    api.getScheduled()
      .then(setPosts)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (p: ScheduledPostOut) => {
    navigator.clipboard.writeText(p.content);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatus = async (p: ScheduledPostOut, newStatus: "posted" | "cancelled") => {
    setUpdatingId(p.id);
    try {
      const updated = await api.updateScheduledStatus(p.id, newStatus);
      setPosts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const upcoming = posts.filter((p) => p.status === "pending");
  const done = posts.filter((p) => p.status !== "pending");

  return (
    <div className="min-h-screen bg-muted/20">
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
            <Link to="/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Voice Settings</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/"); }}
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-1.5" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scheduled Posts</h1>
            <p className="text-muted-foreground mt-1">
              Your content queue — copy each post when it's time to publish.
            </p>
          </div>
          <Link to="/create">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Create Post
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-background/50">
            <CardContent className="py-16 flex flex-col items-center text-center space-y-3">
              <CalendarClock className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No scheduled posts yet.</p>
              <Link to="/create">
                <Button size="sm" variant="outline">Generate a post</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((p) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      copiedId={copiedId}
                      updatingId={updatingId}
                      onCopy={handleCopy}
                      onStatus={handleStatus}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Done */}
            {done.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  History ({done.length})
                </h2>
                <div className="space-y-3 opacity-70">
                  {done.map((p) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      copiedId={copiedId}
                      updatingId={updatingId}
                      onCopy={handleCopy}
                      onStatus={handleStatus}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({
  post,
  copiedId,
  updatingId,
  onCopy,
  onStatus,
}: {
  post: ScheduledPostOut;
  copiedId: number | null;
  updatingId: number | null;
  onCopy: (p: ScheduledPostOut) => void;
  onStatus: (p: ScheduledPostOut, s: "posted" | "cancelled") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = statusBadge(post.status, post.scheduled_for);
  const isPending = post.status === "pending";
  const isUpdating = updatingId === post.id;

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {post.platform === "linkedin" ? (
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                <Linkedin className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded bg-sky-500 flex items-center justify-center">
                <Twitter className="w-3 h-3 text-white" />
              </div>
            )}
            <span className="text-sm font-medium capitalize">{post.platform}</span>
            {post.source_label && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{post.source_label}</span>
              </>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Scheduled time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {formatDateTime(post.scheduled_for)}
        </div>

        {/* Content preview */}
        <div
          className="text-sm text-foreground cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? (
            <div className="whitespace-pre-wrap bg-muted/20 rounded-lg p-3 border border-border/40 max-h-64 overflow-y-auto">
              {post.content}
            </div>
          ) : (
            <p className="line-clamp-2 text-muted-foreground">{post.content}</p>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onCopy(post)}
            >
              {copiedId === post.id ? (
                <><CheckCheck className="w-4 h-4 mr-1.5 text-green-300" />Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-1.5" />Copy Post</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50"
              disabled={isUpdating}
              onClick={() => onStatus(post, "posted")}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark Posted"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={isUpdating}
              onClick={() => onStatus(post, "cancelled")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
