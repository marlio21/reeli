# Browser-Kompatibilität v52.5.88

Ziel: Desktop-Internationalisierung und Browser-Stabilität prüfen, ohne Mobile zu verändern.

## Geprüfte technische Punkte im Code

- Sprachwahl nutzt `localStorage` mit vorhandenen Safe-Storage-Helfern.
- Ohne gespeicherte Sprache wird `navigator.language` nur defensiv gelesen und auf `de`/`en` normalisiert.
- Clipboard-Aktionen behalten den vorhandenen Fallback über `document.execCommand('copy')`, wichtig für Safari/iOS.
- Upload-Felder bleiben native `<input type="file">`, damit Chrome, Edge und Safari sie zuverlässig unterstützen.
- QR-Code-Modal nutzt normales `<img>`/Data-URL-Verhalten, keine browserkritische Canvas-Interaktion im Editor.
- Desktop-i18n ist in `UreelStudioShell.tsx` gekapselt; Mobile-Renderer, ButtonRenderer und Persistence wurden nicht verändert.

## Manueller Testplan nach Deployment

### Chrome / Edge Desktop
1. App öffnen.
2. DE/EN Umschalter oben rechts testen.
3. My ureel page öffnen.
4. Prüfen, ob Navigation, Top-Actions, Miniwebseiten-Editor und Start-Aktionen übersetzt werden.
5. Link kopieren, Webseite starten, QR öffnen testen.

### Safari Desktop
1. App öffnen und DE/EN umschalten.
2. Datei-Upload in Hintergrund und Bereich 3 testen.
3. Link kopieren testen. Falls Safari Clipboard blockiert, muss der Fallback greifen oder ein Toast erscheinen.
4. Public Desktop-Webseite öffnen und Buttons testen.

### Mobile Regression, nur Kontrolle
1. Mobile Szene öffnen.
2. Mobile Text/Werbetext öffnen.
3. Mobile Buttons/Aktion öffnen.
4. Public 9:16-Karte öffnen.

## Erwartung

Die Übersetzung betrifft zuerst die Desktop-Shell und den My-ureel-page-Editor. Nutzerinhalte wie Titel, Beschreibung, Buttontexte und Begrüßung bleiben unverändert.
