# v52.5.99 / RC2.6 – Public Desktop Text & Landing Route

## Ziel
Public Desktop Miniwebseiten sollen wie fertige Webseiten wirken und keine Studio-Hinweise zeigen. Die Landingpage soll auch im eingeloggten Zustand über einen festen Link erreichbar bleiben.

## Änderungen
- `/landing` und `/home` zeigen immer die öffentliche Landingpage, auch wenn ein Nutzer eingeloggt ist.
- Desktop-Bereich 3 in der Public View nutzt eine sauberere Textdarstellung mit besserer Zeilenhöhe und `pre-line` für manuelle Umbrüche.
- Lange Texte in Bereich 3 werden nicht mehr doppelt ausgegeben, wenn das Layout `media_middle` verwendet.
- Public Desktop Content-Bereich darf intern scrollen, damit längere Präsentationstexte nicht abgeschnitten oder gequetscht werden.
- Hero-Showcase-YouTube-Videos starten in der Landingpage ab Sekunde 4, damit die ersten Sekunden mit sichtbarem YouTube-Play-Overlay möglichst übersprungen werden.

## Nicht verändert
- Mobile Studio
- Public Mobile Card Renderer
- Firestore-Datenmodell
- Firebase-Konfiguration

## Test
- `npm run build` erfolgreich.
