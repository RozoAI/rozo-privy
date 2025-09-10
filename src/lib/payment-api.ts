import { RozoPayOrderView } from "@rozoai/intent-common";

export interface PaymentResult {
  success: boolean;
  payment?: RozoPayOrderView;
  source?: "rozo" | "daimo";
  error?: string;
}

export interface PaymentPayload {
  appId: string;
  display: {
    intent: string;
    paymentValue: string;
    currency: string;
  };
  destination: {
    destinationAddress: string;
    chainId: string;
    amountUnits: string;
    tokenSymbol: string;
    tokenAddress: string;
  };
  externalId: string;
  metadata: {
    daimoOrderId: string;
    intent: string;
    items?: any[];
    payer?: object;
  };
  preferredChain: string;
  preferredToken: string;
}

interface ApiResponse {
  success: boolean;
  data?: RozoPayOrderView;
  error?: string;
}

interface ApiConfig {
  url: string;
  headers: Record<string, string>;
}

// Environment variable validation
function validateEnvironment(): { rozo: ApiConfig; daimo: ApiConfig } | null {
  const rozoUrl = process.env.ROZO_API_URL;
  const rozoKey = process.env.ROZO_API_KEY;
  const daimoUrl = process.env.DAIMO_API_URL;
  const daimoKey = process.env.DAIMO_API_KEY;

  if (!rozoUrl || !rozoKey || !daimoUrl || !daimoKey) {
    return null;
  }

  return {
    rozo: {
      url: rozoUrl,
      headers: { Authorization: `Bearer ${rozoKey}` },
    },
    daimo: {
      url: daimoUrl,
      headers: { "Api-Key": daimoKey },
    },
  };
}

// Generic API fetcher
async function fetchFromAPI(
  url: string,
  headers: Record<string, string>
): Promise<ApiResponse> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as RozoPayOrderView;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Main payment fetcher with fallback strategy
export async function getPaymentData(id: string): Promise<PaymentResult> {
  if (!id) {
    return { success: false, error: "Payment ID is required" };
  }

  const config = validateEnvironment();
  if (!config) {
    return {
      success: false,
      error:
        "API configuration is missing. Please check environment variables.",
    };
  }

  try {
    // Try Rozo API first
    const rozoResult = await fetchFromAPI(
      `${config.rozo.url}/payment-api/external-id/${id}`,
      config.rozo.headers
    );

    if (rozoResult.success && rozoResult.data) {
      return {
        success: true,
        payment: rozoResult.data,
        source: "rozo",
      };
    }

    // Fallback to Daimo API
    console.warn(
      "Rozo API failed, falling back to Daimo API:",
      rozoResult.error
    );

    const daimoResult = await fetchFromAPI(
      `${config.daimo.url}/payment/${id}`,
      config.daimo.headers
    );

    if (daimoResult.success && daimoResult.data) {
      return {
        success: true,
        payment: daimoResult.data,
        source: "daimo",
      };
    }

    // Both APIs failed
    return {
      success: false,
      error: `Payment not found. Rozo API: ${rozoResult.error}, Daimo API: ${daimoResult.error}`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}

export async function createPayment(
  payload: PaymentPayload
): Promise<PaymentResult> {
  const config = validateEnvironment();
  if (!config) {
    return {
      success: false,
      error:
        "API configuration is missing. Please check environment variables.",
    };
  }

  try {
    const response = await fetch(`${config.rozo.url}/payment-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.rozo.headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as RozoPayOrderView;
    return { success: true, payment: data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
}
