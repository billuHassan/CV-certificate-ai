import "./env-init";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import os from "os";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer from "nodemailer";
import mammoth from "mammoth";
import * as pdfParseModule from "pdf-parse";
import { aiService } from "./server/aiService";

async function parsePdfBuffer(buf: Buffer): Promise<string> {
  try {
    const mod: any = pdfParseModule;
    const PDFParseClass = mod?.PDFParse || mod?.default?.PDFParse;
    if (typeof PDFParseClass === "function") {
      try {
        const parser = new PDFParseClass({ data: buf });
        if (typeof parser.load === "function") {
          await parser.load();
        }
        if (typeof parser.getText === "function") {
          const textResult = await parser.getText();
          if (typeof parser.destroy === "function") {
            try { parser.destroy(); } catch (_) {}
          }
          const text = typeof textResult === "string" ? textResult : (textResult?.text || "");
          if (text && text.trim().length > 0) return text;
        }
      } catch (classErr) {
        console.warn("PDFParseClass instance error:", classErr);
      }
    }

    const fn: any = typeof mod === "function" ? mod : (typeof mod?.default === "function" ? mod.default : null);
    if (typeof fn === "function") {
      try {
        const res = await fn(buf);
        if (res?.text && res.text.trim().length > 0) return res.text;
      } catch (fnErr) {
        console.warn("pdfParse function error:", fnErr);
      }
    }
  } catch (err) {
    console.warn("parsePdfBuffer overall error:", err);
  }

  // Robust stream text extraction fallback for PDF buffers
  try {
    const str = buf.toString("latin1");
    const streamRegex = /BT[\s\S]*?ET/g;
    const matches = str.match(streamRegex);
    if (matches && matches.length > 0) {
      const extracted = matches
        .map(block => {
          const textMatches = block.match(/\((.*?)\)|\[(.*?)\]/g);
          if (textMatches) {
            return textMatches.map(t => t.replace(/^[(\[]|[)\]]$/g, "")).join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");
      if (extracted.trim().length > 10) {
        return extracted;
      }
    }

    // Direct string extraction for text tokens
    const textTokens = str.match(/[A-Za-z0-9@._+-]{2,}/g);
    if (textTokens && textTokens.length > 20) {
      return textTokens.join(" ");
    }
  } catch (_) {}

  return "";
}
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

let adminApp: App | undefined;

function getAdminApp(): App {
  if (!adminApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
    } else {
      try {
        adminApp = initializeApp({
          projectId: firebaseConfig.projectId
        });
        console.log("[FIREBASE ADMIN] Initialized successfully on backend.");
      } catch (adminErr) {
        console.error("[FIREBASE ADMIN] Initialization failed:", adminErr);
        adminApp = getApps()[0];
      }
    }
  }
  return adminApp;
}

function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

const isProduction =
  process.env.NODE_ENV === "production" ||
  (typeof __filename !== "undefined" && __filename.endsWith(".cjs")) ||
  (typeof __dirname !== "undefined" && __dirname.includes("dist")) ||
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.VERCEL_ENV) ||
  Boolean(process.env.RENDER) ||
  Boolean(process.env.RAILWAY_ENVIRONMENT) ||
  Boolean(process.env.K_SERVICE);

if (isProduction && process.env.NODE_ENV !== "production") {
  process.env.NODE_ENV = "production";
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "billuhassan.github.io") return true;
    if (host.endsWith(".vercel.app") || host.endsWith(".run.app")) return true;

    if (process.env.APP_URL) {
      try {
        if (new URL(process.env.APP_URL).origin === parsed.origin) return true;
      } catch {}
    }
    if (process.env.ALLOWED_ORIGINS) {
      const custom = process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
      if (custom.includes(parsed.origin)) return true;
    }
  } catch {
    return false;
  }
  return false;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ limit: "12mb", extended: true }));

// Strict Allowlist CORS & Preflight Handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-key");
  if (req.method === "OPTIONS") {
    return origin && !isAllowedOrigin(origin) ? res.sendStatus(403) : res.sendStatus(204);
  }
  next();
});

// Production Defensive Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), payment=(self)");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.removeHeader("X-Powered-By");
  next();
});

// Simple In-Memory Sliding-Window Rate Limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitBucket>();

const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (now > bucket.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof rateLimitCleanupTimer.unref === "function") {
  rateLimitCleanupTimer.unref();
}

function createRateLimiter(options: { windowMs: number; max: number; message: string; keyPrefix: string }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
    const key = `${options.keyPrefix}:${rawIp}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);
    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (record.count >= options.max) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        error: options.message,
        retryAfter: retryAfterSec
      });
    }

    record.count++;
    next();
  };
}

// Rate Limiting Instances
const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many requests. Please slow down and try again shortly.",
  keyPrefix: "gen_api"
});

const authSendCodeLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many verification codes requested from this IP. Please wait 10 minutes before trying again.",
  keyPrefix: "auth_send"
});

const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: "AI service request limit reached. Please wait a moment before sending more requests.",
  keyPrefix: "ai_req"
});

const authVerifyLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many verification or password reset attempts. Please wait 10 minutes before trying again.",
  keyPrefix: "auth_verify"
});

const paymentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: "Too many payment verification requests. Please wait a moment and try again.",
  keyPrefix: "pay_req"
});

const feedbackLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many feedback submissions from this IP. Please wait before submitting again.",
  keyPrefix: "fb_req"
});

// Proxy & Serverless URL Normalization (ensures both /api/... and proxy-stripped /ai/..., /auth/... routes work identically)
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && (
    req.url.startsWith("/ai/") ||
    req.url.startsWith("/auth/") ||
    req.url.startsWith("/admin/") ||
    req.url.startsWith("/payments/") ||
    req.url.startsWith("/feedback/")
  )) {
    req.url = "/api" + req.url;
  }
  next();
});

// Attach Rate Limiters to APIs
app.use("/api/", generalApiLimiter);
app.use("/api/auth/send-code", authSendCodeLimiter);
app.use(["/api/auth/verify-code", "/api/auth/reset-password"], authVerifyLimiter);
app.use("/api/payments/", paymentLimiter);
app.use("/api/feedback/", feedbackLimiter);
app.use("/api/ai/", aiRateLimiter);

// Global Server-Side Statistics for Admin Dashboard
const serverStats = {
  totalRequests: 0,
  endpointsCalls: {
    optimizeBullet: 0,
    rewriteExperience: 0,
    generateSummary: 0,
    suggestSkills: 0,
    generateCoverLetter: 0,
    analyzeResume: 0,
    autoApplyChanges: 0,
    interviewPrep: 0,
  } as Record<string, number>,
  lastActiveTime: "Never",
  recentEvents: [] as string[]
};

function addServerEvent(event: string) {
  const timestamp = new Date().toLocaleTimeString();
  serverStats.recentEvents.unshift(`[${timestamp}] ${event}`);
  if (serverStats.recentEvents.length > 30) {
    serverStats.recentEvents.pop();
  }
}

// Standard health check for Cloud Run, Docker, Vercel, and deployment verifications
app.get(["/api/health", "/health", "/api", "/api/"], (req, res) => {
  res.json({ status: "ok", service: "CV Craft AI API", environment: process.env.NODE_ENV || "development", timestamp: Date.now() });
});

// Stats recording middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/ai/")) {
    serverStats.totalRequests++;
    serverStats.lastActiveTime = new Date().toLocaleTimeString();
    
    const endpoint = req.path.replace("/api/ai/", "");
    if (endpoint === "optimize-bullet") {
      serverStats.endpointsCalls.optimizeBullet = (serverStats.endpointsCalls.optimizeBullet || 0) + 1;
      addServerEvent("Optimized bullet point with AI.");
    } else if (endpoint === "rewrite-experience") {
      serverStats.endpointsCalls.rewriteExperience = (serverStats.endpointsCalls.rewriteExperience || 0) + 1;
      addServerEvent("Rewrote professional experience entry.");
    } else if (endpoint === "generate-summary") {
      serverStats.endpointsCalls.generateSummary = (serverStats.endpointsCalls.generateSummary || 0) + 1;
      addServerEvent("Generated custom professional profile summary.");
    } else if (endpoint === "suggest-skills") {
      serverStats.endpointsCalls.suggestSkills = (serverStats.endpointsCalls.suggestSkills || 0) + 1;
      addServerEvent("Provided smart skill recommendations.");
    } else if (endpoint === "generate-cover-letter") {
      serverStats.endpointsCalls.generateCoverLetter = (serverStats.endpointsCalls.generateCoverLetter || 0) + 1;
      addServerEvent("Drafted AI cover letter document.");
    } else if (endpoint === "analyze-resume") {
      serverStats.endpointsCalls.analyzeResume = (serverStats.endpointsCalls.analyzeResume || 0) + 1;
      addServerEvent("Analyzed resume ATS compliance score.");
    } else if (endpoint === "auto-apply-changes") {
      serverStats.endpointsCalls.autoApplyChanges = (serverStats.endpointsCalls.autoApplyChanges || 0) + 1;
      addServerEvent("Applied automated resume revisions.");
    } else if (endpoint === "interview-prep") {
      serverStats.endpointsCalls.interviewPrep = (serverStats.endpointsCalls.interviewPrep || 0) + 1;
      addServerEvent("Prepared tailored mock interview questions.");
    } else {
      addServerEvent(`Handled generic AI API call: ${endpoint}`);
    }
  }
  next();
});

// Admin authorization verification helper
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "bilalhassanmussa@gmail.com").toLowerCase().trim();
const ADMIN_API_KEY = (process.env.ADMIN_API_KEY || "").trim();

async function verifyAdminAuth(req: express.Request): Promise<boolean> {
  const adminKey = typeof req.headers["x-admin-key"] === "string" ? req.headers["x-admin-key"].trim() : "";
  if (ADMIN_API_KEY && adminKey && timingSafeEqualStrings(adminKey, ADMIN_API_KEY)) {
    return true;
  }

  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (ADMIN_API_KEY && timingSafeEqualStrings(token, ADMIN_API_KEY)) {
      return true;
    }
    // Attempt Firebase Admin ID token verification
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      if (decoded.email && decoded.email_verified !== false && decoded.email.toLowerCase() === ADMIN_EMAIL) {
        return true;
      }
    } catch {
      // Token verification failed or unconfigured
    }
  }

  return false;
}

// Admin stats endpoint (Strictly protected via Firebase Auth token or Admin Key)
app.post("/api/admin/stats", async (req, res) => {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Unauthorized access level. Valid admin credentials required." });
  }

  // Get real server metrics
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMins = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeSecs = uptimeSeconds % 60;
  const uptimeString = `${uptimeHours}h ${uptimeMins}m ${uptimeSecs}s`;

  const memoryUsage = process.memoryUsage();
  const rssMB = Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100;
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100;
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;

  res.json({
    uptime: uptimeString,
    memory: {
      rss: `${rssMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      heapUsed: `${heapUsedMB} MB`,
      systemFree: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
      systemTotal: `${Math.round(os.totalmem() / 1024 / 1024)} MB`
    },
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    totalRequests: serverStats.totalRequests,
    endpointsCalls: serverStats.endpointsCalls,
    lastActiveTime: serverStats.lastActiveTime,
    recentEvents: serverStats.recentEvents
  });
});

// Diagnostic endpoint to check environment setup securely (sanitized status only)
app.get("/api/diagnostic", async (req, res) => {
  const isAuthorized = await verifyAdminAuth(req);
  const geminiExists = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.AI_STUDIO_API_KEY
  );
  if (!isAuthorized) {
    // Return minimal safe health status for public probes without internal metadata
    return res.json({
      status: "healthy",
      service: "CVCraft AI Core Engine"
    });
  }

  res.json({
    status: "healthy",
    geminiConfigured: geminiExists,
    primaryModel: "gemini-3.8-flash",
    fallbackModel: "gemini-3.1-flash-lite",
    aiConfigured: geminiExists,
    nodeEnv: process.env.NODE_ENV || "production"
  });
});

// Secure Server-Side PayPal and Bank Payment Processing
// These operations use server-side credentials. Secrets are never sent to the browser.
app.post("/api/payments/create-paypal-order", async (req, res) => {
  const { amount, currency } = req.body || {};
  const payPalClientId = process.env.PAYPAL_CLIENT_ID;
  const payPalSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || "sandbox";
  const allowMockPayments = !isProduction || process.env.ALLOW_MOCK_PAYMENTS === "true";

  // Validate amount & currency
  const numericAmount = Number(amount || "1.99");
  const safeAmount = Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= 10000
    ? numericAmount.toFixed(2)
    : "1.99";
  const safeCurrency = typeof currency === "string" && /^[A-Z]{3}$/.test(currency.trim())
    ? currency.trim()
    : "USD";

  // If credentials are not set, disallow unauthenticated mock approvals in production
  if (!payPalClientId || !payPalSecret) {
    if (!allowMockPayments) {
      return res.status(503).json({
        error: "PayPal live checkout is not configured on this server."
      });
    }
    const mockOrderId = "MOCK-PP-ORDER-" + crypto.randomBytes(5).toString("hex").toUpperCase();
    addServerEvent(`Initiated sandbox PayPal simulation for ${safeAmount} ${safeCurrency}.`);
    return res.json({
      orderId: mockOrderId,
      approveUrl: `/#mock-paypal-checkout?id=${encodeURIComponent(mockOrderId)}&amount=${encodeURIComponent(safeAmount)}`,
      mode: "development-mock",
      message: "Running in sandbox simulation. Configure PAYPAL_CLIENT_ID in environment secrets to go live."
    });
  }

  try {
    // Standard OAuth call to PayPal Token endpoint
    const authString = Buffer.from(`${payPalClientId}:${payPalSecret}`).toString("base64");
    const tokenUrl = mode === "live" 
      ? "https://api-m.paypal.com/v1/oauth2/token" 
      : "https://api-m.sandbox.paypal.com/v1/oauth2/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!tokenResponse.ok) {
      throw new Error(`PayPal authentication failed: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    // Call PayPal Orders v2 API securely from the backend server
    const orderUrl = mode === "live"
      ? "https://api-m.paypal.com/v2/checkout/orders"
      : "https://api-m.sandbox.paypal.com/v2/checkout/orders";

    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "http";
    const appBaseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const orderResponse = await fetch(orderUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: safeCurrency,
            value: safeAmount
          },
          description: "CVCraft AI Elite Premium Upgrade"
        }],
        application_context: {
          return_url: `${appBaseUrl}/?payment=success`,
          cancel_url: `${appBaseUrl}/?payment=cancel`
        }
      })
    });

    if (!orderResponse.ok) {
      const errText = await orderResponse.text();
      throw new Error(`PayPal order creation failed: ${orderResponse.statusText} - ${errText}`);
    }

    const orderData = await orderResponse.json() as { id: string; links?: Array<{ href: string; rel: string }> };
    const approveLink = orderData.links?.find(l => l.rel === "approve");
    const approveUrl = approveLink ? approveLink.href : `https://www.paypal.com/checkoutnow?token=${encodeURIComponent(orderData.id)}`;

    addServerEvent(`Securely initialized live PayPal order: ${orderData.id}`);
    res.json({ orderId: orderData.id, approveUrl, mode });
  } catch (err: any) {
    console.error("PayPal Order Error:", err);
    res.status(500).json({ error: "Failed to generate secure PayPal order on server." });
  }
});

app.post("/api/payments/capture-paypal-order", async (req, res) => {
  const rawOrderId = req.body?.orderId;
  const orderId = typeof rawOrderId === "string" ? rawOrderId.trim() : "";
  const payPalClientId = process.env.PAYPAL_CLIENT_ID;
  const payPalSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || "sandbox";
  const allowMockPayments = !isProduction || process.env.ALLOW_MOCK_PAYMENTS === "true";

  if (!orderId || !/^[A-Za-z0-9_-]{5,64}$/.test(orderId)) {
    return res.status(400).json({ error: "A valid Order ID is required to complete capture." });
  }

  // Handle prototype sandbox simulation (blocked in production unless explicitly enabled)
  if (orderId.startsWith("MOCK-PP-ORDER-")) {
    if (!allowMockPayments) {
      return res.status(403).json({ error: "Simulated payment orders are disabled in production." });
    }
    addServerEvent(`Verified and finalized simulated payment for Order ${orderId}.`);
    return res.json({
      status: "COMPLETED",
      orderId,
      payer: { email_address: "candidate-sandbox@example.com" },
      message: "Simulated PayPal Payment captured securely."
    });
  }

  if (!payPalClientId || !payPalSecret) {
    return res.status(503).json({ error: "PayPal live capture is not configured on this server." });
  }

  try {
    const authString = Buffer.from(`${payPalClientId}:${payPalSecret}`).toString("base64");
    const tokenUrl = mode === "live" 
      ? "https://api-m.paypal.com/v1/oauth2/token" 
      : "https://api-m.sandbox.paypal.com/v1/oauth2/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    if (!tokenResponse.ok) {
      throw new Error("PayPal Token authorization failed.");
    }

    const tokenData = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    const encodedOrderId = encodeURIComponent(orderId);
    const captureUrl = mode === "live"
      ? `https://api-m.paypal.com/v2/checkout/orders/${encodedOrderId}/capture`
      : `https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodedOrderId}/capture`;

    const captureResponse = await fetch(captureUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!captureResponse.ok) {
      throw new Error(`PayPal capture process failed: ${captureResponse.statusText}`);
    }

    const captureData = await captureResponse.json() as { status: string };
    addServerEvent(`PayPal payment captured successfully. Order state: ${captureData.status}`);
    res.json({
      status: captureData.status,
      orderId,
      message: "Funds successfully captured on backend."
    });
  } catch (err: any) {
    console.error("PayPal Capture Error:", err);
    res.status(500).json({ error: "Failed to securely capture payment on server." });
  }
});

app.post("/api/payments/bank-transfer", async (req, res) => {
  const allowMockPayments = !isProduction || process.env.ALLOW_MOCK_PAYMENTS === "true";
  if (!allowMockPayments) {
    return res.status(503).json({
      error: "Direct automated bank clearing is unavailable. Please use manual receipt upload verification."
    });
  }

  const { bankName, routingNumber, accountNumber, accountHolder } = req.body || {};
  if (typeof routingNumber !== "string" || typeof accountNumber !== "string" || typeof accountHolder !== "string" || !routingNumber.trim() || accountNumber.trim().length < 4 || !accountHolder.trim()) {
    return res.status(400).json({ error: "Valid account parameters are required." });
  }

  const maskedAccount = `*****${accountNumber.trim().slice(-4)}`;
  const safeBank = typeof bankName === "string" ? bankName.trim().slice(0, 80) : "Unspecified Bank";
  addServerEvent(`Sandbox bank transfer verification requested via ${safeBank} (${maskedAccount}).`);

  res.json({
    success: true,
    transactionId: "BANK-TX-" + crypto.randomBytes(5).toString("hex").toUpperCase(),
    maskedAccount,
    status: "APPROVED",
    message: "Sandbox bank transfer processed through tokenized validation layer."
  });
});

app.post("/api/payments/tng-charge", async (req, res) => {
  const allowMockPayments = !isProduction || process.env.ALLOW_MOCK_PAYMENTS === "true";
  if (!allowMockPayments) {
    return res.status(503).json({
      error: "Direct Touch 'n Go API charging is disabled in this environment. Please submit your transfer receipt for verification."
    });
  }

  const mockTxId = "TNG-TX-" + crypto.randomBytes(5).toString("hex").toUpperCase();
  addServerEvent(`Sandbox Touch 'n Go transaction initiated (${mockTxId}).`);
  
  res.json({
    success: true,
    transactionId: mockTxId,
    qrPayload: `duitnow://payment/transfer?merchant=CVCRAFTAI&amount=8.90&ref=${encodeURIComponent(mockTxId)}`,
    amountMYR: "8.90",
    message: "Touch 'n Go DuitNow payload compiled."
  });
});

// Helper to parse base64 parts
function parseBase64(base64Str: string): { mimeType: string, data: string } {
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  }
  return {
    mimeType: "image/png", // default
    data: base64Str
  };
}

// AI payment receipt verification endpoint
app.post("/api/payments/verify-receipt", async (req, res) => {
  try {
    const { receiptBase64, receiptName, paymentType, txRef } = req.body || {};
    
    if (typeof receiptBase64 !== "string" || !receiptBase64.trim()) {
      return res.status(400).json({ error: "No receipt file uploaded for verification." });
    }
    
    if (typeof txRef !== "string" || txRef.trim().length < 4 || txRef.trim().length > 100) {
      return res.status(400).json({ error: "A valid Transaction Reference ID is required." });
    }

    const cleanTxRef = txRef.trim();
    const safeReceiptName = typeof receiptName === "string" ? receiptName.slice(0, 120) : "unnamed";
    addServerEvent(`AI verification requested for ${paymentType === "tng" ? "tng" : "direct"} receipt.`);

    const parsed = parseBase64(receiptBase64);
    
    const result = await callGeminiWithFallback(
      async (modelName) => {
        if (!ai) {
          throw new Error("AI engine is not initialized.");
        }
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                data: parsed.data,
                mimeType: parsed.mimeType
              }
            },
            {
              text: `You are an automated financial auditor and transaction receipt verification specialist for CVCraft AI.
              The customer has uploaded this document/image as proof of a direct manual transfer for their Elite Membership.
              The expected payment is RM 8.50 (for Touch 'n Go eWallet) or $1.99 USD (for Direct Bank Transfer).
              The customer entered this transaction reference ID in our system: "${cleanTxRef}".
              
              Verify the following from the document/image carefully:
              1. Is this a legitimate banking receipt, transaction slip, or payment transfer confirmation screenshot? Reject if it's an unrelated image (such as a selfie, scenery, random documents, internet memes, etc.).
              2. Does the receipt show a "SUCCESSFUL", "COMPLETED", "APPROVED", "SUCCESS" or "SECURELY SENT" status?
              3. Check the transferred amount. Is it close to or matches RM 8.50 or $1.99 USD (allowing for slight conversion differences or exchange rates, e.g. RM 8.00 - RM 9.00 or $1.90 - $2.10)?
              4. Check if the reference ID, transaction ID, or Reference Number printed on the receipt matches or resembles the user-entered ID: "${cleanTxRef}".
              
              Be rigorous. If it's a random image, fake file, or wrong amount, reject it.
              
              Return a JSON object with this schema:
              {
                "isValid": boolean,
                "confidenceScore": number,
                "detectedAmount": string,
                "detectedReferenceId": string,
                "status": "APPROVED" | "REJECTED",
                "analysisMessage": string
              }`
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                confidenceScore: { type: Type.INTEGER },
                detectedAmount: { type: Type.STRING },
                detectedReferenceId: { type: Type.STRING },
                status: { type: Type.STRING },
                analysisMessage: { type: Type.STRING }
              },
              required: ["isValid", "confidenceScore", "detectedAmount", "detectedReferenceId", "status", "analysisMessage"]
            }
          }
        });
        
        const parsedResponse = JSON.parse(response.text || "{}");
        addServerEvent(`AI verification outcome: ${parsedResponse.status} (Score: ${parsedResponse.confidenceScore}%)`);
        return parsedResponse;
      },
      () => {
        const allowMockPayments = !isProduction && process.env.ALLOW_MOCK_PAYMENTS === "true";
        const lowerName = safeReceiptName.toLowerCase();
        const lowerRef = cleanTxRef.toLowerCase();

        if (!allowMockPayments || lowerName.includes("scam") || lowerName.includes("fake") || lowerRef.includes("scam") || lowerRef.includes("fake")) {
          return {
            isValid: false,
            confidenceScore: 0,
            detectedAmount: "Unverified",
            detectedReferenceId: cleanTxRef,
            status: "REJECTED",
            analysisMessage: "Automated AI receipt verification is currently unavailable. We cannot auto-approve manual transfers without AI or administrator verification."
          };
        }

        return {
          isValid: true,
          confidenceScore: 92,
          detectedAmount: paymentType === "tng" ? "RM 8.50" : "$1.99",
          detectedReferenceId: cleanTxRef,
          status: "APPROVED",
          analysisMessage: "Development Sandbox Auditing: Manual payment cleared in local mock mode."
        };
      }
    );
    
    res.json(result);
  } catch (error: any) {
    console.error("Verify Receipt Error:", error);
    res.status(500).json({ error: "Failed to analyze receipt" });
  }
});

// In-memory store for secure email verification codes & password reset sessions
interface VerificationRecord {
  code: string;
  expires: number;
  failedAttempts: number;
}
const verificationCodes = new Map<string, VerificationRecord>();
const passwordResetTokens = new Map<string, { token: string; expires: number }>();

// Helper function to dispatch verification emails via SMTP if configured
async function dispatchVerificationEmail(email: string, code: string, actionType: "registration" | "recovery") {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const defaultFromEmail = process.env.ADMIN_EMAIL || "support@rahmora.ai";
  const from = process.env.SMTP_FROM || `RahmoraAI Security <${user || defaultFromEmail}>`;

  if (!host || !user || !pass) {
    console.warn(`[SMTP DISPATCH NOTICE] SMTP credentials not configured; email delivery skipped.`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const subject = actionType === "registration" 
      ? "[RahmoraAI] Verify your email address" 
      : "[RahmoraAI] Reset your account password";

    const actionText = actionType === "registration" ? "registering your new account" : "resetting your account password";
    const safeCode = escapeHtml(code);

    const mailOptions = {
      from,
      to: email,
      subject,
      text: `Hello,\n\nYou are receiving this email because you requested a verification code for ${actionText} on RahmoraAI.\n\nYour 6-digit secure code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nRahmoraAI Security Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #334155; border-radius: 16px; background-color: #0f172a; text-align: center; color: #f8fafc;">
          <h2 style="color: #818cf8; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RahmoraAI</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
            You requested a 6-digit security code for <strong>${actionText}</strong>. Please enter the following code in the application:
          </p>
          <div style="background-color: #1e293b; border: 1px solid #475569; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: inline-block;">
            <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">${safeCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            This code is valid for <strong>10 minutes</strong>. If you did not make this request, your account remains completely safe.
          </p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">&copy; ${new Date().getFullYear()} RahmoraAI Intelligence Systems. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Dispatched verification email. MessageID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.error("[SMTP ERROR] Failed to dispatch verification email over Nodemailer:", err?.message || err);
    return false;
  }
}

// Endpoint to generate and "send" a secure 6-digit verification code
app.post("/api/auth/send-code", async (req, res) => {
  try {
    const { email, action } = req.body || {};
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email is required for verification." });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "The email address format is invalid." });
    }

    // 1. Verify existence of the email in Firebase Auth to prevent fake registrations/recoveries
    const normalizedEmail = email.trim().toLowerCase();
    
    if (action === "reset") {
      try {
        await getAdminAuth().getUserByEmail(normalizedEmail);
      } catch (authErr: any) {
        if (authErr?.code === "auth/user-not-found") {
          return res.status(404).json({
            error: "This email address is not registered in our system. Please double-check your spelling or register a new account."
          });
        }
        // Silently bypass admin SDK lookup if identity toolkit API is unconfigured in container
      }
    } else if (action === "register") {
      try {
        const existingUser = await getAdminAuth().getUserByEmail(normalizedEmail);
        if (existingUser) {
          return res.status(400).json({
            error: "This email address is already registered in our system. Please try signing in or recover your password."
          });
        }
      } catch (authErr: any) {
        // Silently bypass admin SDK lookup if identity toolkit API is unconfigured in container
      }
    }

    // Generate a cryptographically secure 6-digit verification code
    const code = crypto.randomInt(100000, 1000000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    verificationCodes.set(normalizedEmail, { code, expires, failedAttempts: 0 });
    addServerEvent(`Generated secure verification code challenge.`);

    // Attempt SMTP dispatch
    const smtpDispatched = await dispatchVerificationEmail(
      normalizedEmail, 
      code, 
      action === "reset" ? "recovery" : "registration"
    );

    const allowDemo = !isProduction && (process.env.ALLOW_DEMO_CODE === "true" || !process.env.SMTP_HOST);

    res.json({
      success: true,
      smtpConfigured: smtpDispatched,
      demoCode: (!smtpDispatched && allowDemo) ? code : undefined,
      message: smtpDispatched 
        ? "A 6-digit verification code has been dispatched directly to your inbox."
        : (allowDemo
            ? "Verification code generated! Set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables to send live emails."
            : "Verification code sent if this email is valid. Please check your inbox.")
    });
  } catch (error: any) {
    console.error("Send Code Error:", error);
    res.status(500).json({ error: "Failed to generate or send verification code." });
  }
});

// Endpoint to verify the secure 6-digit code on the server
app.post("/api/auth/verify-code", (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (typeof email !== "string" || typeof code !== "string" || !email.trim() || !code.trim()) {
      return res.status(400).json({ error: "Email and verification code are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = verificationCodes.get(normalizedEmail);
    if (!record) {
      return res.json({
        success: false,
        reason: "No active verification code requested. Please request a new code."
      });
    }

    if (Date.now() > record.expires) {
      verificationCodes.delete(normalizedEmail);
      return res.json({
        success: false,
        reason: "The verification code has expired. Please request a new code."
      });
    }

    if (!timingSafeEqualStrings(record.code, code.trim())) {
      record.failedAttempts = (record.failedAttempts || 0) + 1;
      if (record.failedAttempts >= 5) {
        verificationCodes.delete(normalizedEmail);
        return res.status(429).json({
          success: false,
          reason: "Too many incorrect verification attempts. For your security, this code has been invalidated. Please request a new code."
        });
      }
      return res.json({
        success: false,
        reason: `Invalid verification code. ${5 - record.failedAttempts} attempt(s) remaining.`
      });
    }

    // Code is valid! Delete it from store to prevent reuse
    verificationCodes.delete(normalizedEmail);
    addServerEvent(`Successfully verified email challenge.`);

    // Generate single-use reset token valid for 15 minutes
    const resetToken = crypto.randomBytes(32).toString("hex");
    passwordResetTokens.set(normalizedEmail, {
      token: resetToken,
      expires: Date.now() + 15 * 60 * 1000
    });

    res.json({ success: true, resetToken });
  } catch (error: any) {
    console.error("Verify Code Error:", error);
    res.status(500).json({ error: "Failed to verify code" });
  }
});

// Endpoint to securely reset a user's password on the backend using Admin SDK
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, password, resetToken } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({ error: "Email and new password are required." });
    }

    const isStrongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!isStrongPassword) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and include an uppercase letter, number, and symbol."
      });
    }

    if (!resetToken || typeof resetToken !== "string") {
      return res.status(401).json({ error: "Missing or invalid password reset token. Please verify your email code first." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const session = passwordResetTokens.get(normalizedEmail);
    if (!session || !timingSafeEqualStrings(session.token, resetToken) || Date.now() > session.expires) {
      passwordResetTokens.delete(normalizedEmail);
      return res.status(401).json({ error: "The password reset session has expired or is invalid. Please request a new verification code." });
    }

    // Consume single-use reset token immediately
    passwordResetTokens.delete(normalizedEmail);
    
    try {
      // Find user record and update password if Admin SDK is enabled
      const userRecord = await getAdminAuth().getUserByEmail(normalizedEmail);
      if (userRecord?.uid) {
        await getAdminAuth().updateUser(userRecord.uid, { password });
      }
    } catch (authErr: any) {
      if (authErr?.code === "auth/user-not-found") {
        return res.status(404).json({ error: "The specified email address is not registered." });
      }
      if (authErr?.code === "auth/weak-password") {
        return res.status(400).json({ error: "The chosen password format is too weak." });
      }
      if (isProduction) {
        console.error("[AUTH] Admin SDK password update error:", authErr?.message || authErr);
        return res.status(503).json({
          error: "Password reset service requires Firebase Admin service credentials in production."
        });
      }
      console.log("[AUTH] Admin SDK password update bypassed in local dev mode.");
    }

    addServerEvent(`Successfully processed password reset request.`);
    res.json({
      success: true,
      message: "Your password has been updated successfully. Please sign in with your updated credentials."
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update your password." });
  }
});

// Email authentication validation check endpoint
app.post("/api/auth/validate-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required for validation." });
    }

    // 1. Client regex-style check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.json({
        isValid: false,
        reason: "The email address has an invalid syntax structure."
      });
    }

    // 2. Reject disposable domains
    const domain = email.split("@")[1].toLowerCase();
    const disposableDomains = [
      "tempmail.com", "10minutemail.com", "yopmail.com", "mailinator.com",
      "dispostable.com", "fake.com", "scam.com", "test.com", "example.com",
      "dummy.com", "temp.com", "trashmail.com"
    ];
    if (disposableDomains.includes(domain)) {
      return res.json({
        isValid: false,
        reason: `The domain '${domain}' is flagged as a temporary or disposable email provider. Please use a valid personal or corporate email address.`
      });
    }

    // 3. AI email plausibility verification (against gibberish / keyboardsmash, e.g. asdfsdfwerwer@sdfgwer.com)
    const result = await aiService.verifyEmail(email);

    res.json(result);
  } catch (error: any) {
    console.error("Validate Email Error:", error);
    res.status(500).json({ error: error?.message || "Failed to validate email" });
  }
});

// Initialize Google GenAI securely
// To prevent the Google GenAI SDK from automatically using Google Cloud Application Default Credentials (ADC)
// or Service Account metadata which causes ACCESS_TOKEN_TYPE_UNSUPPORTED errors in Cloud Run,
// we override and clear the GCP metadata environment variables.
// Environment overrides are handled in env-init.ts to ensure they execute before any imports.

const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_STUDIO_API_KEY;
let ai: GoogleGenAI | null = null;
let lastGeminiErrorDetails: any = null;
let geminiIsBlocked = false;
let geminiBlockedUntil = 0;

function getGenAIClient(): GoogleGenAI | null {
  if (ai) return ai;
  const key = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.AI_STUDIO_API_KEY ||
    ""
  ).trim();
  if (key && key !== "undefined" && key.length > 5) {
    try {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("[GEMINI SDK] Initialized GoogleGenAI server client.");
    } catch (e) {
      console.error("[GEMINI SDK] Initialization error:", e);
    }
  }
  return ai;
}

getGenAIClient();

const PRIMARY_GEMINI_MODEL = "gemini-3.8-flash";

/**
 * Executes a Gemini request using recommended active models with fast fallback.
 * Uses a strict timeout per request and instant fallback on quota exhaustion (429).
 */
async function callGeminiWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  fallbackGenerator: () => T,
  preferredModels?: string[]
): Promise<T> {
  const client = getGenAIClient();
  if (geminiIsBlocked || !client || Date.now() < geminiBlockedUntil) {
    return fallbackGenerator();
  }

  const defaultModels = [PRIMARY_GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const sanitizedPreferred = (preferredModels || []).map(m => 
    (m === "gemini-3.6-flash" || m === "gemini-3.1-pro-preview" || m === "gemini-2.0-flash" || m === "gemini-1.5-flash") 
      ? PRIMARY_GEMINI_MODEL 
      : m
  );
  const modelsToTry = sanitizedPreferred.length > 0
    ? Array.from(new Set([...sanitizedPreferred, ...defaultModels]))
    : defaultModels;

  for (const modelName of modelsToTry) {
    try {
      // Impose a resilient 25s timeout on API calls to prevent UI hang while allowing rich output
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 25000)
      );

      const result = await Promise.race([fn(modelName), timeoutPromise]);
      return result;
    } catch (err: any) {
      const errMsg = err?.message || String(err || "");
      const status = err?.status || err?.statusCode || 0;

      lastGeminiErrorDetails = {
        message: errMsg,
        status: status,
        name: err?.name,
        model: modelName
      };

      // Check authentication or service block
      if (
        status === 401 ||
        status === 403 ||
        errMsg.includes("API_KEY_SERVICE_BLOCKED") ||
        errMsg.includes("SERVICE_DISABLED")
      ) {
        geminiBlockedUntil = Date.now() + 15000;
        return fallbackGenerator();
      }

      // Check quota exhaustion (429) -> apply brief 5s cooldown and try next model
      if (status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
        continue;
      }

      // 503 / High demand spike: immediately try next model without falling back prematurely
      if (status === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
        continue;
      }

      if (errMsg.includes("GEMINI_TIMEOUT")) {
        continue;
      }

      // If model not found (404), try next model in list
      if (status === 404 || errMsg.includes("not found")) {
        continue;
      }

      continue;
    }
  }

  return fallbackGenerator();
}

// ----------------------------------------------------
// Role & Domain Analyzer Helper for Server Endpoints
// ----------------------------------------------------
function getRoleDomainInfo(jobTitleInput?: string) {
  const title = (jobTitleInput || "").trim().toLowerCase();

  // Culinary & Food Service
  if (/cook|chef|kitchen|culinary|food|baker|pastry|sous|grill|line cook|caterer|barista|butcher|restaurant|dining|hospitality|catering|server|waiter|waitress|bartender/.test(title)) {
    const roleTitle = jobTitleInput || "Cook / Chef";
    return {
      domainName: "Culinary & Food Service",
      industry: "Hospitality & Culinary Arts",
      coreSkills: [
        "Food Safety & Sanitation (HACCP)",
        "Knife Skills & Precision Cutting",
        "Recipe Preparation & Standardization",
        "Station Management & Prep Work",
        "Kitchen Line Operations",
        "Menu Planning & Costing",
        "Inventory & Stock Management",
        "Food Quality & Plating Control",
        "Kitchen Team Coordination",
        "Time & Order Prioritization"
      ],
      sampleSummary: `Dedicated and quality-driven ${roleTitle} with a proven track record of preparing exceptional culinary dishes in high-volume food service environments. Expert in food safety protocols (HACCP), knife techniques, and station prep work.`,
      sampleBullet: `• Prepared and executed culinary menu items adhering strictly to recipes, portion standards, and food safety (HACCP) guidelines.\n• Managed station prep work efficiently, reducing kitchen waste by 15% during peak dinner services.\n• Collaborated with kitchen line team members to ensure prompt dish delivery and high culinary presentation standards.`,
      recommendedRoles: [
        {
          title: `Head Chef / Kitchen Lead (${roleTitle})`,
          fitScore: 95,
          rationale: `Capitalizes directly on your hands-on culinary skills, food safety mastery, and station prep efficiency.`,
          expectedSalaryRange: "$55,000 - $75,000",
          skillsToAcquire: ["Food Cost Control", "Menu Engineering & Design", "Kitchen Team Leadership", "Inventory Optimization"],
          topCompanies: ["Marriott International", "Hilton Hotels & Resorts", "Darden Restaurants", "Compass Group", "Wolfgang Puck Catering"],
          skillsToUpgrade: [
            { skillName: "ServSafe Manager Certification", whyItStandsOut: "Demonstrates complete regulatory compliance and kitchen leadership capability." },
            { skillName: "Menu Costing & Yield Management", whyItStandsOut: "Proves ability to maximize kitchen profitability without sacrificing food quality." }
          ]
        },
        {
          title: "Sous Chef / Culinary Operations Supervisor",
          fitScore: 90,
          rationale: `Positions you to oversee daily station execution, quality control, and inventory flow across busy service hours.`,
          expectedSalaryRange: "$48,000 - $65,000",
          skillsToAcquire: ["Staff Scheduling", "Station Efficiency Optimization", "Supplier Relations", "Recipe Development"],
          topCompanies: ["Hyatt Hotels", "Aramark", "Sodexo", "Landmark Hospitality", "Local Fine Dining Establishments"],
          skillsToUpgrade: [
            { skillName: "Culinary Station Efficiency", whyItStandsOut: "Ensures high dish output and consistency during peak dinner service hours." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Global Hospitality Groups (Marriott, Hilton, Hyatt)",
          fitRationale: "High-volume hotel kitchens offer structured culinary progression, comprehensive benefits, and international transfer routes.",
          positionsToWatch: ["Lead Line Cook", "Sous Chef", "Kitchen Supervisor", "Culinary Specialist"],
          interviewTips: "Be prepared for a practical cooking assessment or kitchen demonstration. Highlight food safety standards, knife precision, and speed under service pressure."
        }
      ]
    };
  }

  // Healthcare & Nursing
  if (/nurse|nursing|medical|doctor|clinical|physician|paramedic|emt|caregiver|health|therapist|pharmacist|dentist|patient|hospital|clinic/.test(title)) {
    const roleTitle = jobTitleInput || "Healthcare Professional / Nurse";
    return {
      domainName: "Healthcare & Medicine",
      industry: "Healthcare & Clinical Services",
      coreSkills: [
        "Patient Assessment & Triage",
        "Vital Signs Monitoring",
        "Medication Administration",
        "Electronic Health Records (EHR / Epic)",
        "Compassionate Patient Care",
        "Infection Control & Safety Protocols",
        "Clinical Documentation",
        "Emergency First Aid & CPR/BLS",
        "Patient & Family Education",
        "Interdisciplinary Team Care"
      ],
      sampleSummary: `Compassionate and highly skilled ${roleTitle} with extensive background in patient assessment, care plan execution, and vital signs monitoring. Thrives in clinical environments while strictly adhering to safety and medical regulations.`,
      sampleBullet: `• Provided direct, patient-centered clinical care, monitoring vital signs and executing care plans in accordance with physician orders.\n• Maintained accurate electronic health record (EHR) documentation and ensured 100% compliance with patient privacy (HIPAA) standards.\n• Collaborated with multidisciplinary healthcare teams to streamline patient triage and improve recovery outcomes.`,
      recommendedRoles: [
        {
          title: `Nurse Unit Supervisor / Clinical Coordinator (${roleTitle})`,
          fitScore: 94,
          rationale: `Leverages your hands-on clinical care and patient assessment experience to guide nursing staff and patient flow.`,
          expectedSalaryRange: "$75,000 - $105,000",
          skillsToAcquire: ["Clinical Staff Scheduling", "Patient Flow Optimization", "Advanced Cardiac Life Support (ACLS)", "Quality Improvement"],
          topCompanies: ["Mayo Clinic", "Cleveland Clinic", "Kaiser Permanente", "Johns Hopkins Medicine", "HCA Healthcare"],
          skillsToUpgrade: [
            { skillName: "Advanced Life Support (ACLS)", whyItStandsOut: "Critical for handling complex clinical emergencies and unit leadership." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Premier Medical Centers (Mayo, Cleveland Clinic, Kaiser)",
          fitRationale: "World-class health systems value evidence-based clinical practices, empathetic patient care, and strict safety compliance.",
          positionsToWatch: ["Registered Nurse (RN)", "Clinical Care Coordinator", "Specialty Staff Nurse"],
          interviewTips: "Focus on patient safety scenarios, emergency response examples, and collaborative care experiences."
        }
      ]
    };
  }

  // Transportation & Driving
  if (/driver|truck|delivery|chauffeur|courier|transport|logistics|warehouse|fleet|pilot|freight|dispatch/.test(title)) {
    const roleTitle = jobTitleInput || "Driver / Logistics Specialist";
    return {
      domainName: "Transportation & Logistics",
      industry: "Supply Chain & Freight Logistics",
      coreSkills: [
        "Safe Vehicle Operation (CDL)",
        "Route Optimization & GPS Navigation",
        "Defensive Driving Techniques",
        "Vehicle Inspection & Pre-trip Safety",
        "Cargo Handling & Load Distribution",
        "Delivery Schedule & Time Management",
        "Customer Service & Manifest Verification",
        "DOT Safety Compliance & Regulations",
        "Fleet Communication & Dispatching",
        "Maintenance Logging & Reporting"
      ],
      sampleSummary: `Reliable and safety-focused ${roleTitle} with a proven record of punctual deliveries, cargo securing, and adherence to transportation safety regulations. Skilled in vehicle inspection and route optimization.`,
      sampleBullet: `• Operated commercial vehicles safely over local and regional routes, achieving a 99.8% on-time delivery rate.\n• Conducted pre-trip and post-trip vehicle safety inspections in full compliance with DOT regulations.\n• Verified cargo manifests, handled customer sign-offs, and maintained clean driving safety records.`,
      recommendedRoles: [
        {
          title: `Fleet Operations Supervisor (${roleTitle})`,
          fitScore: 93,
          rationale: `Capitalizes on your driving safety, route planning, and vehicle inspection expertise to manage vehicle fleets.`,
          expectedSalaryRange: "$60,000 - $85,000",
          skillsToAcquire: ["Fleet Telematics Software", "Driver Safety Training", "DOT Regulatory Auditing"],
          topCompanies: ["FedEx", "UPS", "DHL Express", "Amazon Logistics", "JB Hunt"],
          skillsToUpgrade: [
            { skillName: "Fleet Telematics & Route Optimization", whyItStandsOut: "Reduces fuel costs and boosts delivery timeliness across fleet operations." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Global Express Carriers (FedEx, UPS, DHL, Amazon)",
          fitRationale: "Leading carriers offer clear career ladders from vehicle operations to station and fleet management.",
          positionsToWatch: ["Commercial Driver", "Fleet Supervisor", "Dispatch Specialist"],
          interviewTips: "Highlight clean driving records, accident prevention records, route efficiency metrics, and customer delivery satisfaction."
        }
      ]
    };
  }

  // Education & Teaching
  if (/teacher|educator|instructor|tutor|professor|academic|lecturer|school|curriculum|teaching/.test(title)) {
    const roleTitle = jobTitleInput || "Educator / Teacher";
    return {
      domainName: "Education & Academics",
      industry: "Education & Academic Services",
      coreSkills: [
        "Lesson Planning & Curriculum Design",
        "Classroom Management & Engagement",
        "Student Progress Assessment",
        "Differentiated Learning Strategies",
        "Educational Technology Integration",
        "Parent & Student Communication",
        "Standardized Test Preparation",
        "Subject Matter Mastery",
        "Student Mentorship & Guidance",
        "Academic Program Evaluation"
      ],
      sampleSummary: `Dedicated and engaging ${roleTitle} with a passion for fostering student growth, academic excellence, and inclusive learning environments. Expert in curriculum design, classroom management, and student progress assessment.`,
      sampleBullet: `• Developed and delivered engaging lesson plans tailored to diverse learning styles, improving student assessment scores by 18%.\n• Utilized educational technology tools and interactive learning modules to enhance student classroom participation.\n• Communicated regularly with parents and academic staff to support individual student growth and progress.`,
      recommendedRoles: [
        {
          title: `Lead Educator / Department Chair (${roleTitle})`,
          fitScore: 95,
          rationale: `Builds on your direct classroom instructional success and curriculum mastery to guide teaching teams.`,
          expectedSalaryRange: "$65,000 - $90,000",
          skillsToAcquire: ["Curriculum Mapping", "Teacher Mentorship", "Academic Performance Analytics"],
          topCompanies: ["Public School Districts", "Private Educational Academies", "Higher Education Institutions"],
          skillsToUpgrade: [
            { skillName: "Curriculum Alignment & Standards", whyItStandsOut: "Demonstrates ability to elevate school-wide test scores and learning outcomes." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Educational Networks & EdTech Organizations",
          fitRationale: "Modern educational employers seek innovative educators adept with digital platforms and student engagement.",
          positionsToWatch: ["Lead Teacher", "Curriculum Specialist", "Academic Coordinator"],
          interviewTips: "Share specific student growth metrics, innovative lesson plans, and classroom engagement strategies."
        }
      ]
    };
  }

  // Creative & Design
  if (/designer|graphic|ui|ux|artist|illustrator|photographer|video|animator|writer|copywriter|creative|art/.test(title)) {
    const roleTitle = jobTitleInput || "Graphic Designer / Creative";
    return {
      domainName: "Design & Creative Media",
      industry: "Design & Brand Media",
      coreSkills: [
        "Visual Design & Layout Composition",
        "Typography & Color Theory",
        "Adobe Creative Suite (Photoshop, Illustrator, InDesign)",
        "UI/UX Prototyping (Figma / Sketch)",
        "Brand Identity & Style Guidelines",
        "Client Design Brief Interpretation",
        "Creative Concepting & Storyboarding",
        "Digital & Print Media Production",
        "Portfolio Curation & Presentation",
        "Cross-Functional Design Strategy"
      ],
      sampleSummary: `Creative and detail-oriented ${roleTitle} with strong expertise in visual composition, brand identity design, and digital media production. Proficient in Adobe Creative Suite and modern design tools.`,
      sampleBullet: `• Conceptualized and designed high-impact visual marketing collateral, increasing brand engagement by 25%.\n• Developed cohesive visual style guides and design assets across digital and print channels.\n• Collaborated closely with cross-functional teams and clients to translate project briefs into creative visual solutions.`,
      recommendedRoles: [
        {
          title: `Art Director / Senior Visual Designer (${roleTitle})`,
          fitScore: 94,
          rationale: `Capitalizes on your visual execution and design composition background to direct creative team campaigns.`,
          expectedSalaryRange: "$80,000 - $115,000",
          skillsToAcquire: ["Creative Direction", "Brand Architecture", "Campaign Visual Leadership"],
          topCompanies: ["Pentagram", "Adobe", "Canva", "Ogilvy", "Publicis Groupe"],
          skillsToUpgrade: [
            { skillName: "Comprehensive Brand System Architecture", whyItStandsOut: "Positions you to lead major global rebrands and multi-channel creative visual direction." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Creative Agencies & Digital Product Studios",
          fitRationale: "Visual agencies value distinctive artistic craft, typography precision, and compelling portfolio work.",
          positionsToWatch: ["Senior Visual Designer", "Art Director", "Brand Strategist"],
          interviewTips: "Present a clean portfolio showcasing complete design thinking from concept sketching to final polished client deliverables."
        }
      ]
    };
  }

  // Sales & Retail
  if (/sales|cashier|retail|customer|account executive|store|clerk|receptionist|teller|merchandiser|associate/.test(title)) {
    const roleTitle = jobTitleInput || "Sales & Retail Associate";
    return {
      domainName: "Retail, Sales & Customer Care",
      industry: "Retail & Commercial Services",
      coreSkills: [
        "Customer Engagement & Service",
        "Point of Sale (POS) Systems Operation",
        "Product Knowledge & Presentation",
        "Sales Negotiation & Closing Techniques",
        "Problem De-escalation & Resolution",
        "Inventory Restocking & Merchandising",
        "Customer Relationship Management (CRM)",
        "Upselling & Order Maximization",
        "Cash Handling & Drawer Balancing",
        "Active Listening & Communication"
      ],
      sampleSummary: `Customer-focused and results-driven ${roleTitle} with extensive experience in client engagement, POS operations, and product merchandising. Adept at active listening, issue de-escalation, and driving sales growth.`,
      sampleBullet: `• Engaged retail customers proactively, providing product demonstrations that increased sales conversion by 20%.\n• Managed POS register transactions with 100% cash accuracy and drawer balancing.\n• Maintained clean visual merchandising standards and efficient floor inventory restocking.`,
      recommendedRoles: [
        {
          title: `Store Manager / Sales Supervisor (${roleTitle})`,
          fitScore: 95,
          rationale: `Leverages your customer engagement, POS handling, and store floor experience into team management and sales target setting.`,
          expectedSalaryRange: "$50,000 - $72,000",
          skillsToAcquire: ["Store Staff Scheduling", "Sales Target Analytics", "Loss Prevention"],
          topCompanies: ["Apple Retail", "Target", "Nordstrom", "Lululemon", "Nike"],
          skillsToUpgrade: [
            { skillName: "Retail Floor Performance Tracking", whyItStandsOut: "Proves capability to drive store revenue targets and manage team metrics." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Retail Brands & Commercial Services",
          fitRationale: "Top consumer brands focus on customer satisfaction, visual merchandising, and floor team leadership.",
          positionsToWatch: ["Store Supervisor", "Sales Lead", "Customer Success Specialist"],
          interviewTips: "Highlight customer satisfaction ratings, sales conversion achievements, and team collaboration examples."
        }
      ]
    };
  }

  // Skilled Trades
  if (/electrician|plumber|mechanic|carpenter|welder|technician|maintenance|janitor|cleaner|hvac|mason|contractor|trade/.test(title)) {
    const roleTitle = jobTitleInput || "Skilled Trades Technician";
    return {
      domainName: "Skilled Trades & Construction",
      industry: "Skilled Trades & Facilities Operations",
      coreSkills: [
        "Equipment Inspection & Diagnostics",
        "Blueprint & Schematic Reading",
        "Technical Repair & Maintenance",
        "OSHA Safety Protocols & Compliance",
        "Hand & Power Tool Safety",
        "System Troubleshooting",
        "Jobsite Cleanup & Hazard Mitigation",
        "Preventative Maintenance Scheduling",
        "Material Estimating & Inventory",
        "Quality Workmanship & Standards"
      ],
      sampleSummary: `Reliable and safety-certified ${roleTitle} with a proven track record of diagnosing, repairing, and maintaining technical equipment and systems. Skilled in blueprint reading, system troubleshooting, and strict OSHA compliance.`,
      sampleBullet: `• Inspected and diagnosed complex technical equipment, completing repairs ahead of estimated job schedules.\n• Adhered strictly to OSHA jobsite safety standards, maintaining a zero-accident safety record.\n• Interpreted technical blueprints and schematics to execute precise maintenance and installation procedures.`,
      recommendedRoles: [
        {
          title: `Lead Master Technician / Jobsite Foreman (${roleTitle})`,
          fitScore: 94,
          rationale: `Capitalizes on your hands-on trade proficiency, equipment diagnostics, and jobsite safety execution.`,
          expectedSalaryRange: "$65,000 - $95,000",
          skillsToAcquire: ["Jobsite Leadership", "Cost & Material Estimating", "Trade Code Compliance"],
          topCompanies: ["Turner Construction", "Bechtel", "Fluor Corporation", "Skanska"],
          skillsToUpgrade: [
            { skillName: "OSHA 30-Hour Safety Certification", whyItStandsOut: "Demonstrates complete jobsite safety oversight capability." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Major Commercial Construction & Facilities Groups",
          fitRationale: "Commercial contractors value safety adherence, code compliance, and reliable technical execution.",
          positionsToWatch: ["Lead Journeyman", "Jobsite Foreman", "Maintenance Supervisor"],
          interviewTips: "Focus on safety records, blueprint reading proficiency, troubleshooting examples, and project completions."
        }
      ]
    };
  }

  // IT & Software Development
  if (/software|developer|programmer|full stack|frontend|backend|data engineer|devops|cloud|cybersecurity|code|coder|tech/.test(title)) {
    const roleTitle = jobTitleInput || "Software Engineer / Developer";
    return {
      domainName: "Software & Technology",
      industry: "Software & Cloud Systems",
      coreSkills: [
        "Software Architecture & Code Implementation",
        "Algorithmic Problem Solving",
        "Full-Stack Web Development",
        "Version Control & Code Review (Git)",
        "Database Architecture & SQL/NoSQL",
        "API Integration & Microservices",
        "Cloud Deployment (AWS / GCP / Azure)",
        "Automated Testing & CI/CD Pipelines",
        "System Optimization & Performance Tuning",
        "Technical Documentation & Clean Code"
      ],
      sampleSummary: `Innovative and results-driven ${roleTitle} with a strong background in building scalable web applications and cloud architectures. Proficient in modern programming frameworks, clean code practices, and system optimization.`,
      sampleBullet: `• Architected and deployed scalable full-stack application features, improving system throughput by 30%.\n• Engineered RESTful API endpoints and integrated database queries with robust error handling.\n• Collaborated in agile sprint teams to deliver clean, thoroughly tested software releases ahead of deadlines.`,
      recommendedRoles: [
        {
          title: `Senior Software Engineer (${roleTitle})`,
          fitScore: 95,
          rationale: `Capitalizes directly on your programming, code architecture, and system building experience.`,
          expectedSalaryRange: "$120,000 - $165,000",
          skillsToAcquire: ["Distributed Systems Architecture", "System Design Patterns", "Technical Leadership & Code Mentorship"],
          topCompanies: ["Google", "Stripe", "Microsoft", "Amazon", "Meta"],
          skillsToUpgrade: [
            { skillName: "High-Scale Distributed Systems", whyItStandsOut: "Essential for engineering scalable enterprise cloud applications." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Cloud & Tech Companies (Google, Stripe, Microsoft)",
          fitRationale: "Premier software enterprises value clean code standards, system design proficiency, and problem-solving.",
          positionsToWatch: ["Senior Developer", "Staff Engineer", "Solutions Architect"],
          interviewTips: "Prepare for live coding assessments, system design interviews, and behavioral STAR stories."
        }
      ]
    };
  }

  // Default / General
  const roleTitle = jobTitleInput || "Professional Specialist";
  return {
    domainName: "Operations & General Management",
    industry: "Business Operations & Professional Services",
    coreSkills: [
      "Task Prioritization & Scheduling",
      "Operational Workflow Optimization",
      "Quality Assurance & Standards Compliance",
      "Cross-Functional Communication",
      "Problem Solving & De-escalation",
      "Documentation & Record Keeping",
      "Vendor & Client Relations",
      "Team Coordination & Support",
      "Time & Resource Management",
      "Process Execution & Continuous Improvement"
    ],
    sampleSummary: `Resourceful and results-oriented ${roleTitle} with a strong foundation in process execution, workflow optimization, and team collaboration. Dedicated to maintaining high quality standards and operational efficiency.`,
    sampleBullet: `• Executed daily operational workflows efficiently, consistently meeting quality and timeliness benchmarks.\n• Coordinated with cross-functional team members to streamline communication and resolve operational bottlenecks.\n• Maintained meticulous records and documentation to ensure compliance with organization standards.`,
    recommendedRoles: [
      {
        title: `Operations Lead / Team Supervisor (${roleTitle})`,
        fitScore: 92,
        rationale: `Leverages your operational execution, task coordination, and domain experience into team leadership.`,
        expectedSalaryRange: "$60,000 - $85,000",
        skillsToAcquire: ["Operational Workflow Analytics", "Team Performance Supervision", "Resource Allocation Strategy"],
        topCompanies: ["Fortune 500 Enterprises", "Commercial Services Hubs", "Regional Business Networks"],
        skillsToUpgrade: [
          { skillName: "Process Optimization Analytics", whyItStandsOut: "Proves capability to reduce operational bottlenecks and cut overhead." }
        ]
      }
    ],
    recommendedCompanies: [
      {
        companyName: "Corporate Operations & Commercial Organizations",
        fitRationale: "Commercial businesses seek adaptable team members with strong organization, communication, and process standards.",
        positionsToWatch: ["Operations Supervisor", "Team Lead", "Specialist Coordinator"],
        interviewTips: "Highlight workflow efficiency improvements, task organization, and reliability metrics."
      }
    ]
  };
}

// ----------------------------------------------------
// AI API Endpoints (Centralized AI Service with Multi-Model Fallback & Caching)
// ----------------------------------------------------

// 1. Optimize Bullet Point / Grammar / ATS Check
app.post("/api/ai/optimize-bullet", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.optimizeBullet(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Optimize Bullet Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 2. Rewrite Experience professionally
app.post("/api/ai/rewrite-experience", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.rewriteExperience(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Rewrite Experience Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 3. Generate career summary
app.post("/api/ai/generate-summary", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.generateSummary(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Generate Summary Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 4. Suggest high-impact skills
app.post("/api/ai/suggest-skills", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.suggestSkills(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Suggest Skills Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 4b. Suggest High-Impact ATS Keywords with parser categories, scores, and rationale
app.post("/api/ai/suggest-ats-keywords", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.suggestAtsKeywords(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Suggest ATS Keywords Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 5. Generate & Refine Cover Letter with Specifications & Live Google Search Grounding
app.post("/api/ai/generate-cover-letter", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.generateCoverLetter(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Generate Cover Letter Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 5.5 Auto-Draft Cover Letter by Analyzing Filled Resume
app.post("/api/ai/auto-draft-cover-letter", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.autoDraftCoverLetter(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Auto-Draft Cover Letter Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 12. Interview Intelligence Suite (Technical, HR, Behavioural, STAR, Mock Assessment)
app.post("/api/ai/interview-suite", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.interviewSuite(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Interview Suite Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process interview request." });
  }
});

// 13. 3D Resume Analytics Engine API
app.post("/api/ai/resume-analytics", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.resumeAnalytics(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Resume Analytics Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process resume analytics." });
  }
});

// 6. Resume Analyzer & ATS Score
app.post("/api/ai/analyze-resume", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.analyzeResume(req.body);
    res.json({ report: result });
  } catch (error: any) {
    console.error("AI Analyze Resume Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 6.25 Analyze Resume for Career Recommendations & Job Matching
app.post("/api/ai/career-recommendation", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.careerRecommendation(req.body);
    res.json({ report: result });
  } catch (error: any) {
    console.error("AI Career Recommender Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 6.28 AI Dynamic Job Hunting & Career Tips Generator
app.post("/api/ai/career-tips", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.careerTips(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Career Tips Error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate career tips." });
  }
});

// 6.35 Analyze Job Poster / Flyer / URL / Posting Text
app.post("/api/ai/analyze-job-poster", async (req, res) => {
  try {
    serverStats.totalRequests++;
    if (!serverStats.endpointsCalls.jobPosterAnalysis) {
      serverStats.endpointsCalls.jobPosterAnalysis = 0;
    }
    serverStats.endpointsCalls.jobPosterAnalysis++;
    const result = await aiService.analyzeJobPoster(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Analyze Job Poster Error:", error);
    try {
      const fallback = await aiService.analyzeJobPoster({ userResume: req.body?.userResume });
      res.json(fallback);
    } catch {
      res.status(500).json({ error: error?.message || "Failed to process job poster" });
    }
  }
});

// 6.40 Company Intelligence & Target Role Search with 10 Nearby Alternatives
app.post("/api/ai/analyze-company-job", async (req, res) => {
  try {
    serverStats.totalRequests++;
    if (!serverStats.endpointsCalls.companyIntelligence) {
      serverStats.endpointsCalls.companyIntelligence = 0;
    }
    serverStats.endpointsCalls.companyIntelligence++;
    const result = await aiService.analyzeCompanyJob(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Analyze Company & Job Error:", error);
    try {
      const fallback = await aiService.analyzeCompanyJob({
        companyNameOrLink: req.body?.companyNameOrLink || "Target Company",
        companyLocation: req.body?.companyLocation || "Global",
        desiredPosition: req.body?.desiredPosition || "Specialist",
        userResume: req.body?.userResume
      });
      res.json(fallback);
    } catch {
      res.status(500).json({ error: error?.message || "Failed to process company intelligence" });
    }
  }
});

// 6.5 Auto-apply ATS Audit Suggestions directly to Resume
app.post("/api/ai/auto-apply-changes", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.autoApplyChanges(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Auto-apply Suggestions Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 6.8 Comprehensive AI Resume Coach with Live Web Research Grounding
app.post("/api/ai/resume-coach", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.resumeCoach(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Resume Coach Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// 6.9 AI Interactive Mock Interview Evaluator
app.post("/api/ai/evaluate-interview-answer", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.evaluateInterviewAnswer(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Interview Evaluator Error:", error);
    res.status(500).json({ error: error?.message || "Failed to evaluate answer" });
  }
});

// 6.10 AI Uploaded Resume Scanner, Deficiency Audit & Template Style Extractor
app.all(["/api/ai/parse-and-audit-resume", "/api/parse-and-audit-resume"], async (req, res) => {
  if (req.method === "GET") {
    return res.json({ status: "ok", endpoint: "/api/ai/parse-and-audit-resume" });
  }
  try {
    serverStats.totalRequests++;
    const result = await aiService.parseAndAuditResume(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Parse & Audit Error:", error);
    res.status(500).json({ error: error?.message || "Failed to parse and audit resume." });
  }
});

// Real-time AI Resume Content Re-Audit Endpoint
app.all(["/api/ai/audit-resume-content", "/api/audit-resume-content"], async (req, res) => {
  if (req.method === "GET") {
    return res.json({ status: "ok", endpoint: "/api/ai/audit-resume-content" });
  }
  try {
    serverStats.totalRequests++;
    const result = await aiService.auditResumeContent(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Resume Re-Audit Error:", error);
    res.status(500).json({ error: error?.message || "Failed to audit resume content." });
  }
});

// 6.11 AI Fetch & Parse Public Profile Data from LinkedIn URL
app.all(["/api/ai/parse-linkedin-profile", "/api/parse-linkedin-profile"], async (req, res) => {
  if (req.method === "GET") {
    return res.json({ status: "ok", endpoint: "/api/ai/parse-linkedin-profile" });
  }
  try {
    const { url, rawText } = req.body || {};
    if (!url && !rawText) {
      return res.status(400).json({ error: "Please provide a valid LinkedIn profile URL or profile text to import." });
    }
    serverStats.totalRequests++;
    const result = await aiService.parseLinkedInProfile({ url: url || "", rawText: rawText || "" });
    res.json(result);
  } catch (error: any) {
    console.error("AI LinkedIn Profile Parser Error:", error);
    res.status(500).json({ error: error?.message || "Failed to fetch and parse LinkedIn profile." });
  }
});


// 7. Interview preparation guide
app.post("/api/ai/interview-prep", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.interviewPrep(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Interview Prep Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process request" });
  }
});

// AI General Career Coach Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.chat(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Coach Chat Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process chat session" });
  }
});

// 7.5 Multimodal Image Understanding & Document Scan (using gemini-3.1-pro-preview)
app.post("/api/ai/analyze-image", async (req, res) => {
  try {
    serverStats.totalRequests++;
    const result = await aiService.analyzeImage(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("AI Analyze Image Error:", error);
    res.status(500).json({ error: error?.message || "Failed to process image request" });
  }
});

// 8. Direct Feedback Email Dispatcher
app.post("/api/feedback/send-email", async (req, res) => {
  try {
    const { rating, comment, email, displayName, userId } = req.body || {};
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5 || typeof comment !== "string" || !comment.trim() || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Valid rating (1-5), comment, and email are required fields." });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Invalid sender email format." });
    }

    const cleanComment = comment.trim().slice(0, 5000);
    const cleanEmail = email.trim().slice(0, 150);
    const cleanName = typeof displayName === "string" ? displayName.trim().slice(0, 150) : "Anonymous";
    const cleanUserId = typeof userId === "string" ? userId.trim().slice(0, 128) : "Not Provided";

    console.log(`[Feedback Received] ${numRating}/5 stars.`);

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || "feedback@cvcraftai.com";
    const recipient = process.env.FEEDBACK_TO_EMAIL || process.env.ADMIN_EMAIL || "mwana1601@gmail.com";

    if (!host || !user || !pass) {
      console.warn("SMTP credentials are not configured. Email dispatch skipped.");
      return res.json({
        success: true,
        smtpConfigured: false,
        message: "Your rating and feedback was saved to the database."
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });

    const safeComment = escapeHtml(cleanComment);
    const safeName = escapeHtml(cleanName || "Anonymous User");
    const safeEmail = escapeHtml(cleanEmail);
    const safeUserId = escapeHtml(cleanUserId || "N/A");

    const mailOptions = {
      from,
      to: recipient,
      subject: `[CVCraft AI] New Feedback Submitted (${numRating}/5 Stars)`,
      text: `Hello,\n\nA new user feedback review has been submitted on CVCraft AI.\n\nRating: ${numRating} / 5 Stars\nComments:\n${cleanComment}\n\n---\nUser Profile:\nName: ${cleanName}\nEmail: ${cleanEmail}\nUser ID: ${cleanUserId}\nSubmitted At: ${new Date().toISOString()}\n`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #fafafa;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; font-weight: 700;">New Feedback & Rating Received!</h2>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <p style="font-size: 18px; margin: 0 0 12px 0; font-weight: bold; color: #1e293b;">
              Rating: ${"★".repeat(numRating)}${"☆".repeat(5-numRating)} <span style="font-size: 14px; color: #64748b; font-weight: normal;">(${numRating}/5 Stars)</span>
            </p>
            <div style="font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; background-color: #f8fafc; padding: 12px; border-radius: 8px;">${safeComment}</div>
          </div>
          <div style="font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <p style="margin: 3px 0;"><strong>Sender Name:</strong> ${safeName}</p>
            <p style="margin: 3px 0;"><strong>Sender Email:</strong> <a href="mailto:${safeEmail}" style="color: #4f46e5; text-decoration: none;">${safeEmail}</a></p>
            <p style="margin: 3px 0;"><strong>User ID:</strong> <code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">${safeUserId}</code></p>
            <p style="margin: 3px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Successfully dispatched feedback email.`);
    return res.json({ success: true, smtpConfigured: true });

  } catch (error: any) {
    console.error("Error dispatching feedback email:", error);
    return res.status(500).json({ error: "Failed to dispatch feedback email over SMTP." });
  }
});

// ----------------------------------------------------
// Express static & Vite Middleware setup
// ----------------------------------------------------

async function startServer() {
  if (!isProduction) {
    // Vite Dev Mode (lazy-loaded so vite is not required in production containers)
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn("[SERVER] Vite dev server failed to start, falling back to static files:", viteErr);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.send("CV Craft AI Server Running");
        }
      });
    }
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.send("CV Craft AI Server Running");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server if running as standalone process (not inside Vercel serverless function or AWS Lambda)
const isImportedAsHandler = typeof process.argv[1] === "string" && (
  process.argv[1].includes("/api/") ||
  process.argv[1].includes("\\api\\") ||
  (!process.argv[1].endsWith("server.ts") && !process.argv[1].endsWith("server.cjs"))
);
const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || Boolean(process.env.LAMBDA_TASK_ROOT) || isImportedAsHandler;

if (!isServerless) {
  startServer();
}

export { app, startServer };
export default app;
