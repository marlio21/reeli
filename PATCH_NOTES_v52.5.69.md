# v52.5.69 – Desktop UI sichtbare Reparatur

Basis: vom Nutzer hochgeladene aktuelle Version `reeli-main (5)(1).zip`.

## Ziel
Nur sichtbare Desktop-Studio-Probleme reparieren, keine Firebase- oder Architekturänderungen.

## Änderungen

### Button bearbeiten
- Vorschau-Button im rechten Editor bekommt einen eigenen Center-Wrapper.
- Alte absolute Positionierung wird für den neuen Wrapper neutralisiert.
- Ziel: Button sitzt mittig im großen Vorschaufeld, nicht links/oben.

### Mittelspalte Desktop
- Subnav-Karten erhalten eigene Klasse `ureel-desktop-subnav-card`.
- Label und Beschreibung werden sauber untereinander gesetzt.
- Größere Abstände, bessere Lesbarkeit, kein Zusammenkleben wie `TEXTHauptzeile`.

### Szene
- Farbe/Farbverlauf: klarer segmentierter Schalter `Aus / Farbe / Verlauf`.
- Darstellung: Reel und 16:9 bleiben als zwei große Karten sichtbar.
- Endkarte: klarer segmentierter Schalter `Aus / Szene / Farbe`.
- Profilbild: klarer segmentierter Schalter `Aus / Profilbild anzeigen`.
- Endkarte AUS schreibt jetzt `source: none` und entfernt optionale Endkarten-Medien.

## Nicht geändert
- Keine Firebase-Regeln.
- Keine Datenmigration.
- Keine Konu/Ureel-Architekturänderung.
- Keine Mobile-Editor-Logik verändert.

## Geprüft
- `npm run lint` erfolgreich.
- `npm run build` erfolgreich.
