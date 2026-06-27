# v52.5.68 – Desktop Scene Parity & Button Text Polish

Basis: v52.5.67 build/lint baseline.

## Geändert

### Desktop Szene
- Farbe/Farbverlauf deaktiviert jetzt eindeutig über `cardBackgroundEnabled=false` und `ureelScene.mode='none'`.
- Farbe/Farbverlauf aktivieren schaltet Video/Bild sauber aus und schreibt ein konsistentes `ureelScene`-Objekt.
- Darstellung zeigt und speichert die zwei Mobile-Optionen: `Reel` und `16:9 Ansicht`.
- Darstellung ändert nicht mehr versehentlich eine Farb-/Bildszene in ein leeres Video.
- Endkarte-An/Aus-Schalter bleibt zentral und schreibt beim Reaktivieren einen sicheren Fallback auf `scene`.

### App-Buttons
- Text-Fit für echte 9:16-Kartenbuttons verbessert.
- Buttontext berechnet die nutzbare Textbreite konservativer, damit Labels wie „Telefon“ nicht unsauber abgeschnitten werden.
- Icon/Text-Abstand in kleinen Buttons reduziert.
- Text bleibt innerhalb des Buttons statt am Rand sichtbar abgeschnitten zu wirken.

## Tests
- `npm run lint` erfolgreich.
- `npm run build` erfolgreich.

## Nicht geändert
- Keine Konu/Ureel-Umbenennung.
- Keine Architekturänderung.
- Keine Änderung an Firebase-Regeln oder Vercel-Konfiguration.
