import { Manrope, Playfair_Display } from "next/font/google";

// Both families ship a Cyrillic subset; without it the Russian pages would
// silently fall back to system fonts.
export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const fontVariables = `${manrope.variable} ${playfair.variable}`;
