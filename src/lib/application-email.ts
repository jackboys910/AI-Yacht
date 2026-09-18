import { siteConfig } from "./site";

export type ApplicationData = {
  name: string;
  contact: string;
  niche: string;
  goal: string;
};

/** Brand palette converted from the site's OKLCH tokens to hex, because
 *  email clients do not understand `oklch()`. */
const c = {
  primary: "#091A36",
  gold: "#D09945",
  goldSoft: "#F5E7CF",
  teal: "#16827D",
  background: "#F7FBFD",
  card: "#FFFFFF",
  border: "#D6E0E7",
  text: "#091A36",
  muted: "#576574",
} as const;

/** Escape user-supplied values so a stray `<` cannot break the email markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Preserve the line breaks a person typed into the textarea. */
function escMultiline(value: string): string {
  return esc(value).replace(/\r?\n/g, "<br />");
}

function row(label: string, value: string, isLast = false): string {
  const border = isLast ? "" : `border-bottom:1px solid ${c.border};`;
  return `
          <tr>
            <td style="padding:14px 0;${border}width:150px;vertical-align:top;font-size:13px;line-height:20px;color:${c.muted};text-transform:uppercase;letter-spacing:1px;">${label}</td>
            <td style="padding:14px 0;${border}font-size:16px;line-height:24px;color:${c.text};font-weight:600;">${value}</td>
          </tr>`;
}

export function buildSubject(data: ApplicationData): string {
  const who = data.name.trim() || "Unnamed applicant";
  return `AI Yacht — new application from ${who}`;
}

/** Plain-text fallback for clients that refuse HTML. */
export function buildText(data: ApplicationData): string {
  return [
    "AI YACHT — NEW APPLICATION",
    `Bootcamp: ${siteConfig.dates} · Grenada -> Grenadines -> Saint Vincent`,
    "",
    `Name:            ${data.name || "—"}`,
    `Telegram/WhatsApp: ${data.contact || "—"}`,
    `Line of business: ${data.niche || "—"}`,
    "",
    "What they want from the week:",
    data.goal.trim() || "—",
    "",
    `Sent from ${siteConfig.url} at ${new Date().toUTCString()}`,
  ].join("\n");
}

export function buildHtml(data: ApplicationData): string {
  const goal = data.goal.trim()
    ? escMultiline(data.goal.trim())
    : `<span style="color:${c.muted};">— not filled in —</span>`;

  const sentAt = new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>AI Yacht — new application</title>
</head>
<body style="margin:0;padding:0;background-color:${c.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">New AI Yacht application from ${esc(data.name || "a visitor")} — ${esc(data.contact || "no contact")}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.background};padding:32px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${c.card};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -12px rgba(9,26,54,0.25);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

          <!-- Header -->
          <tr>
            <td style="background-color:${c.primary};padding:32px 36px;">
              <div style="font-size:22px;line-height:26px;font-weight:700;letter-spacing:4px;color:#FFFFFF;">AI YACHT</div>
              <div style="margin-top:6px;font-size:11px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${c.gold};">${siteConfig.dates} &middot; Caribbean</div>
              <div style="margin-top:22px;height:1px;background-color:rgba(255,255,255,0.15);font-size:0;line-height:0;">&nbsp;</div>
              <div style="margin-top:22px;font-size:24px;line-height:30px;font-weight:600;color:#FFFFFF;">New application</div>
              <div style="margin-top:8px;font-size:14px;line-height:20px;color:rgba(255,255,255,0.72);">Someone just requested a 15-minute call.</div>
            </td>
          </tr>

          <!-- Applicant details -->
          <tr>
            <td style="padding:32px 36px 8px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">Applicant</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-collapse:collapse;">
${row("Name", esc(data.name) || "—")}
${row("Telegram / WhatsApp", esc(data.contact) || "—")}
${row("Line of business", esc(data.niche) || "—", true)}
              </table>
            </td>
          </tr>

          <!-- Goal -->
          <tr>
            <td style="padding:20px 36px 32px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">What they want from the week</div>
              <div style="margin-top:12px;padding:18px 20px;background-color:${c.background};border-left:4px solid ${c.gold};border-radius:10px;font-size:15px;line-height:24px;color:${c.text};">${goal}</div>
            </td>
          </tr>

          <!-- Reminder strip -->
          <tr>
            <td style="padding:0 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.goldSoft};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:22px;color:${c.primary};">
                    <strong>Reply within 24 hours.</strong> Only ${siteConfig.seats} seats are available and priority goes by application date.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${c.background};border-top:1px solid ${c.border};padding:22px 36px;">
              <div style="font-size:12px;line-height:18px;color:${c.muted};">Sent automatically from <a href="${siteConfig.url}" style="color:${c.teal};text-decoration:none;">${siteConfig.domain}</a> &middot; ${sentAt}</div>
              <div style="margin-top:4px;font-size:12px;line-height:18px;color:${c.muted};">AI Yacht Bootcamp &middot; Grenada &rarr; Grenadines &rarr; Saint Vincent</div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
