import variants from "@/lib/content/asset-variants.json";

/**
 * A photograph, in the size the layout will actually show it (Т-01).
 *
 * The site is a static export: nothing resizes an image on the way to the
 * visitor, so a photograph meant for a 480-pixel box has to exist at 480
 * pixels. `scripts/image-variants.mjs` writes those copies as WebP and lists
 * them in a manifest; this reads the manifest and offers them through
 * `srcset`, with the original JPEG left in `src` as the fallback.
 *
 * Two deliberate limits:
 *
 *  - **Only `/assets/…` has variants.** A photograph the owner uploaded lives
 *    in Cloud Storage, which makes its own smaller copy at upload time, and
 *    that is what `thumbUrl` is for. Passing such an address here is fine:
 *    the component renders a plain `<img>` and nothing is lost.
 *  - **`sizes` is not optional when variants exist.** Without it the browser
 *    assumes the image fills the window and picks the widest copy, which is
 *    the whole problem this exists to solve. The prop is required by the type
 *    for exactly that reason.
 */
export function Photo({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  style,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** What the layout gives this image, e.g. "(min-width: 1024px) 480px, 45vw". */
  sizes: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * True for the one image a page is judged on — the first screen's
   * photograph. It is fetched eagerly and with high priority; everything else
   * waits until it is nearly on screen.
   */
  priority?: boolean;
}) {
  const widths = (variants as Record<string, number[]>)[src];

  const image = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={widths ? sizes : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      style={style}
    />
  );

  if (!widths || widths.length === 0) return image;

  const name = src.replace(/^\/assets\//, "").replace(/\.[^.]+$/, "");
  const srcSet = widths.map((one) => `/assets/v/${name}-${one}.webp ${one}w`).join(", ");

  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {image}
    </picture>
  );
}
