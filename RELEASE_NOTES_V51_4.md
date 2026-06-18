# v51.4 – Mobile Live-Link Stabilization

## Ziel

Der öffentliche ureel-Link soll auf Smartphones zuverlässig als echte 9:16-Karte erscheinen – ohne Desktop-Spaltenlayout, ohne Editor-Chrome und ohne unerwartete horizontale/vertikale Verschiebung.

## Änderungen

1. Neuer dedizierter mobiler Public Renderer:
   - `src/components/PublicMobileCardRenderer.tsx`

2. `PublicDesktopPageRenderer` nutzt unterhalb des Desktop-Breakpoints jetzt den neuen `PublicMobileCardRenderer`.

3. Mobile Live-Ansicht ist auf eine stabile 9:16-Fläche begrenzt:
   - Breite: maximal Viewport-Breite
   - Höhe: maximal Viewport-Höhe
   - Seitenverhältnis bleibt 9:16
   - kein Desktop-Grid auf Smartphone/Tablet unterhalb `lg`

4. Die eigentliche Kartenlogik bleibt in `KonuCardCore`:
   - Szene
   - Video/Bild/Farbe
   - Werbetext
   - Buttons
   - Endkarte
   - Replay

5. Keine neuen Features und keine Design-Experimente.

## Einschätzung

Stabilitätslevel: gut bis mittel.

Das Risiko ist moderat, weil die mobile Public-Darstellung gezielt geändert wurde. Die Änderung ist aber bewusst klein gehalten: Nur der mobile Wrapper wurde getrennt, die eigentliche Karte bleibt im zentralen Renderer.

## Empfohlener nächster Schritt

Nach erfolgreichem Vercel-Build und Handy-Test:

`v51.5 – Card Renderer Unification`

Ziel: Szene, Buttoneditor-Vorschau, Werbetexter-Vorschau und Live-Link noch stärker auf dieselbe Kartenlogik bringen.

## Noch nicht machen

- keine neuen Buttonaktionen
- kein Stripe
- kein Startseiten-Admin
- keine großen UI-Umbauten

Erst Mobile-Link und Renderer stabilisieren.
