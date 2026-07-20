import { getEmailProvider } from "@/lib/email/provider";

type PasswordResetEmailInput = {
  to: string;
  name: string | null;
  resetUrl: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
  const greetingName = input.name?.trim() || "there";
  const subject = "Reset your Taskzen password";

  const text = [
    `Hi ${greetingName},`,
    "",
    "We received a request to reset your Taskzen password.",
    `This link expires in ${input.expiresInMinutes} minutes and can be used once:`,
    input.resetUrl,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "— Taskzen",
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; background:#0f1218; color:#e8eaef; padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#171b26;border:1px solid #2a3444;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8eb4ff;">Taskzen</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#ffffff;">Reset your password</h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c4c9d4;">Hi ${escapeHtml(greetingName)},</p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#c4c9d4;">
          We received a request to reset your Taskzen password. Use the button below to choose a new one.
          This link expires in <strong>${input.expiresInMinutes} minutes</strong> and can be used only once.
        </p>
        <p style="margin:0 0 28px;">
          <a href="${escapeHtml(input.resetUrl)}"
             style="display:inline-block;background:#5b8def;color:#0f1218;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px;">
            Reset password
          </a>
        </p>
        <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#9aa3b2;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#8eb4ff;">
          ${escapeHtml(input.resetUrl)}
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#9aa3b2;">
          If you did not request this, you can ignore this email. Your password will stay the same.
        </p>
      </div>
    </div>
  `.trim();

  await getEmailProvider().send({
    to: input.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
