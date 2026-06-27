# ureel v52.5.45 – Desktop Onepager Route Separation Fix

Diese Version aktiviert die Desktop-Onepager-Logik sicherer, ohne die mobile Version zu verändern.

## Neu

- Public View rendert jetzt genau **eine** Oberfläche:
  - Desktop / großer Landscape-Screen: Desktop-Onepager
  - Mobile / kleine Screens: bestehende Mobile-Public-Karte
- Dadurch werden doppelte Video-/Karten-Renderer vermieden.
- Die Mobile-Version bleibt geschützt und unverändert.
- Desktop-Onepager bleibt in drei Bereiche gegliedert:
  1. Reel / 9:16 Video ohne Kartenbuttons
  2. separater Button-Aktionsbereich mit den echten Kartenbuttons
  3. gestaltbarer Inhaltsbereich mit Text sowie optionalem Bild-/Video-URL-Feld
- Test-Parameter:
  - `?desktopOnepager=1` erzwingt Desktop-Onepager
  - `?mobilePublic=1` erzwingt Mobile-Public-Ansicht
- Die Kartenbuttons werden auf Desktop nicht im Reel angezeigt, sondern daneben als Bedienbereich.
- Buttonbereich nutzt weiterhin die echten Buttondaten der Karte und ist auf maximal 6 Kartenbuttons begrenzt.

## Upload-Hinweis

ZIP bleibt ohne `dist/`, ohne `node_modules/` und ohne `RELEASE_NOTES_*.md`. Vercel baut aus `package.json`.
