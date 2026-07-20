export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailProvider = {
  send(input: SendEmailInput): Promise<void>;
};

type CapturedEmail = SendEmailInput & { sentAt: string };

const memoryOutbox: CapturedEmail[] = [];

/** Test/dev capture — stores outbound mail without logging secrets. */
export function getCapturedEmails(): CapturedEmail[] {
  return [...memoryOutbox];
}

export function clearCapturedEmails(): void {
  memoryOutbox.length = 0;
}

export function getLastCapturedEmail(): CapturedEmail | null {
  return memoryOutbox.at(-1) ?? null;
}

/** Strip accidental quotes/whitespace from Vercel env values. Never log the raw secret. */
function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) {
    return undefined;
  }

  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value || undefined;
}

function normalizeResendApiKey(apiKey: string): string {
  // HTTP header values must be ByteString (Latin-1). Copied keys sometimes include
  // Unicode ellipsis U+2026 (…) or other non-ASCII from truncated UI paste.
  return apiKey
    .replace(/^Bearer\s+/i, "")
    .trim()
    .replace(/[^\x21-\x7E]/g, "");
}

/**
 * Resend accepts bare emails or `Name <email@domain>`.
 * Prefer a display name for the shared onboarding sender.
 */
function normalizeEmailFrom(from: string): string {
  // Keep ASCII-only for safety; strip accidental rich-text punctuation.
  const trimmed = from.trim().replace(/[^\x20-\x7E]/g, "");
  if (trimmed.includes("<") && trimmed.includes(">")) {
    return trimmed;
  }

  if (trimmed.toLowerCase() === "onboarding@resend.dev") {
    return "Taskzen <onboarding@resend.dev>";
  }

  return trimmed;
}

class MemoryEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    memoryOutbox.push({
      ...input,
      sentAt: new Date().toISOString(),
    });
  }
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      let providerMessage = "unknown";
      let providerName = "unknown";

      try {
        const payload = (await response.json()) as {
          message?: string;
          name?: string;
          statusCode?: number;
        };
        if (typeof payload.message === "string" && payload.message.trim()) {
          // Resend messages are safe to log (no API keys). Redact emails just in case.
          providerMessage = payload.message.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            "[email]",
          );
        }
        if (typeof payload.name === "string" && payload.name.trim()) {
          providerName = payload.name.trim();
        }
      } catch {
        // Ignore JSON parse failures.
      }

      throw new Error(
        `Email provider rejected the message (${response.status}, ${providerName}: ${providerMessage}).`,
      );
    }
  }
}

class NoopEmailProvider implements EmailProvider {
  async send(): Promise<void> {
    // Intentionally silent — forgot-password still returns a generic success message.
  }
}

export function getEmailProvider(): EmailProvider {
  const mode = (readEnv("EMAIL_PROVIDER") ?? "").toLowerCase();
  const apiKeyRaw = readEnv("RESEND_API_KEY");
  const fromRaw = readEnv("EMAIL_FROM");

  if (mode === "memory") {
    return new MemoryEmailProvider();
  }

  if (mode === "resend" || apiKeyRaw) {
    const apiKey = apiKeyRaw ? normalizeResendApiKey(apiKeyRaw) : undefined;
    const from = fromRaw ? normalizeEmailFrom(fromRaw) : undefined;

    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and EMAIL_FROM are required for email delivery.");
    }

    if (!apiKey.startsWith("re_")) {
      throw new Error("RESEND_API_KEY format is invalid.");
    }

    return new ResendEmailProvider(apiKey, from);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("Email provider is not configured. Password reset emails will not be delivered.");
  }

  return new NoopEmailProvider();
}
