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
      throw new Error(`Email provider rejected the message (${response.status}).`);
    }
  }
}

class NoopEmailProvider implements EmailProvider {
  async send(): Promise<void> {
    // Intentionally silent — forgot-password still returns a generic success message.
  }
}

export function getEmailProvider(): EmailProvider {
  const mode = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (mode === "memory") {
    return new MemoryEmailProvider();
  }

  if (mode === "resend" || apiKey) {
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and EMAIL_FROM are required for email delivery.");
    }

    return new ResendEmailProvider(apiKey, from);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("Email provider is not configured. Password reset emails will not be delivered.");
  }

  return new NoopEmailProvider();
}
