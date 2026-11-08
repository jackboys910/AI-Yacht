# Why two font files are in the repository

`next/font/google` downloads the site's fonts as **woff2**, and the social
image generator cannot read woff2 — satori, which draws those images, takes
TrueType or OpenType only. These are the same two families the site uses, SemiBold, as **static**
TrueType.

Static, and that is not a detail: the variable `Manrope[wght].ttf` and
`PlayfairDisplay[wght].ttf` in Google's font repository make the drawing
library fall over with `Cannot read properties of undefined (reading '256')`
— it does not read a variation table. The static instances below come from
the same place, through the stylesheet API, and are a third of the size.

They are read from disk at build time and never served to a visitor, which
is also why they live here rather than in `public/`. Downloading them during
the build instead would put the whole deploy at the mercy of fonts.google.com
being reachable, and a build that fails because a font server is slow is a
build that fails for no reason anybody can act on.

Both are under the SIL Open Font License 1.1:

- Playfair Display — https://fonts.google.com/specimen/Playfair+Display
- Manrope — https://fonts.google.com/specimen/Manrope

To replace them, ask the stylesheet API for TrueType rather than woff2 —
an Android 4 user agent is what gets a `.ttf` URL out of it:

```
curl -A "Mozilla/5.0 (Linux; U; Android 4.0.3; en-us) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30"   "https://fonts.googleapis.com/css?family=Manrope:600&subset=latin,cyrillic"
```
