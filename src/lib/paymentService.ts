/**
 * R&C Commodities Payment Service & Provider Abstraction
 *
 * Architecture:
 * Customer -> Cart -> Checkout -> Pending Order -> Payment Service -> Payment Provider -> Verified Payment
 *
 * Designed to support multiple South African payment providers (Paystack, Payfast, Ozow, Direct EFT)
 * without coupling provider logic into React UI components.
 */

export type PaymentMethod = "eft" | "card_paystack" | "card_payfast";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

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
  deliveryMethod?: "collection" | "courier";
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  success: boolean;
  method: PaymentMethod;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  redirectUrl?: string;
  bankDetails?: BankDetails;
  instructions?: string;
  isMockOrTest?: boolean;
  error?: string;
}

export interface PaymentProvider {
  id: PaymentMethod;
  name: string;
  description: string;
  isConfigured: boolean;
  requiresRedirect: boolean;
  initialize(params: PaymentInitParams): Promise<PaymentInitResult>;
  verify(reference: string): Promise<{ verified: boolean; status: PaymentStatus; error?: string }>;
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
class EftPaymentProvider implements PaymentProvider {
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
    // EFT verification is performed authoritatively by the administrator via the Admin Portal
    return {
      verified: false,
      status: "unpaid",
      error: `EFT reference ${reference} requires manual bank receipt verification by administrator.`,
    };
  }
}

/**
 * Paystack Card & Instant EFT Provider
 * Configured via environment variable VITE_PAYSTACK_PUBLIC_KEY.
 * Does NOT hardcode or invent API credentials.
 */
class PaystackPaymentProvider implements PaymentProvider {
  id: PaymentMethod = "card_paystack";
  name = "Credit / Debit Card (Paystack)";
  description = "Instant card payment with 3D Secure via Visa & Mastercard.";
  requiresRedirect = false;

  get isConfigured(): boolean {
    const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
    return Boolean(key && !key.includes("your-paystack-key") && key.startsWith("pk_"));
  }

  async initialize(params: PaymentInitParams): Promise<PaymentInitResult> {
    const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

    if (!this.isConfigured || !key) {
      // Clean fallback: informs user that gateway is ready for key configuration
      return {
        success: false,
        method: "card_paystack",
        paymentReference: `PAY-${params.orderNumber}`,
        paymentStatus: "unpaid",
        error: "Card payments require VITE_PAYSTACK_PUBLIC_KEY to be set in your environment. Please select Direct Bank EFT to place your order immediately.",
      };
    }

    const paymentRef = `PSTK-${params.orderNumber}-${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      method: "card_paystack",
      paymentReference: paymentRef,
      paymentStatus: "pending",
      instructions: "Redirecting to secure card payment gateway...",
    };
  }

  async verify(reference: string): Promise<{ verified: boolean; status: PaymentStatus; error?: string }> {
    return {
      verified: false,
      status: "pending",
      error: `Online verification for reference ${reference} awaiting webhook callback or secret key configuration.`,
    };
  }
}

// Registry of payment providers
const providers: Record<PaymentMethod, PaymentProvider> = {
  eft: new EftPaymentProvider(),
  card_paystack: new PaystackPaymentProvider(),
  card_payfast: {
    id: "card_payfast",
    name: "PayFast (ZAR Gateway)",
    description: "South African credit card and instant EFT gateway.",
    isConfigured: Boolean(import.meta.env.VITE_PAYFAST_MERCHANT_ID),
    requiresRedirect: true,
    async initialize(params: PaymentInitParams) {
      return {
        success: false,
        method: "card_payfast",
        paymentReference: `PF-${params.orderNumber}`,
        paymentStatus: "unpaid",
        error: "PayFast gateway requires VITE_PAYFAST_MERCHANT_ID in environment.",
      };
    },
    async verify() {
      return { verified: false, status: "unpaid" };
    },
  },
};

/**
 * Returns available payment methods with their display information and readiness status.
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
      id: "eft",
      name: providers.eft.name,
      description: providers.eft.description,
      isConfigured: providers.eft.isConfigured,
      badge: "Preferred / Instant Order",
    },
    {
      id: "card_paystack",
      name: providers.card_paystack.name,
      description: providers.card_paystack.description,
      isConfigured: providers.card_paystack.isConfigured,
      badge: providers.card_paystack.isConfigured ? "Ready" : "Pending Gateway Key",
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
  const provider = providers[method] || providers.eft;
  return provider.initialize(params);
}

/**
 * Reports what environment variables are still needed for third-party online card providers.
 */
export function getPaymentConfigStatus(): {
  eftReady: boolean;
  paystackReady: boolean;
  payfastReady: boolean;
  requiredEnvVars: { key: string; description: string; configured: boolean }[];
} {
  const paystackKey = (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined)?.trim();
  const payfastId = (import.meta.env.VITE_PAYFAST_MERCHANT_ID as string | undefined)?.trim();

  return {
    eftReady: true,
    paystackReady: Boolean(paystackKey && paystackKey.startsWith("pk_")),
    payfastReady: Boolean(payfastId),
    requiredEnvVars: [
      {
        key: "VITE_PAYSTACK_PUBLIC_KEY",
        description: "Public key for client-side Paystack card popup (e.g. pk_test_... or pk_live_...)",
        configured: Boolean(paystackKey && paystackKey.startsWith("pk_")),
      },
      {
        key: "PAYSTACK_SECRET_KEY",
        description: "Server-side secret key for automated webhook payment verification (never exposed to client)",
        configured: false,
      },
    ],
  };
}
