

## v52.5.52 – Desktop Exact Mobile Editor Parity Bridge

- Desktop keeps the 3-area workbench: preview, selector, configuration.
- The right configuration area now uses the same tap-to-edit panels as the mobile version instead of simplified desktop-only editors.
- Scene, Text and Buttons therefore expose the same controls and wording as mobile.
- Global actions remain only in the top dashboard.
- Mobile remains unchanged; the bridge is desktop-only CSS/state routing.
# ureel v52.5.47 – Desktop Studio Side-by-Side Editor Foundation

Diese Version macht den Desktop-Editor sichtbarer und klarer, ohne die mobile Version umzubauen.

## Neu

- Desktop bekommt eine eigene Studio-Struktur:
  - Dashboard-Leiste oben
  - Konfiguration links/mittig
  - permanente Vorschau direkt daneben
- Dashboard oben enthält:
  - Karten
  - Nutzer
  - Neue Karte
  - Teilen
- Arbeitsbereiche oben: Szene, Text, Buttons, Website, Karten.
- Wenn ein Bereich gewählt wird, bleibt die Vorschau sichtbar und die Konfiguration wechselt daneben.
- Die alte Mobile-Bedienung bleibt unverändert.
- Die große Buttoneditor-Vorschau bleibt unverändert.
- Desktop nutzt weiterhin dieselben Karten-/Button-/Textdaten wie Mobile/Public.

## Sicherheitsregel

Mobile wurde nicht bewusst verändert. Die neue Struktur greift nur ab Desktop-Breite.

## Upload-Hinweis

ZIP bleibt ohne `dist/`, ohne `node_modules/` und ohne `RELEASE_NOTES_*.md`. Vercel baut aus `package.json`.

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
