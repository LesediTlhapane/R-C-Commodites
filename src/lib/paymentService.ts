/**
 * R&C Commodities Payment Service & Provider Abstraction
 *
 * Architecture:
 * Customer -> Cart -> Checkout -> Persisted Supabase Order (status: pending)
 *   -> Backend Server creates signed Payfast Payment Request
 *   -> Customer proceeds to Payfast Hosted Portal (Apple Pay, Instant EFT, Card)
 *   -> Payfast processes payment
 *   -> Payfast ITN server-to-server notification
 *   -> Server verifies signature, amount, merchant, and updates Supabase to 'paid'
 *   -> Admin Portal & Storefront show verified paid status
 */

export type PaymentMethod = "card_payfast" | "eft" | "card_paystack";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled" | "unpaid";

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  branchName: string;
  reference: string;
}

export interface PaymentInitParams {
  orderNumber: string;
  amount: number; // In ZAR
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  deliveryMethod?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  success: boolean;
  method: PaymentMethod;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  processUrl?: string;
  fields?: Record<string, string>;
  redirectUrl?: string;
  bankDetails?: BankDetails;
  instructions?: string;
  isMockOrTest?: boolean;
  error?: string;
}

/**
 * Standard Bank South Africa - Official R&C Commodities Selby Account
 */
export const OFFICIAL_BANK_DETAILS: Omit<BankDetails, "reference"> = {
  bankName: "Standard Bank",
  accountName: "R&C Commodities (Pty) Ltd",
  accountNumber: "022849102",
  branchCode: "051001",
  branchName: "Selby",
};

/**
 * Direct Bank Transfer (EFT) Provider
 * Instant official banking details with unique order reference and WhatsApp proof-of-payment flow.
 */
class EftPaymentProvider {
  id: PaymentMethod = "eft";
  name = "Direct Bank EFT / Electronic Funds Transfer";
  description = "Immediate payment via online banking to R&C Commodities Standard Bank Selby account.";
  isConfigured = true;
  requiresRedirect = false;

  async initialize(params: PaymentInitParams): Promise<PaymentInitResult> {
    return {
      success: true,
      method: "eft",
      paymentReference: params.orderNumber,
      paymentStatus: "unpaid",
      bankDetails: {
        ...OFFICIAL_BANK_DETAILS,
        reference: params.orderNumber,
      },
      instructions: `Please transfer R${params.amount.toLocaleString("en-ZA")}.00 using reference ${params.orderNumber}. Send proof of payment to Costa on WhatsApp (+27 83 227 3237).`,
    };
  }

  async verify(reference: string): Promise<{ verified: boolean; status: PaymentStatus; error?: string }> {
    return {
      verified: false,
      status: "unpaid",
      error: `EFT reference ${reference} requires manual bank receipt verification by administrator.`,
    };
  }
}

/**
 * Payfast Online Payment Provider (Apple Pay, Instant EFT, Credit/Debit Cards)
 * Integrates via secure backend endpoint /api/payfast/create-payment.
 * Secret keys and passphrase NEVER touch client-side JavaScript.
 */
class PayfastPaymentProvider {
  id: PaymentMethod = "card_payfast";
  name = "Pay Online (Card, Instant EFT, Apple Pay via Payfast)";
  description = "Secure online payment with Apple Pay, Visa, Mastercard, Instant EFT & Capitec Pay.";
  isConfigured = true;
  requiresRedirect = true;

  async initialize(params: PaymentInitParams): Promise<PaymentInitResult> {
    try {
      const response = await fetch("/api/payfast/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: params.orderNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          method: "card_payfast",
          paymentReference: params.orderNumber,
          paymentStatus: "pending",
          error: data.error || "Failed to initialize secure Payfast gateway session.",
        };
      }

      return {
        success: true,
        method: "card_payfast",
        paymentReference: params.orderNumber,
        paymentStatus: "pending",
        processUrl: data.processUrl,
        fields: data.fields,
        instructions: "Proceeding to Payfast secure checkout...",
      };
    } catch (err: unknown) {
      console.error("[Payfast] Payment initialization network error:", err);
      const msg = err instanceof Error ? err.message : "Network error contacting payment server.";
      return {
        success: false,
        method: "card_payfast",
        paymentReference: params.orderNumber,
        paymentStatus: "pending",
        error: `${msg} You may also choose Direct Bank EFT to place your order immediately.`,
      };
    }
  }

  async verify(orderNumber: string): Promise<{ verified: boolean; status: PaymentStatus; error?: string }> {
    try {
      const res = await fetch(`/api/payfast/status/${encodeURIComponent(orderNumber)}`);
      if (!res.ok) {
        return { verified: false, status: "pending", error: "Could not fetch status." };
      }
      const data = await res.json();
      return {
        verified: data.paymentStatus === "paid",
        status: data.paymentStatus || "pending",
      };
    } catch (err: unknown) {
      return { verified: false, status: "pending", error: String(err) };
    }
  }
}

// Registry of payment providers
const eftProvider = new EftPaymentProvider();
const payfastProvider = new PayfastPaymentProvider();

/**
 * Returns available payment methods with their display information.
 * Payfast is the primary online payment provider. Direct Bank EFT is the manual fallback.
 */
export function getAvailablePaymentMethods(): {
  id: PaymentMethod;
  name: string;
  description: string;
  isConfigured: boolean;
  badge?: string;
}[] {
  return [
    {
      id: "card_payfast",
      name: "Pay Online",
      description: "Fast, secure payment via Apple Pay, Instant EFT, Credit or Debit Card (Visa / Mastercard).",
      isConfigured: true,
      badge: "Apple Pay & Cards",
    },
    {
      id: "eft",
      name: "Direct Bank EFT",
      description: "Transfer directly to R&C Commodities Selby Standard Bank account.",
      isConfigured: true,
      badge: "Manual EFT",
    },
  ];
}

/**
 * Initializes payment for an order through the configured payment provider.
 */
export async function initializeOrderPayment(
  method: PaymentMethod,
  params: PaymentInitParams
): Promise<PaymentInitResult> {
  if (method === "card_payfast") {
    return payfastProvider.initialize(params);
  }
  return eftProvider.initialize(params);
}

/**
 * Safely redirects the customer to the Payfast hosted payment portal
 * using an auto-submitting POST form containing the server-signed fields.
 */
export function submitPayfastPaymentForm(processUrl: string, fields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = processUrl;
  form.style.display = "none";

  // When embedded in an iframe (e.g. AI Studio preview pane), Payfast rejects being loaded
  // inside an iframe ("refused to connect" / X-Frame-Options: SAMEORIGIN).
  // Target the top window so the browser navigates the main page directly.
  try {
    if (typeof window !== "undefined" && window.self !== window.top) {
      form.target = "_top";
    }
  } catch {
    form.target = "_top";
  }

  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

/**
 * Queries the authoritative server status for an order
 */
export async function fetchServerPaymentStatus(orderNumber: string): Promise<{
  success: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  orderStatus?: string;
  total?: number;
  paymentReference?: string;
  order?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/payfast/status/${encodeURIComponent(orderNumber)}`);
    if (!res.ok) {
      return { success: false, paymentStatus: "pending", error: "Status check failed" };
    }
    const data = await res.json();
    return {
      success: true,
      paymentStatus: (data.paymentStatus as PaymentStatus) || "pending",
      paymentMethod: data.paymentMethod,
      orderStatus: data.orderStatus,
      total: data.total,
      paymentReference: data.paymentReference,
      order: data.order,
    };
  } catch (err: unknown) {
    return {
      success: false,
      paymentStatus: "pending",
      error: err instanceof Error ? err.message : "Error contacting server",
    };
  }
}
