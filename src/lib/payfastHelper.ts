import crypto from "crypto";

export interface PayfastConfig {
  isSandbox: boolean;
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  processUrl: string;
  validateUrl: string;
}

export interface PayfastPaymentRequestFields {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  email_confirmation?: string;
  confirmation_address?: string;
  signature?: string;
  [key: string]: string | undefined;
}

export interface PayfastItnPayload {
  m_payment_id: string;
  pf_payment_id?: string;
  payment_status: "COMPLETE" | "FAILED" | "CANCELLED" | string;
  item_name?: string;
  item_description?: string;
  amount_gross: string;
  amount_fee?: string;
  amount_net?: string;
  custom_str1?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  merchant_id: string;
  signature: string;
  [key: string]: string | undefined;
}

/**
 * Generates MD5 signature for Payfast requests according to official specifications:
 * 1. Collect all non-signature, non-empty parameters.
 * 2. URL encode key-value pairs (with spaces replaced by '+').
 * 3. Append passphrase if configured.
 * 4. Compute MD5 checksum hash in lowercase hexadecimal.
 */
export function generatePayfastSignature(
  data: Record<string, string | number | undefined | null>,
  passphrase?: string
): string {
  let pfOutput = "";

  for (const key of Object.keys(data)) {
    if (key === "signature") continue;
    const rawVal = data[key];
    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== "") {
      const valStr = String(rawVal).trim();
      pfOutput += `${key}=${encodeURIComponent(valStr).replace(/%20/g, "+")}&`;
    }
  }

  let getString = pfOutput.slice(0, -1);
  if (passphrase && passphrase.trim()) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(getString).digest("hex");
}

/**
 * Validates received Payfast signature against expected signature.
 */
export function verifyPayfastSignature(
  data: Record<string, string | undefined>,
  receivedSignature: string,
  passphrase?: string
): boolean {
  if (!receivedSignature) return false;
  const calculated = generatePayfastSignature(data, passphrase);
  return calculated.toLowerCase() === receivedSignature.trim().toLowerCase();
}
