# ureel.me v52.5.14

Public Renderer Hard Switch Fix.

- Public-Link, mobile Studio-Vorschau und Desktop-Phone-Preview nutzen jetzt eine gemeinsame mobile 9:16-Live-Surface.
- Die Karte rendert intern auf einer festen 390×693-Basis und wird danach nur skaliert, damit Buttontext, Icons und Werbetext nicht pro Ansicht neu umbrechen.
- Ziel: Die geteilte Karte soll optisch viel näher an der Editor-/Monitor-Vorschau liegen.
- Desktop-Preview-Chrome bereinigt: zusätzliche Dashboard-/Start-Schaltflächen in der rechten Desktop-Vorschau wurden ausgeblendet.
- Der Desktop-Editor selbst wurde nicht bewusst umgebaut.
- Profilbild, Public Link und bestehende Kartenlogik bleiben erhalten.
- Keine `RELEASE_NOTES_*.md`.

## Projekt

ureel.me / reeli – Aus Video wird Aktion.

React / Vite / TypeScript mit vorbereitetem Firebase-Setup und Vercel Deployment.
