// Stellar API configuration for simplified token-based authentication
export const STELLAR_CONFIG = {
  API_ENDPOINT: "https://aiproxy.rozo.ai/rozo/api/v1/chat/completions",
  REQUEST_TIMEOUT: 30000,
};

export function getStellarToken(): string | null {
  // Check URL params first
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("stellar");

  if (urlToken) {
    // Store in session for later use
    sessionStorage.setItem("stellarToken", urlToken);
    return urlToken;
  }

  // Check session storage as fallback
  return sessionStorage.getItem("stellarToken");
}

export function setStellarToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("stellarToken", token);
  }
}

export function clearStellarToken(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("stellarToken");
  }
}

export function isUsingStellar(): boolean {
  return getStellarToken() !== null;
}
