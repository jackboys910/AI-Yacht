import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site is a fully static landing page: `next build` emits plain
  // HTML/CSS/JS into `out/`, which Cloudflare Workers serves as static assets.
  output: "export",

  // Static export has no Image Optimization server, so images are served as-is.
  images: { unoptimized: true },

  // Emit `out/about/index.html` instead of `out/about.html` so Cloudflare
  // serves clean URLs without a trailing-slash redirect dance.
  trailingSlash: true,

  experimental: {
    // Each language has its own root layout (app/(en), app/(ru)), so there is
    // no single layout to wrap a 404 in; app/global-not-found.tsx fills that
    // gap and is exported as out/404.html.
    globalNotFound: true,
  },
};

export default nextConfig;
