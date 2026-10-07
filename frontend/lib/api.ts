import { getStoredUser, setStoredUser, getAuthHeaders, clearStoredUser } from "./auth";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function registerUser(
  name: string,
  email: string,
  pass: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || (data.validation_errors && data.validation_errors[0]?.message) || "Registration failed.";
      return { success: false, error: errorMsg };
    }

    if (data.user) {
      setStoredUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, error: "Unexpected response format from server." };
  } catch (err: any) {
    return { success: false, error: "Backend service is unreachable. Please ensure the API is running." };
  }
}

export async function loginUser(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || "Invalid email address or password.";
      return { success: false, error: errorMsg };
    }

    if (data.user) {
      setStoredUser(data.user);
      return { success: true, user: data.user };
    }
    return { success: false, error: "Unexpected response format from server." };
  } catch (err: any) {
    return { success: false, error: "Backend service is unreachable. Please ensure the API is running." };
  }
}

// ----------------------------------------------------
// ONBOARDING & PROFILE API
// ----------------------------------------------------
export async function saveOnboardingProfile(profileData: any): Promise<any> {
  const user = getStoredUser();
  if (!user) {
    throw new Error("You must be signed in to save profile settings.");
  }

  const res = await fetch(`${API_BASE}/api/profile/onboarding`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to save profile on server.");
  }

  user.hasCompletedOnboarding = true;
  setStoredUser(user);

  return await res.json();
}

export async function getProfile(userId?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) return null;

  try {
    const targetUrl = userId && userId !== user.id 
      ? `${API_BASE}/api/profile/${userId}` 
      : `${API_BASE}/api/profile/me`;

    const res = await fetch(targetUrl, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      clearStoredUser();
      return null;
    }

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function updateProfile(profileData: any): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/profile/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update profile.");
  }
  return await res.json();
}

// ----------------------------------------------------
// PORTFOLIO API
// ----------------------------------------------------
export async function getPortfolio(userId?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) return null;

  try {
    const targetUrl = userId && userId !== user.id
      ? `${API_BASE}/api/portfolio/${userId}`
      : `${API_BASE}/api/portfolio/me`;

    const res = await fetch(targetUrl, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      clearStoredUser();
      return null;
    }

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function listPortfolios(): Promise<any[]> {
  const user = getStoredUser();
  if (!user) return [];

  try {
    const res = await fetch(`${API_BASE}/api/portfolio/list`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function addHolding(symbol: string, quantity: number, price: number, portfolioId?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/portfolio/holding`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      symbol: symbol.toUpperCase().trim(),
      quantity: Number(quantity),
      average_price: Number(price),
      portfolio_id: portfolioId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add holding.");
  }

  return await res.json();
}

export async function deleteHolding(holdingId: number): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/portfolio/holding/${holdingId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to remove holding.");
  }

  return await res.json();
}

export async function getTransactions(portfolioId?: string): Promise<any[]> {
  const user = getStoredUser();
  if (!user) return [];

  try {
    const url = portfolioId
      ? `${API_BASE}/api/portfolio/transactions/list?portfolio_id=${encodeURIComponent(portfolioId)}`
      : `${API_BASE}/api/portfolio/transactions/list`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function createTransaction(data: {
  symbol: string;
  transaction_type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
  portfolio_id?: string;
}): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/portfolio/transaction`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      symbol: data.symbol.toUpperCase().trim(),
      quantity: Number(data.quantity),
      price: Number(data.price),
      fees: Number(data.fees || 0),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to record transaction.");
  }

  return await res.json();
}

export async function importPortfolioCSV(
  fileOrContent: File | string,
  portfolioId?: string
): Promise<{ success: boolean; imported_count: number; message: string; rows: any[] }> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  let csvContent = "";
  if (typeof fileOrContent === "string") {
    csvContent = fileOrContent;
  } else {
    csvContent = await fileOrContent.text();
  }

  const res = await fetch(`${API_BASE}/api/portfolio/import-csv`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      csv_content: csvContent,
      portfolio_id: portfolioId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to import portfolio CSV.");
  }

  return await res.json();
}

// ----------------------------------------------------
// MARKET & STOCKS API
// ----------------------------------------------------
export async function getLiveTicker(): Promise<{ ticker: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/market/ticker`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return { ticker: [] };
}

export async function getQuote(symbol: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/market/quote/${encodeURIComponent(symbol.toUpperCase().trim())}`);
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function searchStocks(query: string = ""): Promise<{ stocks: any[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/stocks/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
  } catch (err) {}

  return { stocks: [] };
}

// ----------------------------------------------------
// MULTI-AGENT ANALYSIS API
// ----------------------------------------------------
export async function analyzeStock(symbol: string, userId?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) {
    throw new Error("Authentication required to run personalized multi-agent analysis.");
  }

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ symbol: symbol.toUpperCase().trim() }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Stock analysis failed on server.");
  }

  return await res.json();
}

export async function getAnalysisHistory(): Promise<any[]> {
  const user = getStoredUser();
  if (!user) return [];

  try {
    const res = await fetch(`${API_BASE}/api/analyze/history`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function getAnalysisById(analysisId: string): Promise<any | null> {
  const user = getStoredUser();
  if (!user) return null;

  try {
    const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(analysisId)}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

// ----------------------------------------------------
// RESEARCH TERMINAL API
// ----------------------------------------------------
export async function askResearch(symbol: string, query: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authHeaders = getAuthHeaders();
  if (authHeaders["Authorization"]) {
    headers["Authorization"] = authHeaders["Authorization"];
  }

  const res = await fetch(`${API_BASE}/api/research/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify({ symbol: symbol.toUpperCase().trim(), query }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Research query failed.");
  }

  return await res.json();
}

export async function getResearchHistory(): Promise<any[]> {
  const user = getStoredUser();
  if (!user) return [];

  try {
    const res = await fetch(`${API_BASE}/api/research/history`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function getResearchDocuments(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/research/documents`);
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}
