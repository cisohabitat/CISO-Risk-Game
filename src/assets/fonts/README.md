# Display typography

Newsreader Semibold, optical size 24, is the display face. The Latin WOFF2
subset is self-hosted as `newsreader-display.woff2` (23,756 bytes); body copy
keeps the system sans-serif stack. Other scripts retain the existing serif
fallback. `font-display: optional` keeps text visible and avoids a late font swap
on a slow connection.

Source: Google Fonts, Newsreader v26, downloaded 16 October 2026. Copyright
2020 The Newsreader Project Authors (Production Type). The SIL Open Font
License is retained in `OFL.txt` and shipped at `/fonts/Newsreader-OFL.txt`.
There is no request to a font service during play.

`scripts/size-budget.ts` follows font URLs in the entry stylesheet and counts
their compressed WOFF2 bytes in the first-visit budget. Keep the font self-hosted,
preserve the licence and measure any replacement before raising that budget.
