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

/**
 * A finished email, whoever is about to send it.
 *
 * Declared here rather than beside the sender because the Cloudflare Worker
 * sends too, and the sender imports the EmailJS browser SDK, which has no
 * business being pulled into a Worker bundle even as a type.
 */
export type OutgoingEmail = {
  subject: string;
  html: string;
  text: string;
  fromName?: string;
  /** Lets "Reply" in the inbox go straight to the sender, when the EmailJS
   *  template maps its Reply-To field to {{reply_to}}. */
  replyTo?: string;
};

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
  block?: { label: string; text: string; emptyText: string };
  /** Trusted, static HTML (never user input). */
  calloutHtml?: string;
  /**
   * A photograph across the top of the body.
   *
   * The announcement of a new trip is the one letter here that is mostly a
   * picture — §8.2 lists the cover first among its contents, and a trip
   * described in words alone is a trip nobody pictures.
   */
  hero?: { url: string; alt: string };
  /** The one thing the letter asks for, as a button rather than a link. */
  button?: { label: string; href: string };
  /**
   * What a mailing must carry by law (§8.2, Н-09): why this letter arrived,
   * the sender's postal address, and the way off the list.
   *
   * Absent on letters that are not a mailing — a receipt for a form somebody
   * has just filled in is not something anyone can unsubscribe from.
   */
  footer?: { note: string; links: { label: string; href: string }[] };
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
  const rows = content.rows
    .map((row, i) => renderRow(row, i === content.rows.length - 1))
    .join("");

  const hero = content.hero
    ? `
          <tr>
            <td style="padding:0;">
              <img src="${esc(content.hero.url)}" alt="${esc(content.hero.alt)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </td>
          </tr>`
    : "";

  const rowsBlock =
    content.rows.length > 0
      ? `
          <tr>
            <td style="padding:32px 36px 8px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">${esc(content.rowsLabel)}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-collapse:collapse;">${rows}
              </table>
            </td>
          </tr>`
      : "";

  const block = content.block
    ? `
          <tr>
            <td style="padding:20px 36px 32px;">
              <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${c.teal};font-weight:700;">${esc(content.block.label)}</div>
              <div style="margin-top:12px;padding:18px 20px;background-color:${c.background};border-left:4px solid ${c.gold};border-radius:10px;font-size:15px;line-height:24px;color:${c.text};">${
                content.block.text.trim()
                  ? esc(content.block.text.trim()).replace(/\r?\n/g, "<br />")
                  : `<span style="color:${c.muted};">${esc(content.block.emptyText)}</span>`
              }</div>
            </td>
          </tr>`
    : "";

  // A table rather than a styled <a>: Outlook ignores padding on a link, and
  // a button nobody can press is the one thing this letter is for.
  const button = content.button
    ? `
          <tr>
            <td style="padding:0 36px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:${c.gold};border-radius:999px;">
                    <a href="${esc(content.button.href)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:${c.primary};text-decoration:none;">${esc(content.button.label)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  const callout = content.calloutHtml
    ? `
          <tr>
            <td style="padding:0 36px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.goldSoft};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:22px;color:${c.primary};">${content.calloutHtml}</td>
                </tr>
              </table>
            </td>
          </tr>`
    : "";

  const legal = content.footer
    ? `
              <div style="margin-top:10px;font-size:12px;line-height:18px;color:${c.muted};">${esc(content.footer.note)}</div>
              <div style="margin-top:8px;font-size:12px;line-height:18px;color:${c.muted};">${content.footer.links
                .map(
                  (link) =>
                    `<a href="${esc(link.href)}" style="color:${c.teal};text-decoration:underline;">${esc(link.label)}</a>`,
                )
                .join(" &middot; ")}</div>`
    : "";

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

        <!-- width="100%" with a max-width, not width="600": a table never
             shrinks below the width its attribute asks for, so on a phone the
             fixed version made the whole letter scroll sideways. -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${c.card};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -12px rgba(9,26,54,0.25);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

          <tr>
            <td style="background-color:${c.primary};padding:32px 36px;">
              <div style="font-size:22px;line-height:26px;font-weight:700;letter-spacing:4px;color:#FFFFFF;">${esc(content.brand)}</div>
              <div style="margin-top:6px;font-size:11px;line-height:16px;letter-spacing:3px;text-transform:uppercase;color:${c.gold};">${esc(content.kicker)}</div>
              <div style="margin-top:22px;height:1px;background-color:rgba(255,255,255,0.15);font-size:0;line-height:0;">&nbsp;</div>
              <div style="margin-top:22px;font-size:24px;line-height:30px;font-weight:600;color:#FFFFFF;">${esc(content.title)}</div>
              <div style="margin-top:8px;font-size:14px;line-height:20px;color:rgba(255,255,255,0.72);">${esc(content.subtitle)}</div>
            </td>
          </tr>

${hero}${rowsBlock}${block}${button}${callout}

          <tr>
            <td style="background-color:${c.background};border-top:1px solid ${c.border};padding:22px 36px;">
              <div style="font-size:12px;line-height:18px;color:${c.muted};">Sent automatically from <a href="${siteConfig.url}" style="color:${c.teal};text-decoration:none;">${siteConfig.domain}</a> &middot; ${new Date().toUTCString()}</div>${legal}
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
  const width = Math.max(0, ...content.rows.map((r) => r.label.length)) + 2;
  const lines = [
    `${content.brand} — ${content.title.toUpperCase()}`,
    content.kicker,
    "",
    content.subtitle,
    "",
    ...content.rows.map((r) => `${`${r.label}:`.padEnd(width)} ${r.value.trim() || "—"}`),
  ];

  if (content.block) {
    lines.push("", `${content.block.label}:`, content.block.text.trim() || content.block.emptyText);
  }
  if (content.button) {
    lines.push("", `${content.button.label}: ${content.button.href}`);
  }

  lines.push("", `Sent from ${siteConfig.url} at ${new Date().toUTCString()}`);

  if (content.footer) {
    lines.push(
      content.footer.note,
      ...content.footer.links.map((link) => `${link.label}: ${link.href}`),
    );
  }

  return lines.join("\n");
}
