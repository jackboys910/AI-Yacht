import "../globals.css";
import { fontVariables } from "@/lib/fonts";

/**
 * Root layout for the admin panel, and the third one in the app after the two
 * language layouts.
 *
 * It exists for two reasons. The panel chooses its own language (ТЗ v4, §6)
 * and remembers it in the browser, so the `lang` written here is only the
 * default — the client corrects it once the remembered choice is read, which is
 * what spell-checking in forty text fields depends on. And the language-switch
 * scroll restoration that the public layouts inject has nothing to restore
 * here: the panel switch reloads no page and moves nothing.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
