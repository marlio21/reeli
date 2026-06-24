# ureel.me v52.5.15

Final Visual Mode Parity Fix.

- Neuer finaler visueller Render-Modus: Public-Link und Studio-Vorschau unterscheiden sich nicht mehr über `isPreview`.
- `isPreview` steuert nur noch Editor-Klickbarkeit; Layout, Button-Fit, Werbetext und Timing nutzen in der Unified Mobile Surface denselben Endzustand.
- Timeline/Animationen werden im finalen visuellen Modus eingefroren, damit die geteilte Karte wie die Vorschaukarte aussieht.
- Kartenbuttons verwenden in Public und Vorschau dieselbe begrenzte Mobile-Tile-Größe.
- Public-Link, mobile Studio-Vorschau und Desktop-Phone-Preview bleiben auf der gemeinsamen 390×693 Kartenbasis.
- Desktop-Editor wurde nicht bewusst umgebaut.
- Keine `RELEASE_NOTES_*.md`.

## Projekt

ureel.me / reeli – Aus Video wird Aktion.

React / Vite / TypeScript mit vorbereitetem Firebase-Setup und Vercel Deployment.
