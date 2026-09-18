import { siteConfig } from "../site";

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

/** Escape user-supplied values so a stray `<` cannot break the markup. */
export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailRow = {
  label: string;
  /** Raw user value; escaped here. Empty renders as an em dash. */
  value: string;
  /** Optional link target (e.g. `mailto:`), also escaped. */
  href?: string;
};

export type EmailContent = {
  preheader: string;
  brand: string;
  kicker: string;
  title: string;
  subtitle: string;
  rowsLabel: string;
  rows: EmailRow[];
  block: { label: string; text: string; emptyText: string };
  /** Trusted, static HTML (never user input). */
  calloutHtml: string;
};

function renderRow(row: EmailRow, isLast: boolean): string {
  const border = isLast ? "" : `border-bottom:1px solid ${c.border};`;
  const value = row.value.trim()
    ? row.href
      ? `<a href="${esc(row.href)}" style="color:${c.teal};text-decoration:none;">${esc(row.value)}</a>`
      : esc(row.value)
    : "—";
  return `
          <tr>
            <td style="padding:14px 0;${border}width:150px;vertical-align:top;font-size:13px;line-height:20px;color:${c.muted};text-transform:uppercase;letter-spacing:1px;">${esc(row.label)}</td>
            <td style="padding:14px 0;${border}font-size:16px;line-height:24px;color:${c.text};font-weight:600;">${value}</td>
          </tr>`;
}

/**
 * Table-based, inline-styled HTML that renders consistently in Gmail,
 * Outlook and Apple Mail. The EmailJS template must output it with triple
 * braces — `{{{html}}}` — or it arrives as escaped source code.
 */
export function renderEmailHtml(content: EmailContent): string {
  const blockText = content.block.text.trim()
    ? esc(content.block.text.trim()).replace(/\r?\n/g, "<br />")
    : `<span style="color:${c.muted};">${esc(content.block.emptyText)}</span>`;
  const rows = content.rows
    .map((row, i) => renderRow(row, i === content.rows.length - 1))
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(content.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${c.background};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(content.preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.background};padding:32px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background-color:${c.card};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -12px rgba(9,26,54,0.25);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

          <tr>
            <td style="background-color:${c.primary};padding:32px 36px;">
              <div style="font-size:22px;line-height:26px;font-weight:700;letter-spacing:4px;color:#FFFFFF;">${esc(content.brand)}</div>
              <div style="margin-top:6px;font-size:11px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${c.gold};">${esc(content.kicker)}</div>
              <div style="margin-top:22px;height:1px;background-color:rgba(255,255,255,0.15);font-size:0;line-height:0;">&nbsp;</div>
              <div style="margin-top:22px;font-size:24px;line-height:30px;font-weight:600;color:#FFFFFF;">${esc(content.title)}</div>
              <div style="margin-top:8px;font-size:14px;line-height:20px;color:rgba(255,255,255,0.72);">${esc(content.subtitle)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 36px 8px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">${esc(content.rowsLabel)}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-collapse:collapse;">${rows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 36px 32px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">${esc(content.block.label)}</div>
              <div style="margin-top:12px;padding:18px 20px;background-color:${c.background};border-left:4px solid ${c.gold};border-radius:10px;font-size:15px;line-height:24px;color:${c.text};">${blockText}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.goldSoft};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:22px;color:${c.primary};">${content.calloutHtml}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:${c.background};border-top:1px solid ${c.border};padding:22px 36px;">
              <div style="font-size:12px;line-height:18px;color:${c.muted};">Sent automatically from <a href="${siteConfig.url}" style="color:${c.teal};text-decoration:none;">${siteConfig.domain}</a> &middot; ${new Date().toUTCString()}</div>
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

/** Plain-text fallback for clients that refuse HTML. */
export function renderEmailText(content: EmailContent): string {
  const width = Math.max(...content.rows.map((r) => r.label.length)) + 2;
  return [
    `${content.brand} — ${content.title.toUpperCase()}`,
    content.kicker,
    "",
    ...content.rows.map((r) => `${`${r.label}:`.padEnd(width)} ${r.value.trim() || "—"}`),
    "",
    `${content.block.label}:`,
    content.block.text.trim() || content.block.emptyText,
    "",
    `Sent from ${siteConfig.url} at ${new Date().toUTCString()}`,
  ].join("\n");
}
