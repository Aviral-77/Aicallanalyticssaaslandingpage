const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("repostai_token");
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.detail ?? "Request failed", res.status);
  }
  return data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  repurpose: (payload: RepurposeRequest) =>
    request<RepurposeResponse>("/content/repurpose", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  history: () => request<RepurposeResponse[]>("/content/history"),

  fromTopic: (payload: TopicRequest) =>
    request<TopicResponse>("/content/from-topic", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPersona: () => request<PersonaOut>("/persona/me"),

  scrapeLinkedin: (profile_url: string) =>
    request<ScrapeLinkedinResponse>("/persona/scrape-linkedin", {
      method: "POST",
      body: JSON.stringify({ profile_url }),
    }),

  savePersona: (payload: PersonaUpdate) =>
    request<PersonaOut>("/persona/save", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  schedulePost: (payload: SchedulePostRequest) =>
    request<ScheduledPostOut>("/posts/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getScheduled: () => request<ScheduledPostOut[]>("/posts/scheduled"),

  updateScheduledStatus: (id: number, new_status: string) =>
    request<ScheduledPostOut>(`/posts/scheduled/${id}/status?new_status=${new_status}`, {
      method: "PATCH",
    }),

  completeOnboarding: () =>
    request<{ ok: boolean }>("/auth/complete-onboarding", { method: "POST" }),

  suggestTopics: () =>
    request<{ topics: TopicSuggestion[] }>("/persona/suggest-topics"),
};

// Types mirroring backend schemas
export interface User {
  id: number;
  name: string;
  email: string;
  linkedin_url?: string;
  credits: number;
  onboarding_complete: boolean;
  created_at: string;
}

export interface TopicSuggestion {
  topic: string;
  hook: string;
  why: string;
}

export interface RepurposeRequest {
  source_url: string;
  source_type: "youtube" | "blog" | "article" | "podcast";
  platform: "linkedin" | "twitter";
  tone: string;
}

export interface PostVersion {
  version: number;
  angle_id: string;
  angle_label: string;
  content: string;
}

export interface RepurposeResponse {
  id?: number;
  source_url: string;
  source_title?: string;
  platform: string;
  tone: string;
  versions: PostVersion[];
  generated_content: string; // = versions[0].content
  created_at?: string;
}

export interface CarouselSlide {
  slide_number: number;
  slide_type: "cover" | "insight" | "stat" | "quote" | "list" | "cta";
  emoji: string;
  headline: string;
  subheadline: string;
  body: string;
}

export interface TopicRequest {
  topic: string;
  tone: string;
}

export interface TopicResponse {
  topic: string;
  tone: string;
  versions: PostVersion[];
  carousel_slides: CarouselSlide[];
  generated_content: string;
}

export interface PersonaUpdate {
  linkedin_url?: string;
  sample_posts: string[];
}

export interface VoiceProfile {
  summary: string;
  hook_style: string;
  tone: string;
  tone_label: string;
  sentence_style: string;
  structure: string;
  key_phrases: string[];
  formatting: string;
  cta_style: string;
}

export interface PersonaOut {
  linkedin_url?: string;
  sample_posts: string[];
  voice_profile?: VoiceProfile;
  has_profile: boolean;
  updated_at?: string;
}

export interface ScrapeLinkedinResponse {
  posts: string[];
  error: string;
}

export interface SchedulePostRequest {
  content: string;
  platform: string;
  scheduled_for: string; // ISO datetime string
  source_label?: string;
}

export interface ScheduledPostOut {
  id: number;
  content: string;
  platform: string;
  scheduled_for: string;
  status: "pending" | "posted" | "cancelled";
  source_label?: string;
  created_at: string;
}
