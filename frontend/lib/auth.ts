export interface UserSession {
  id: string;
  name: string;
  email: string;
  token: string;
  hasCompletedOnboarding?: boolean;
}

const AUTH_KEY = "prosperhigh_user_session";

export function getStoredUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getAuthToken(): string | null {
  const user = getStoredUser();
  return user?.token || null;
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function setStoredUser(user: UserSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth-changed"));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
