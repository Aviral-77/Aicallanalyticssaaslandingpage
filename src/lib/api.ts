const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("repostai_token");
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
    throw new Error(data.detail ?? "Request failed");
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
};

// Types mirroring backend schemas
export interface User {
  id: number;
  name: string;
  email: string;
  linkedin_url?: string;
  created_at: string;
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
