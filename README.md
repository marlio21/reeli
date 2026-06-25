# ureel.me v52.5.20

Public Sync Debug & Hard Publish Fix.

- Mobile Dashboard ergänzt um **Public aktualisieren**.
- Dieser Button schreibt die aktuell sichtbare Editor-Karte hart in den Public-/Firestore-Zustand.
- Public-Snapshot wird jetzt als kanonische Quelle für mobile Buttongröße und Werbetextgrößen bevorzugt.
- Alte `buttonGridLayout`-/Hero-Size-Werte können gespeicherte `publicLayoutSnapshot`-Werte nicht mehr überstimmen.
- Realtime-Listener hydrieren Public- und Editor-Karten nach dem Laden erneut mit dem mobilen Layoutmodell.
- Debugdaten (`publicSyncDebug`, Snapshot-Debugwerte) werden mitgespeichert, um geladene Button-/Textgrößen nachverfolgen zu können.
- Desktop-Editor wurde nicht bewusst umgebaut.
- Keine `RELEASE_NOTES_*.md`.

## Projekt

ureel.me / reeli – Aus Video wird Aktion.

React / Vite / TypeScript mit vorbereitetem Firebase-Setup und Vercel Deployment.
