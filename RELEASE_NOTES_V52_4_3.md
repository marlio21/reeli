# v52.4.3 – Button Layout, Color Picker & Management Fix

## Fokus
Mobile Button-Bearbeitung weiter stabilisiert und produktiver gemacht.

## Änderungen
- Buttonraster wird für ureel-Karten geklemmt, damit auch große Buttons im 3er-Raster sauber sichtbar bleiben.
- Alte übergroße `buttonSizePx`-Werte werden beim Rendern auf mobile-safe Werte begrenzt.
- Größenpreset `Groß` wurde auf eine sichere Größe reduziert; `Klein` und `Normal` bleiben kompakt.
- Alle Farbeingaben bleiben als Farbfeld + Farbcode gedacht: Textfarbe, Iconfarbe, Buttonfarbe, Rahmenfarbe.
- „Look auf alle Buttons“ bleibt am Ende des Look-Bereichs, ohne zusätzliches großes Toast-Overlay.
- Verwalten wurde konkretisiert: Kopieren, Nach links, Nach rechts, Entfernen.
- Passwortschutz im Button-Verwalten-Bereich vorbereitet: Ein/Aus, Passwort und Hinweistext.
- Erfolgs-Toast wurde verkürzt/beruhigt, damit kein großer schwarzer Speicherstreifen den Workflow stört.

## Unverändert
- Public Link / öffentliche Karte bleiben funktional gleich.
- Desktop bleibt unverändert.
