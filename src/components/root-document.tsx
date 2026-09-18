import type { Locale } from "@/i18n";
import { fontVariables } from "@/lib/fonts";
import { restoreScrollScript } from "@/lib/language-scroll";

/**
 * The <html>/<body> shell shared by every root layout. Each language has its
 * own root layout (see app/(en) and app/(ru)) so `lang` is correct in the
 * statically exported HTML, not patched in on the client.
 */
export function RootDocument({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} className={fontVariables}>
      <body>
        {children}
        {/* Must come after the page content: it measures the sections to
            restore the scroll position carried over from a language switch. */}
        <script dangerouslySetInnerHTML={{ __html: restoreScrollScript }} />
      </body>
    </html>
  );
}
