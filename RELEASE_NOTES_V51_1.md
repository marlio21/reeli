# ureel v51.1 – Clean Build/Schema Stabilization

Diese Version ist ein stabilisierender Zwischenstand auf Basis von v51. Ziel war nicht der Ausbau neuer Features, sondern das Entfernen harter Schema-/Renderer-Blocker vor weiterer Appentwicklung.

## Geändert

- `BackgroundType` akzeptiert jetzt offiziell `gradient`, passend zu den vorhandenen Szenen-/Starterkarten-Daten.
- `handleCopyButtonLocal` wurde ergänzt, damit der Button „Kopie“ im Buttoneditor nicht mehr auf eine fehlende Funktion zeigt.
- Sichtbarer Buttontext bleibt zentral über `title` gesteuert.
- Legacy-Felder `label`, `text` und `actionLabel` sind nur noch als Import-/Migrationsfelder typisiert.
- `normalizeButton()` migriert alte sichtbare Textfelder nach `title`, nutzt aber keine Aktion/Ziel-Felder als sichtbaren Text.
- `sanitizeButtonForFirestore()` entfernt alte sichtbare/action Legacy-Felder beim Speichern aus dem Button-Payload.
- `KonuCardCore` filtert interne Editor-/Vorschau-Buttons nur noch anhand von `title`, nicht mehr anhand von `btn.label`.
- Starterbuttons in Firebase/Studio verwenden kein neues `label: title` mehr.

## Hinweis

In dieser Umgebung konnte `npm install` wegen Zeitlimit nicht vollständig abgeschlossen werden. Dadurch konnte kein vollständiger lokaler `npm run build` mit installierten Projektabhängigkeiten ausgeführt werden. Die offensichtlichen TypeScript-/Schema-Blocker aus der vorherigen Prüfung wurden behoben.

Empfohlener Check nach Upload/GitHub/Vercel:

```bash
npm install
npm run lint
npm run build
```

Wenn danach noch Fehler erscheinen, sollten sie als nächster enger Fix-Schritt behandelt werden, bevor neue Features ergänzt werden.
