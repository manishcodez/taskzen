import { getEmailProvider } from "@/lib/email/provider";

function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDeadline(dueDate: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(dueDate);
}

function wrapEmail(title: string, bodyHtml: string, bodyText: string) {
  const appUrl = getAppBaseUrl();
  const html = `
    <div style="font-family: Georgia, 'Times New Roman', serif; background:#0f1218; color:#e8eaef; padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#171b26;border:1px solid #2a3444;border-radius:16px;padding:28px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8eb4ff;">Taskzen</p>
        <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#ffffff;">${escapeHtml(title)}</h1>
        ${bodyHtml}
        <p style="margin:28px 0 0;">
          <a href="${escapeHtml(appUrl)}"
             style="display:inline-block;background:#5b8def;color:#0f1218;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px;">
            Open Taskzen
          </a>
        </p>
      </div>
    </div>
  `.trim();

  const text = `${bodyText}\n\nOpen Taskzen: ${appUrl}\n`;

  return { html, text, appUrl };
}

export async function sendDeadlineReminderEmail(input: {
  to: string;
  name: string | null;
  taskTitle: string;
  dueDate: Date;
  taskId: string;
}) {
  const greeting = input.name?.trim() || "there";
  const dueLabel = formatDeadline(input.dueDate);
  const appUrl = getAppBaseUrl();
  const taskUrl = `${appUrl}/tasks/${input.taskId}`;
  const subject = `Reminder: "${input.taskTitle}" is due within 24 hours`;

  const { html, text } = wrapEmail(
    "Deadline approaching",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c4c9d4;">Hi ${escapeHtml(greeting)},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c4c9d4;">
        Your task <strong style="color:#ffffff;">${escapeHtml(input.taskTitle)}</strong> is due within 24 hours.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#9aa3b2;">Due (UTC): <strong style="color:#e8eaef;">${escapeHtml(dueLabel)}</strong></p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#9aa3b2;">
        <a href="${escapeHtml(taskUrl)}" style="color:#8eb4ff;">View this task</a>
      </p>
    `,
    [
      `Hi ${greeting},`,
      "",
      `Your task "${input.taskTitle}" is due within 24 hours.`,
      `Due (UTC): ${dueLabel}`,
      `View task: ${taskUrl}`,
    ].join("\n"),
  );

  await getEmailProvider().send({ to: input.to, subject, html, text });
}

export async function sendOverdueTaskEmail(input: {
  to: string;
  name: string | null;
  taskTitle: string;
  dueDate: Date;
  taskId: string;
}) {
  const greeting = input.name?.trim() || "there";
  const dueLabel = formatDeadline(input.dueDate);
  const appUrl = getAppBaseUrl();
  const taskUrl = `${appUrl}/tasks/${input.taskId}`;
  const subject = `Overdue: "${input.taskTitle}" needs attention`;

  const { html, text } = wrapEmail(
    "Task overdue",
    `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c4c9d4;">Hi ${escapeHtml(greeting)},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#c4c9d4;">
        Your task <strong style="color:#ffffff;">${escapeHtml(input.taskTitle)}</strong> is now overdue.
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#9aa3b2;">Was due (UTC): <strong style="color:#e8eaef;">${escapeHtml(dueLabel)}</strong></p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#9aa3b2;">
        <a href="${escapeHtml(taskUrl)}" style="color:#8eb4ff;">Open this task</a>
      </p>
    `,
    [
      `Hi ${greeting},`,
      "",
      `Your task "${input.taskTitle}" is now overdue.`,
      `Was due (UTC): ${dueLabel}`,
      `Open task: ${taskUrl}`,
    ].join("\n"),
  );

  await getEmailProvider().send({ to: input.to, subject, html, text });
}
