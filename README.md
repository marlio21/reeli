# ureel.me v52.5.18

Mobile Layout Model Hard Fix.

- Alte Ureel-Buttonkappung auf 66px in der Layout-Normalisierung entfernt.
- Ein sichtbarer Mobile-Layoutwert `buttonGridLayout.buttonSizePx` wird für Editor, Vorschau und Public erhalten.
- Mobile Buttonkacheln erlauben jetzt einen stabilen Bereich bis 112px, ohne dass der Public-Link sie vorher wieder verkleinert.
- Buttontext-Fit in echten 9:16-Kacheln härter repariert: Text-Offsets werden in Public/Preview nicht mehr angewandt und kurze Labels bleiben zentriert.
- Werbetext-Skalierung in finaler Mobile/Public-Darstellung liest die konfigurierten Größen ohne zusätzliche Preview/Public-Schrumpfung.
- Desktop-Editor wurde nicht bewusst umgebaut.
- Keine `RELEASE_NOTES_*.md`.

## Projekt

ureel.me / reeli – Aus Video wird Aktion.

React / Vite / TypeScript mit vorbereitetem Firebase-Setup und Vercel Deployment.
