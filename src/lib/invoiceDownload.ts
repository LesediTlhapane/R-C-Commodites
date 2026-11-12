/**
 * Helper to download official PDF invoices and Order Confirmations.
 */
import type { DbOrder } from "../types";
import { generateInvoicePdf } from "./invoiceGenerator";

/**
 * Downloads an invoice for a successfully placed order, including orders awaiting payment.
 */
export async function downloadPurchaseInvoicePdf(
  order: DbOrder
): Promise<{ success: boolean; error?: string }> {
  try {
    const pdf = await generateInvoicePdf(order);
    pdf.save(`RC-Invoice-${order.order_number}.pdf`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to generate invoice PDF.";
    return { success: false, error: msg };
  }
}

/**
 * Downloads official tax / commercial invoice for a verified paid order.
 * Requires that payment_status === 'paid'.
 */
export async function downloadInvoicePdf(
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch secure access token for paid order
    const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/invoice-token`);
    const data = await res.json();

    if (!res.ok || !data.success || !data.token) {
      throw new Error(
        data.message || data.error || "Invoices are only generated once payment is confirmed as Paid."
      );
    }

    const token = data.token;
    const downloadUrl = `/api/orders/${encodeURIComponent(orderNumber)}/invoice.pdf?token=${encodeURIComponent(token)}`;

    // 2. Open / Trigger browser download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `RC-Invoice-${orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to download invoice PDF.";
    return { success: false, error: msg };
  }
}

/**
 * Downloads order confirmation PDF for any placed order (including unpaid EFT orders).
 * Always available immediately upon placing an order.
 */
export async function downloadOrderConfirmationPdf(
  orderNumber: string,
  _clientOrderFallback?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const downloadUrl = `/api/orders/${encodeURIComponent(orderNumber)}/confirmation.pdf`;
    const res = await fetch(downloadUrl);

    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", `RC-OrderConfirmation-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      return { success: true };
    }

    throw new Error("Unable to retrieve order confirmation.");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to download order confirmation PDF.";
    return { success: false, error: msg };
  }
}
