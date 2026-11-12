import { jsPDF } from "jspdf";
import rcLogoUrl from "../assets/rc-logo.png";
import type { DbOrder } from "../types";

export interface BusinessInfo {
  name: string;
  tradingAs?: string;
  companyRegistration?: string;
  vatNumber?: string;
  email: string;
  phone: string;
  phoneSecondary?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  website: string;
}

export const OFFICIAL_BUSINESS_INFO: BusinessInfo = {
  name: "R&C Commodities",
  tradingAs: "R&C Commodities (Pty) Ltd",
  companyRegistration: "", // Not fabricated; left blank per instructions
  vatNumber: "", // Not fabricated; only populated if officially registered for VAT
  email: "orders@rc-commodities.co.za",
  phone: "+27 83 227 3237",
  phoneSecondary: "+27 83 467 1394",
  address: "Selby Industrial Area",
  city: "Johannesburg, Gauteng",
  postalCode: "2001",
  country: "South Africa",
  website: "www.rc-commodities.co.za",
};

export const OFFICIAL_BANK_DETAILS = {
  bankName: "First National Bank (FNB)",
  accountName: "R&C Commodities",
  accountNumber: "63098234891",
  branchCode: "250655",
  accountType: "Business Cheque / Current Account",
  swiftCode: "FIRNZAJJ",
};

async function addInvoiceLogo(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to load the R&C logo for the invoice."));
    image.src = rcLogoUrl;
  });
  doc.addImage(image, "PNG", x, y, width, height);
}

/**
 * Generates an official publication-quality A4 PDF invoice document for a placed order.
 * In compliance with Section 20(4) of the South African VAT Act:
 * Only labeled "TAX INVOICE" if the business has an official VAT registration number configured.
 * Otherwise accurately labeled "COMMERCIAL INVOICE" with zero VAT disclosure.
 */
export async function generateInvoicePdf(
  order: DbOrder,
  businessInfo: BusinessInfo = OFFICIAL_BUSINESS_INFO
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const brandDark = [15, 23, 42]; // slate-900
  const brandRed = [225, 29, 72]; // rose-600
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500
  const lineGray = [226, 232, 240]; // slate-200
  const boxBg = [248, 250, 252]; // slate-50

  const isVatRegistered = Boolean(businessInfo.vatNumber && businessInfo.vatNumber.trim());
  const invoiceTitle = isVatRegistered ? "TAX INVOICE" : "COMMERCIAL INVOICE";
  const isPaid = order.payment_status === "paid";

  let y = margin;

  // 1. TOP BRAND ACCENT BAR
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.rect(0, 8, pageWidth, 2, "F");

  y = 22;

  // Business Branding Header
  await addInvoiceLogo(doc, margin, 13, 27, 27);
  const headerTextX = margin + 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("R&C COMMODITIES", headerTextX, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text("MOTORCYCLE TYRES & PERFORMANCE ACCESSORIES", headerTextX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${businessInfo.address}, ${businessInfo.city}`, headerTextX, y + 10);
  doc.text(`Contact: ${businessInfo.phone} | ${businessInfo.phoneSecondary || ""}`, headerTextX, y + 14);
  doc.text(`Email: ${businessInfo.email} | Web: ${businessInfo.website}`, headerTextX, y + 18);

  if (isVatRegistered) {
    doc.text(`VAT Reg No: ${businessInfo.vatNumber}`, headerTextX, y + 22);
  }

  // Invoice Title on top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(invoiceTitle, pageWidth - margin, y + 2, { align: "right" });

  const invoiceNum = order.invoice_number || `INV-${order.order_number}`;
  const invoiceDate = order.invoice_issued_at
    ? new Date(order.invoice_issued_at).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
    : order.paid_at
    ? new Date(order.paid_at).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
    : new Date(order.created_at).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Invoice No: ${invoiceNum}`, pageWidth - margin, y + 9, { align: "right" });
  doc.text(`Order No: ${order.order_number}`, pageWidth - margin, y + 14, { align: "right" });
  doc.text(`Date of Issue: ${invoiceDate}`, pageWidth - margin, y + 19, { align: "right" });

  // 2. METADATA BOX: Bill To & Settlement Confirmation
  y = isVatRegistered ? 52 : 48;
  const boxHeight = 36;
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

  const colWidth = contentWidth / 2;

  // Left Column: Customer details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("BILLED TO / CUSTOMER DETAILS", margin + 5, y + 7);

  const customerName =
    order.customer_name ||
    (order.customer ? `${order.customer.first_name} ${order.customer.last_name || ""}`.trim() : "Valued Customer");
  const customerEmail = order.customer_email || order.customer?.email || "—";
  const customerPhone = order.customer_phone || order.customer?.phone || "—";
  const deliveryAddress =
    order.delivery_address || order.shipping_address || (order.customer?.address ? `${order.customer.address}, ${order.customer.city || ""}` : "Nationwide Delivery");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Name: ${customerName}`, margin + 5, y + 13);
  doc.text(`Email: ${customerEmail}`, margin + 5, y + 18);
  doc.text(`Phone: ${customerPhone}`, margin + 5, y + 23);
  const truncatedAddr = deliveryAddress.length > 48 ? `${deliveryAddress.substring(0, 48)}...` : deliveryAddress;
  doc.text(`Delivery: ${truncatedAddr}`, margin + 5, y + 28);

  // Right Column: Payment & Settlement
  const col2X = margin + colWidth + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("PAYMENT STATUS", col2X, y + 7);

  const paymentMethodLabel =
    order.payment_method === "card_payfast"
      ? "PayFast Online Gateway"
      : order.payment_method === "bank_eft" || order.payment_method === "eft_bank" || order.payment_method === "eft"
      ? "Direct Bank EFT (First National Bank)"
      : "Electronic Payment";

  const paymentRef = order.payment_reference || order.payment_transaction_id || `REF-${order.order_number}`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Method: ${paymentMethodLabel}`, col2X, y + 13);
  doc.text(`Payment Ref: ${paymentRef}`, col2X, y + 18);
  doc.text(`Fulfilment: ${order.delivery_method || "Nationwide Delivery (Free)"}`, col2X, y + 23);

  // Status Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  if (isPaid) {
    doc.setTextColor(16, 149, 102);
    doc.text("STATUS: PAID & CONFIRMED", col2X, y + 29);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text("STATUS: PAYMENT PENDING", col2X, y + 29);
  }

  // 3. PRODUCTS TABLE
  y = isVatRegistered ? 96 : 92;

  // Table Header
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM DESCRIPTION", margin + 4, y + 5.5);
  doc.text("QTY", margin + 115, y + 5.5, { align: "right" });
  doc.text("UNIT PRICE (ZAR)", margin + 145, y + 5.5, { align: "right" });
  doc.text("TOTAL (ZAR)", pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 8;

  // Line items
  const items = order.order_items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  if (items.length === 0) {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("Motorcycle Tyre / Performance Accessories Package", margin + 4, y + 6);
    doc.text("1", margin + 115, y + 6, { align: "right" });
    doc.text(`R ${Number(order.total).toLocaleString("en-ZA")}.00`, margin + 145, y + 6, { align: "right" });
    doc.text(`R ${Number(order.total).toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 6, { align: "right" });
    y += 10;
  } else {
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, y, contentWidth, 8, "F");
      }

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const name = item.product_name.length > 55 ? `${item.product_name.substring(0, 52)}...` : item.product_name;
      doc.text(name, margin + 4, y + 5.5);
      doc.text(String(item.quantity), margin + 115, y + 5.5, { align: "right" });
      doc.text(`R ${Number(item.unit_price).toLocaleString("en-ZA")}.00`, margin + 145, y + 5.5, { align: "right" });
      doc.text(`R ${Number(item.subtotal).toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 5.5, { align: "right" });

      doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      y += 8;
    });
  }

  // 4. TOTALS SECTION
  y += 4;
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

  const totalAmount = Number(order.total || 0);

  if (isVatRegistered) {
    // 15% standard rate inclusive calculation
    const vatRate = 0.15;
    const subtotalExVat = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - subtotalExVat;

    doc.text("Subtotal (Excl. VAT):", totalsX, y + 5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`R ${subtotalExVat.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 5, { align: "right" });

    y += 6;
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("VAT (15%):", totalsX, y + 5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`R ${vatAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, y + 5, { align: "right" });
  } else {
    doc.text("Subtotal:", totalsX, y + 5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`R ${totalAmount.toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 5, { align: "right" });

    y += 6;
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("VAT (0% - Not Registered):", totalsX, y + 5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("R 0.00", pageWidth - margin - 4, y + 5, { align: "right" });
  }

  // Delivery
  y += 6;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Insured Nationwide Delivery:", totalsX, y + 5);
  doc.setTextColor(16, 149, 102);
  doc.text("FREE", pageWidth - margin - 4, y + 5, { align: "right" });

  // Grand Total Highlight
  y += 8;
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.roundedRect(totalsX - 3, y, totalsWidth + 3, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(isPaid ? "AMOUNT PAID:" : "AMOUNT DUE:", totalsX + 2, y + 6.5);
  doc.text(`R ${totalAmount.toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 6.5, { align: "right" });

  // 5. PAYMENT & DISPATCH NOTICE
  y += 24;
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text(isPaid ? "FULFILMENT & DISPATCH CONFIRMATION" : "PAYMENT REQUIRED TO PROCESS ORDER", margin + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  if (isPaid) {
    doc.text(
      "Thank you for choosing R&C Commodities. Your payment has been received and verified.",
      margin + 4,
      y + 11
    );
    doc.text(
      "All motorcycle tyres and accessories undergo quality inspection at our Selby depot prior to nationwide dispatch.",
      margin + 4,
      y + 15
    );
    doc.text(
      "For courier tracking, collection, or fitment assistance: Costa (+27 83 227 3237) | Dhevan (+27 83 467 1394).",
      margin + 4,
      y + 19
    );
  } else {
    doc.text(
      "Please complete payment using the method selected at checkout. Use your order number as the payment reference.",
      margin + 4,
      y + 12
    );
    doc.text(
      "Your order will be processed once payment is received and verified.",
      margin + 4,
      y + 18
    );
  }

  // 6. FOOTER
  const footerY = pageHeight - 16;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("R&C Commodities — Motorcycle Tyres, Workshop Logistics & Paddock Gear", margin, footerY);
  doc.text(
    isVatRegistered ? "Tax Invoice · Retain for records" : "Commercial Invoice / Proof of Payment",
    pageWidth - margin,
    footerY,
    { align: "right" }
  );

  return doc;
}

/**
 * Generates an official publication-quality A4 PDF Order Confirmation document for customers
 * immediately upon placing an order (including unpaid Direct Bank EFT orders).
 * For unpaid orders, explicitly displays "ORDER CONFIRMATION – PAYMENT PENDING" and full EFT banking details.
 */
export function generateOrderConfirmationPdf(
  order: DbOrder,
  businessInfo: BusinessInfo = OFFICIAL_BUSINESS_INFO
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const brandDark = [15, 23, 42]; // slate-900
  const brandRed = [225, 29, 72]; // rose-600
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500
  const lineGray = [226, 232, 240]; // slate-200
  const boxBg = [248, 250, 252]; // slate-50

  const isPaid = order.payment_status === "paid";
  const titleText = isPaid
    ? "ORDER CONFIRMATION"
    : "ORDER CONFIRMATION – PAYMENT PENDING";

  let y = margin;

  // 1. TOP BRAND ACCENT BAR
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Accent stripe: Amber if pending, Rose/Emerald if paid
  if (!isPaid) {
    doc.setFillColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
  }
  doc.rect(0, 8, pageWidth, 2, "F");

  y = 22;

  // Business Branding Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("R&C COMMODITIES", margin, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
  doc.text("MOTORCYCLE TYRES & PERFORMANCE ACCESSORIES", margin, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${businessInfo.address}, ${businessInfo.city}`, margin, y + 10);
  doc.text(`Contact: ${businessInfo.phone} | ${businessInfo.phoneSecondary || ""}`, margin, y + 14);
  doc.text(`Email: ${businessInfo.email} | Web: ${businessInfo.website}`, margin, y + 18);

  // Document Title on top right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isPaid ? 18 : 13);
  if (!isPaid) {
    doc.setTextColor(217, 119, 6); // amber-600
  } else {
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  }
  doc.text(titleText, pageWidth - margin, y + 2, { align: "right" });

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
    : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Order Reference: ${order.order_number}`, pageWidth - margin, y + 9, { align: "right" });
  doc.text(`Order Date: ${orderDate}`, pageWidth - margin, y + 14, { align: "right" });

  // 2. METADATA BOX: Customer & Order Details
  y = 48;
  const boxHeight = 36;
  doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

  const colWidth = contentWidth / 2;

  // Left Column: Customer Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("CUSTOMER & DELIVERY INFORMATION", margin + 5, y + 7);

  const customerName =
    order.customer_name ||
    (order.customer ? `${order.customer.first_name} ${order.customer.last_name || ""}`.trim() : "Valued Customer");
  const customerEmail = order.customer_email || order.customer?.email || "—";
  const customerPhone = order.customer_phone || order.customer?.phone || "—";
  const deliveryAddress =
    order.delivery_address || order.shipping_address || (order.customer?.address ? `${order.customer.address}, ${order.customer.city || ""}` : "Nationwide Delivery");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Name: ${customerName}`, margin + 5, y + 13);
  doc.text(`Email: ${customerEmail}`, margin + 5, y + 18);
  doc.text(`Phone: ${customerPhone}`, margin + 5, y + 23);
  const truncatedAddr = deliveryAddress.length > 48 ? `${deliveryAddress.substring(0, 48)}...` : deliveryAddress;
  doc.text(`Address: ${truncatedAddr}`, margin + 5, y + 28);

  // Right Column: Order & Payment Status
  const col2X = margin + colWidth + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.text("ORDER & PAYMENT STATUS", col2X, y + 7);

  const paymentMethodLabel =
    order.payment_method === "card_payfast"
      ? "PayFast Online Gateway"
      : order.payment_method === "bank_eft" || order.payment_method === "eft_bank" || order.payment_method === "eft"
      ? "Direct Bank EFT"
      : "Electronic Payment";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Payment Method: ${paymentMethodLabel}`, col2X, y + 13);
  doc.text(`Reference: ${order.payment_reference || order.order_number}`, col2X, y + 18);
  doc.text(`Fulfilment: ${order.delivery_method || "Nationwide Delivery (Free)"}`, col2X, y + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  if (isPaid) {
    doc.setTextColor(16, 149, 102);
    doc.text("PAYMENT: CONFIRMED & RECEIVED", col2X, y + 29);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text("PAYMENT: PENDING EFT SETTLEMENT", col2X, y + 29);
  }

  // 3. PRODUCTS TABLE
  y = 92;

  // Table Header
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ORDERED FITMENTS & ITEMS", margin + 4, y + 5.5);
  doc.text("QTY", margin + 115, y + 5.5, { align: "right" });
  doc.text("UNIT PRICE (ZAR)", margin + 145, y + 5.5, { align: "right" });
  doc.text("TOTAL (ZAR)", pageWidth - margin - 4, y + 5.5, { align: "right" });

  y += 8;

  const items = order.order_items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  if (items.length === 0) {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text("Motorcycle Tyre / Performance Accessories Package", margin + 4, y + 6);
    doc.text("1", margin + 115, y + 6, { align: "right" });
    doc.text(`R ${Number(order.total).toLocaleString("en-ZA")}.00`, margin + 145, y + 6, { align: "right" });
    doc.text(`R ${Number(order.total).toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 6, { align: "right" });
    y += 10;
  } else {
    items.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, y, contentWidth, 8, "F");
      }

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const name = item.product_name.length > 55 ? `${item.product_name.substring(0, 52)}...` : item.product_name;
      doc.text(name, margin + 4, y + 5.5);
      doc.text(String(item.quantity), margin + 115, y + 5.5, { align: "right" });
      doc.text(`R ${Number(item.unit_price).toLocaleString("en-ZA")}.00`, margin + 145, y + 5.5, { align: "right" });
      doc.text(`R ${Number(item.subtotal).toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 5.5, { align: "right" });

      doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      y += 8;
    });
  }

  // 4. TOTALS SECTION
  y += 4;
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);

  const totalAmount = Number(order.total || 0);

  doc.text("Subtotal:", totalsX, y + 5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`R ${totalAmount.toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 5, { align: "right" });

  y += 6;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Nationwide Delivery:", totalsX, y + 5);
  doc.setTextColor(16, 149, 102);
  doc.text("FREE", pageWidth - margin - 4, y + 5, { align: "right" });

  y += 8;
  doc.setFillColor(brandDark[0], brandDark[1], brandDark[2]);
  doc.roundedRect(totalsX - 3, y, totalsWidth + 3, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("ORDER TOTAL:", totalsX + 2, y + 6.5);
  doc.text(`R ${totalAmount.toLocaleString("en-ZA")}.00`, pageWidth - margin - 4, y + 6.5, { align: "right" });

  // 5. EFT PAYMENT INSTRUCTIONS BOX (If unpaid)
  y += 24;
  if (!isPaid) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text("DIRECT BANK EFT REMITTANCE DETAILS", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Bank: ${OFFICIAL_BANK_DETAILS.bankName}`, margin + 4, y + 12);
    doc.text(`Account Name: ${OFFICIAL_BANK_DETAILS.accountName}`, margin + 4, y + 17);
    doc.text(`Account Number: ${OFFICIAL_BANK_DETAILS.accountNumber}`, margin + 4, y + 22);
    doc.text(`Branch Code: ${OFFICIAL_BANK_DETAILS.branchCode}`, margin + 85, y + 12);
    doc.text(`Swift Code: ${OFFICIAL_BANK_DETAILS.swiftCode}`, margin + 85, y + 17);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text(`Payment Reference: ${order.order_number}`, margin + 85, y + 22);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      "Notice: Please use your Order Reference as deposit reference. Official tax invoice is unlocked once payment confirms.",
      margin + 4,
      y + 29
    );
  } else {
    doc.setFillColor(boxBg[0], boxBg[1], boxBg[2]);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(brandDark[0], brandDark[1], brandDark[2]);
    doc.text("PAYMENT CONFIRMED — OFFICIAL INVOICE AVAILABLE", margin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(
      "Your payment has been received and verified. The official invoice is available for download on your confirmation screen.",
      margin + 4,
      y + 12
    );
    doc.text(
      "For courier tracking, collection, or fitment assistance: Costa (+27 83 227 3237) | Dhevan (+27 83 467 1394).",
      margin + 4,
      y + 17
    );
  }

  // 6. FOOTER
  const footerY = pageHeight - 16;
  doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("R&C Commodities — Motorcycle Tyres, Workshop Logistics & Paddock Gear", margin, footerY);
  doc.text(titleText, pageWidth - margin, footerY, { align: "right" });

  return doc;
}
