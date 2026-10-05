export default function handler(_req: any, res: any) {
  const rawSandbox = (process.env.PAYFAST_SANDBOX || "").trim().toLowerCase();
  const isSandbox = rawSandbox !== "false" && rawSandbox !== "production" && rawSandbox !== "0";
  const merchantId = (process.env.PAYFAST_MERCHANT_ID || (isSandbox ? "10055113" : "")).trim();

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      success: true,
      sandbox: isSandbox,
      configured: Boolean(merchantId),
      merchantId,
    })
  );
}
