/**
 * Making a CSV that Excel opens without a fight (А-16).
 *
 * Two things ruin a CSV, and both are about the program on the other side
 * rather than about the data.
 *
 * **Cyrillic.** Excel reads a file without a byte-order mark in the system's
 * ANSI code page, so UTF-8 Russian arrives as `ÐŸÐ¾Ð´Ð¿Ð¸ÑÑ‡Ð¸Ðº`. A BOM is
 * three bytes at the front that say "this is UTF-8", and it is the whole fix.
 *
 * **The separator.** Excel splits on the list separator of its own locale: a
 * comma in English Windows, a semicolon in Russian. The wrong one puts every
 * row in a single column. There is no value that is right everywhere, so the
 * caller passes the one that matches the person asking — the panel uses its
 * own language, because somebody reading the panel in Russian is overwhelmingly
 * likely to open the file in a Russian Excel. Google Sheets detects either.
 */

const BOM = "﻿";

export type CsvSeparator = "," | ";";

/** Quotes a value the way RFC 4180 asks, and only when it needs it. */
function cell(value: string, separator: CsvSeparator): string {
  const text = value.replace(/\r?\n/g, " ").trim();
  return text.includes(separator) || text.includes('"')
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function toCsv(
  header: string[],
  rows: string[][],
  separator: CsvSeparator = ",",
): string {
  // CRLF, not LF: it is what RFC 4180 says and what older Excel expects.
  return (
    BOM +
    [header, ...rows]
      .map((row) => row.map((value) => cell(value, separator)).join(separator))
      .join("\r\n") +
    "\r\n"
  );
}

/**
 * Hands the browser a file to save.
 *
 * A blob and a synthetic click, because a static site has no server to ask
 * for the file and the data is already here. The object URL is released on
 * the next tick — holding it would keep the whole file in memory for as long
 * as the panel stays open.
 */
export function downloadCsv(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
