# ureel.me / reeli

Aktuelle Version: **v52.5.26 – Sofortplan Hydration, Fresh Grid Snapshot & Tile Shape Fix**

Hinweis: Der ZIP-Upload enthält bewusst keinen `dist/`-Ordner. Vercel baut den Ordner selbst beim Deployment neu.

# ureel.me v52.5.25

Public Snapshot Staleness & Live Layout Priority Fix.

- Stale `publicLayoutSnapshot`/`mobileLayout` values from v52.5.19–v52.5.24 no longer override freshly edited `buttonGridLayout` values.
- During save/update, explicit live editor fields now win over old snapshots.
- New snapshots are versioned as `v52.5.25`.
- `heroTitleSize`, `heroSubtitleSize`, and `heroDescriptionSize` are persisted as top-level fields as well as in the public layout snapshot.
- Hydration now uses explicit top-level text sizes before falling back to snapshots.
- No renderer redesign, no new features, no intentional Desktop editor changes.
- ZIP remains dist-free for Vercel.

# ureel.me v52.5.24

Realtime Hydration & Canonical Layout Import Fix.

- Public-Realtime-Updates werden jetzt vor `setVisitorCard` immer durch `hydrateCardMobileLayout()` geschickt.
- Der initiale Public-Ladeweg hydriert die Karte ebenfalls direkt vor dem Rendern.
- `buttonUtils.ts` importiert `deriveCanonicalButtonGridLayout` korrekt aus `mobileLayoutPersistence`.
- Dadurch sollen Rohdaten aus Firestore nicht mehr den vorbereiteten Mobile/Public-Layout-State überschreiben.
- Build erfolgreich geprüft.
- Desktop-Editor wurde nicht bewusst umgebaut.
- Keine `RELEASE_NOTES_*.md`.

## Projekt

ureel.me / reeli – Aus Video wird Aktion.

React / Vite / TypeScript mit vorbereitetem Firebase-Setup und Vercel Deployment.

## v52.5.22 – Public Black Screen Hotfix

- v52.5.20 Public-Hydration/Hard-Publish-Änderung zurückgenommen, weil sie im Public View einen schwarzen Bildschirm auslösen konnte.
- Public View fällt wieder auf den stabilen v52.5.19-Ladepfad zurück.
- Mobile Editor-/Preview-Fortschritte aus v52.5.19 bleiben erhalten.
- Kein zusätzlicher Public-Aktualisieren-Button im Dashboard in dieser Hotfix-Version.
- Keine RELEASE_NOTES-Dateien.
