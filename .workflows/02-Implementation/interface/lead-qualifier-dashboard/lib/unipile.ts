import { createHmac, timingSafeEqual } from "node:crypto";

// ——— Types ———

export type LIAccountStatus =
  | "OK"
  | "CREDENTIALS"
  | "ACTION_NEEDED"
  | "RECONNECT"
  | "STOPPED"
  | "ERROR";

export interface UnipileAccount {
  id: string;
  type: string;
  status: LIAccountStatus;
  name?: string;
  linkedin_id?: string;
}

export type UnipileAccountStatus = UnipileAccount;

export interface UnipileMessage {
  id: string;
  account_id: string;
  text?: string;
  sender_id?: string;
  sender_name?: string;
  created_at: string;
  read: boolean;
}

export interface UnipileProfile {
  id: string;
  linkedin_id?: string;
  public_identifier?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  profile_url?: string;
}

export interface UnipileInvitation {
  id: string;
}

export interface UnipileDM {
  id: string;
}

export interface UnipileConfig {
  apiKey: string;
  dsn: string;
}

export interface CreateHostedAuthLinkParams {
  providers: ["LINKEDIN"];
  successRedirectUrl: string;
  failureRedirectUrl: string;
}

export interface SendInvitationParams {
  accountId: string;
  linkedinId: string;
  message?: string;
}

export interface SendDMParams {
  accountId: string;
  chatId: string;
  message: string;
}

export interface SearchProfilesParams {
  accountId: string;
  keywords?: string;
  title?: string;
  location?: string;
  limit?: number;
}

// ——— Errors ———

export class UnipileHTTPError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "UnipileHTTPError";
  }
}

export class UnipileTransientHTTPError extends UnipileHTTPError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "UnipileTransientHTTPError";
  }
}

// ——— Retry ———

const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

function isTimeoutError(err: unknown) {
  if (!(err instanceof Error)) return false;
  return (
    err.name === "AbortError" ||
    err.name === "TimeoutError" ||
    /\b(timeout|timed out)\b/i.test(err.message)
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = RETRY_DELAYS_MS.length
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof UnipileTransientHTTPError || isTimeoutError(err);
      if (!retryable || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
  throw lastError;
}

function normalizeUnipileBaseUrl(dsn: string) {
  const trimmed = dsn.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
  }
  return `https://${trimmed}.unipile.com:13465/api/v1`;
}

// ——— Client ———

export class UnipileClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: UnipileConfig) {
    this.baseUrl = normalizeUnipileBaseUrl(config.dsn);
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-API-KEY": this.apiKey,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      const message =
        `Unipile ${options.method ?? "GET"} ${path} → ${response.status}: ${body}`;
      if (response.status >= 500) {
        throw new UnipileTransientHTTPError(response.status, message);
      }
      throw new UnipileHTTPError(
        response.status,
        message
      );
    }

    return response.json() as Promise<T>;
  }

  async getAccountStatus(accountId: string): Promise<UnipileAccount> {
    return withRetry(() => this.request<UnipileAccount>(`/accounts/${accountId}`));
  }

  async sendInvitation(params: SendInvitationParams): Promise<UnipileInvitation> {
    return withRetry(() =>
      this.request<UnipileInvitation>("/linkedin/invitations", {
        method: "POST",
        body: JSON.stringify({
          account_id: params.accountId,
          provider_id: params.linkedinId,
          ...(params.message ? { message: params.message } : {}),
        }),
      })
    );
  }

  async sendDM(params: SendDMParams): Promise<UnipileDM> {
    return withRetry(() =>
      this.request<UnipileDM>(`/chats/${params.chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          account_id: params.accountId,
          text: params.message,
        }),
      })
    );
  }

  async getMessages(accountId: string, chatId?: string): Promise<UnipileMessage[]> {
    const path = chatId
      ? `/chats/${chatId}/messages?account_id=${encodeURIComponent(accountId)}`
      : `/messages?account_id=${encodeURIComponent(accountId)}`;
    return withRetry(() => this.request<UnipileMessage[]>(path));
  }

  async searchProfiles(params: SearchProfilesParams): Promise<UnipileProfile[]> {
    const query = new URLSearchParams({
      account_id: params.accountId,
      ...(params.keywords ? { keywords: params.keywords } : {}),
      ...(params.title ? { title: params.title } : {}),
      ...(params.location ? { location: params.location } : {}),
      limit: String(params.limit ?? 25),
    });
    return withRetry(() => this.request<UnipileProfile[]>(`/linkedin/profiles?${query}`));
  }

  async createHostedAuthLink(params: CreateHostedAuthLinkParams): Promise<{ url: string }> {
    return withRetry(() =>
      this.request<{ url: string }>("/users/link", {
        method: "POST",
        body: JSON.stringify({
          providers: params.providers,
          success_redirect_url: params.successRedirectUrl,
          failure_redirect_url: params.failureRedirectUrl,
        }),
      })
    );
  }
}

// ——— Webhook verification ———

export function verifyUnipileSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) return false;
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const normalizedSignature = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  if (!/^[a-f0-9]+$/i.test(normalizedSignature)) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(normalizedSignature, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function verifyUnipileWebhook(body: string, signature: string): boolean {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET;
  if (!secret) return false;
  return verifyUnipileSignature(body, signature, secret);
}

// ——— Factory ———

export function createUnipileClient(): UnipileClient {
  const apiKey = process.env.UNIPILE_API_KEY;
  const dsn = process.env.UNIPILE_DSN;
  if (!apiKey || !dsn) {
    throw new Error("UNIPILE_API_KEY and UNIPILE_DSN required");
  }
  return new UnipileClient({ apiKey, dsn });
}
