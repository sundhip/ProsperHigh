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

export async function googleSignIn(
  idToken: string
): Promise<{ success: boolean; user?: any; is_new_user?: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || "Google authentication failed.";
      return { success: false, error: errorMsg };
    }

    if (data.user) {
      setStoredUser(data.user);
      return { success: true, user: data.user, is_new_user: data.is_new_user };
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
export async function getLiveTicker(): Promise<{ ticker: any[]; as_of?: string; status?: string; provider?: string }> {
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
export async function askResearch(
  symbol: string,
  query: string,
  options?: {
    documentType?: string;
    year?: string;
    reportingPeriod?: string;
    sessionId?: string;
  }
): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authHeaders = getAuthHeaders();
  if (authHeaders["Authorization"]) {
    headers["Authorization"] = authHeaders["Authorization"];
  }

  const payload: any = {
    symbol: symbol.toUpperCase().trim(),
    query,
  };
  if (options?.documentType) payload.document_type = options.documentType;
  if (options?.year) payload.year = options.year;
  if (options?.reportingPeriod) payload.reporting_period = options.reportingPeriod;
  if (options?.sessionId) payload.session_id = options.sessionId;

  const res = await fetch(`${API_BASE}/api/research/ask`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
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

// ----------------------------------------------------
// PHASE 4: PERSONALIZATION & INTELLIGENCE API
// ----------------------------------------------------

export async function getPortfolioComposition(portfolioId?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) return null;

  try {
    const url = portfolioId
      ? `${API_BASE}/api/portfolio/composition?portfolio_id=${encodeURIComponent(portfolioId)}`
      : `${API_BASE}/api/portfolio/composition`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function calculatePreTradeImpact(payload: {
  symbol: string;
  quantity: number;
  price: number;
  transaction_type?: string;
  portfolio_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/portfolio/pre-trade-impact`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Pre-trade simulation failed.");
  }
  return await res.json();
}

export async function simulateWhatIf(payload: {
  actions: Array<{ action: string; symbol: string; quantity: number; price?: number }>;
  portfolio_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/portfolio/what-if`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "What-If simulation failed.");
  }
  return await res.json();
}

export async function runStressTest(payload: {
  scenario_key?: string;
  custom_market_shock_pct?: number;
  custom_sector_shocks?: Record<string, number>;
  portfolio_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/portfolio/stress-test`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Stress test simulation failed.");
  }
  return await res.json();
}

export async function saveScenario(payload: {
  name: string;
  scenario_type: string;
  parameters: any;
  results: any;
  description?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/portfolio/scenarios`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save scenario.");
  }
  return await res.json();
}

export async function listScenarios(scenarioType?: string): Promise<any[]> {
  try {
    const url = scenarioType
      ? `${API_BASE}/api/portfolio/scenarios?scenario_type=${encodeURIComponent(scenarioType)}`
      : `${API_BASE}/api/portfolio/scenarios`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function deleteScenario(scenarioId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/portfolio/scenarios/${encodeURIComponent(scenarioId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.ok;
}

// ----------------------------------------------------
// GOALS API
// ----------------------------------------------------

export async function getGoals(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/goals/`, { headers: getAuthHeaders() });
    if (res.ok) return await res.json();
    return [];
  } catch (err) {
    return [];
  }
}

export async function createGoal(payload: {
  name: string;
  target_amount: number;
  target_date?: string;
  category?: string;
  priority?: string;
  monthly_contribution?: number;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/goals/`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create goal.");
  }
  return await res.json();
}

export async function updateGoal(goalId: string, payload: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(goalId)}`, {
    method: "PUT",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update goal.");
  }
  return await res.json();
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(goalId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.ok;
}

export async function getGoalProgress(goalId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/goals/${encodeURIComponent(goalId)}/progress`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return null;
  return await res.json();
}

// ----------------------------------------------------
// ANALYSIS SUB-RESOURCES & DEBATE / THESIS
// ----------------------------------------------------

export async function getAnalysisDebate(analysisId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(analysisId)}/debate`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function getAnalysisThesis(analysisId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(analysisId)}/thesis`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function compareAnalyses(runAId: string, runBId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analyze/compare`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ run_a_id: runAId, run_b_id: runBId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to compare analysis runs.");
  }
  return await res.json();
}

export async function runCounterfactual(payload: {
  symbol: string;
  price_drop_pct?: number;
  multiple_compression_pct?: number;
  revenue_miss_pct?: number;
  volatility_spike_pct?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analyze/counterfactual`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Counterfactual simulation failed.");
  }
  return await res.json();
}

// ----------------------------------------------------
// PHASE 5: RESEARCH TERMINAL & DOCUMENT READER API
// ----------------------------------------------------

export async function getDocumentById(docId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/research/documents/${encodeURIComponent(docId)}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function inspectCitation(chunkId: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/research/citations/${encodeURIComponent(chunkId)}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function uploadResearchDocument(
  file: File,
  company: string,
  documentType: string = "Corporate Disclosure"
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("company", company.toUpperCase().trim());
  formData.append("document_type", documentType);

  const authHeaders = getAuthHeaders();
  const headers: Record<string, string> = {};
  if (authHeaders["Authorization"]) {
    headers["Authorization"] = authHeaders["Authorization"];
  }

  const res = await fetch(`${API_BASE}/api/research/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload document.");
  }

  return await res.json();
}

export async function getDriveStatus(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/research/drive/status`);
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

// ----------------------------------------------------
// PHASE 6: WATCHLIST & ALERTS & MARKET INTELLIGENCE API
// ----------------------------------------------------

export async function getWatchlist(): Promise<{ items: any[]; total_count: number }> {
  const user = getStoredUser();
  if (!user) return { items: [], total_count: 0 };

  try {
    const res = await fetch(`${API_BASE}/api/watchlist`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return { items: [], total_count: 0 };
  } catch (err) {
    return { items: [], total_count: 0 };
  }
}

export async function addToWatchlist(symbol: string, notes?: string): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required to manage watchlist.");

  const res = await fetch(`${API_BASE}/api/watchlist`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: symbol.toUpperCase().trim(), notes }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add symbol to watchlist.");
  }
  return await res.json();
}

export async function removeFromWatchlist(symbol: string): Promise<boolean> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required to manage watchlist.");

  const res = await fetch(`${API_BASE}/api/watchlist/${encodeURIComponent(symbol.toUpperCase().trim())}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return res.ok;
}

export async function getAlerts(): Promise<{ alerts: any[]; active_count: number; triggered_count: number }> {
  const user = getStoredUser();
  if (!user) return { alerts: [], active_count: 0, triggered_count: 0 };

  try {
    const res = await fetch(`${API_BASE}/api/alerts`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) return await res.json();
    return { alerts: [], active_count: 0, triggered_count: 0 };
  } catch (err) {
    return { alerts: [], active_count: 0, triggered_count: 0 };
  }
}

export async function createAlert(payload: {
  symbol: string;
  alert_type?: string;
  condition_type?: string;
  threshold_value?: number;
  message?: string;
}): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required to configure alerts.");

  const res = await fetch(`${API_BASE}/api/alerts`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create alert.");
  }
  return await res.json();
}

export async function dismissAlert(alertId: string): Promise<any> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(alertId)}/dismiss`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to dismiss alert.");
  }
  return await res.json();
}

export async function deleteAlert(alertId: string): Promise<boolean> {
  const user = getStoredUser();
  if (!user) throw new Error("Authentication required.");

  const res = await fetch(`${API_BASE}/api/alerts/${encodeURIComponent(alertId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return res.ok;
}

export async function getMarketIntelligence(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/api/market/intelligence`);
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function compareInstruments(symbols: string[]): Promise<any> {
  try {
    const q = symbols.map((s) => s.toUpperCase().trim()).join(",");
    const res = await fetch(`${API_BASE}/api/market/compare?symbols=${encodeURIComponent(q)}`);
    if (res.ok) return await res.json();
    return null;
  } catch (err) {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    // Graceful handling of network disconnect during signout
  } finally {
    clearStoredUser();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

