import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = {
  title: "Админка — nazarov.net",
  // The panel is behind a password, but a stray link should not put it in
  // search results either. It is also kept out of sitemap.xml (Т-06).
  robots: { index: false, follow: false },
};

/**
 * The whole admin panel lives at this one address.
 *
 * Static hosting serves a file per path, so `/admin/trips/abc` would be a 404 —
 * there is no such file. Sub-navigation therefore travels in the query string
 * (`/admin/?view=trips&id=abc`), which Cloudflare ignores when picking the
 * file, so a reload or a bookmarked link still lands on a working page.
 *
 * `useSearchParams` suspends during the prerender, hence the boundary.
 */
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminApp />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[color:var(--muted)] text-sm text-muted-foreground">
      Загрузка…
    </div>
  );
}
