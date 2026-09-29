import "../globals.css";
import { fontVariables } from "@/lib/fonts";

/**
 * Root layout for the admin panel, and the third one in the app after the two
 * language layouts.
 *
 * It exists for two reasons. The admin panel is in Russian while the site
 * defaults to English, and `lang` has to say so for spell-checking and screen
 * readers. And the language-switch scroll restoration that the public layouts
 * inject has nothing to restore here — there is no language switch in the
 * admin panel.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
