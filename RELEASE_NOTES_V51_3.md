# v51.3 – Shared Desktop Renderer Alignment

## Ziel

Diese Version setzt die nächste Stabilisierung nach v51.2 fort. Es wurden keine neuen Produktfeatures gebaut.

Ziel war, die öffentliche Desktop-Miniwebseite und die Design-Vorschau stärker auf denselben Renderer zu bringen, damit Live-Link und Editor-Vorschau nicht mehr auseinanderlaufen.

## Änderungen

- Neuer gemeinsamer Renderer: `src/components/PublicDesktopPageRenderer.tsx`
- Öffentliche Desktopansicht in `PublicCardView.tsx` nutzt jetzt den gemeinsamen Desktop-Renderer.
- Design-Vorschau in `UreelStudioShell.tsx` nutzt denselben Desktop-Renderer im Modus `studio-preview`.
- Smartphone-Karte innerhalb der Desktop-Vorschau bleibt skaliert und wird nicht neu umbrochen.
- Desktop-Buttonbereich nutzt weiterhin echte Nutzerbuttons über `ButtonRenderer`.
- Desktop-Buttonlayouts `ordered`, `compact_grid`, `circle` und `triangle` wurden im Typmodell ergänzt.
- Keine neuen Features, keine neuen Datenbankfelder, keine UI-Experimente.

## Zweck

Diese Version ist ein weiterer Schritt Richtung:

- Szene = echte Karte
- Werbetexter-Vorschau = echte Karte
- Button-Vorschau = echter ButtonRenderer
- Desktop-Vorschau = öffentlicher Desktop-Renderer
- Live-Link = gleicher Desktop-Renderer

## Prüfen nach Upload

Bitte nach dem Upload prüfen:

```bash
npm install
npm run lint
npm run build
```

## Hinweis

In dieser Umgebung standen keine lokalen `node_modules` zur Verfügung. Eine vollständige lokale Vercel-Build-Simulation konnte deshalb nicht abgeschlossen werden. Die Änderungen wurden statisch geprüft und bewusst klein gehalten.
