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

// ——— Retry ———

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // HTTP errors (4xx/5xx) are not transient — don't retry
      if (err instanceof UnipileHTTPError) throw err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

// ——— Client ———

export class UnipileClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: UnipileConfig) {
    this.baseUrl = `https://${config.dsn}.unipile.com:13465/api/v1`;
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
      throw new UnipileHTTPError(
        response.status,
        `Unipile ${options.method ?? "GET"} ${path} → ${response.status}: ${body}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getAccountStatus(accountId: string): Promise<UnipileAccount> {
    return withRetry(() => this.request<UnipileAccount>(`/accounts/${accountId}`));
  }

  async sendInvitation(params: SendInvitationParams): Promise<{ id: string }> {
    return withRetry(() =>
      this.request<{ id: string }>("/linkedin/invitations", {
        method: "POST",
        body: JSON.stringify({
          account_id: params.accountId,
          provider_id: params.linkedinId,
          ...(params.message ? { message: params.message } : {}),
        }),
      })
    );
  }

  async sendDM(params: SendDMParams): Promise<{ id: string }> {
    return withRetry(() =>
      this.request<{ id: string }>(`/chats/${params.chatId}/messages`, {
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

export async function verifyUnipileSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected =
    "sha256=" +
    Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return expected === signature;
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
