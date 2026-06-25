# v52.5.34

Button tile cleanup and public loading performance fix.

- Action buttons in the 9:16 preview/public card are clamped to safe mobile tile sizes.
- Size presets write smaller, usable public values: 44/52/58/66px.
- Icon/text stack is centered and slightly lifted inside the tile.
- Layout debug is hidden by default and no longer appears with normal debug URLs.
- Public video backgrounds use metadata preload and stop showing the loading pill to visitors.

# ureel.me v52.5.33

Mobile Editor Public Size Writer Fix. Vercel upload ZIP without dist/node_modules.

# ureel.me / reeli

Aktuelle Version: **v52.5.33 – Public Layout Debug Inspector**

Hinweis: Der ZIP-Upload enthält bewusst keinen `dist/`-Ordner. Vercel baut den Ordner selbst beim Deployment neu.


# ureel.me v52.5.33

Public Layout Debug Inspector.

- Buttonform in mobilen Kartenkacheln wieder steuerbar: Kreis, Eckig und Abgerundet werden nicht mehr durch `forceSquare` überschrieben.
- `forceSquare` hält nur die Kachelmaße quadratisch, nicht die visuelle Form.
- Top-Level-/Live-Layoutwerte aus dem Editor gewinnen vor alten `mobileLayout`/`publicLayoutSnapshot`-Werten.
- Alte Snapshots bleiben nur Fallback für Legacy-Karten.
- Kein neuer Renderer-Umbau, Desktop nicht bewusst verändert.
- ZIP bleibt dist-free für Vercel.

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


## v52.5.33 – Public Layout Debug Inspector

- Temporärer Layout-Debug-Overlay in Public View und zentralen Studio-Vorschauen.
- Zeigt geladene Button-/Textgrößen aus buttonGridLayout, mobileLayout und publicLayoutSnapshot.
- Ziel: Nachweis, ob Public falsche Firestore-Werte lädt oder richtige Werte später überschrieben werden.
- Kein neuer Renderer-Umbau, kein dist/ im ZIP.
