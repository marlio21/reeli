# v52.0.2 – Transparent Direct Edit Overlay

## Ziel

Diese Version entwickelt das mobile ureel Studio weiter zu einem transparenten Bearbeitungs-Overlay über der Vorschau.

Die öffentliche Karte, der Public Link und Desktop bleiben unverändert.

## Änderungen

1. Das Haupt-Orbit-Menü bleibt sichtbar und bedienbar, auch wenn ein Hauptbereich aktiv ist.
2. Untermenüs werden als seitliche, leicht farbige transparente Flächen am Displayrand angezeigt.
3. Bei Auswahl eines Untermenüs öffnet sich kein schweres Bottom-Sheet mehr, sondern ein transparentes Glass-Overlay über der Vorschau.
4. Das Konfigurations-Overlay ist kleiner und lässt die Vorschau sichtbar.
5. Schrift und Eingabefelder im Overlay bleiben größer und touchfreundlich.
6. Für den Buttoneditor wird bei aktiver Konfiguration eine große Button-Vorschau über dem Vorschaumonitor eingeblendet.
7. Farben bleiben leicht und transparent:
   - Szene: Gold / Creme
   - Text: Violett / Rosé
   - Buttons: Mint / Grün
   - Design: Blau / Petrol
8. `Vorschau frei` blendet die Konfiguration aus.
9. Mobile-only Änderung: Public Link und Desktopseite bleiben unangetastet.

## Test-Hinweise

Nach dem Deploy am Smartphone öffnen:

```text
https://reeli-alpha.vercel.app/?v=5202
```

Prüfen:

1. Studio-Kreis öffnen.
2. Hauptmenü wählen, z. B. Szene oder Buttons.
3. Untermenüs erscheinen seitlich und transparent.
4. Untermenü wählen, z. B. Video oder Design.
5. Konfiguration erscheint transparent über der Vorschau.
6. Hauptmenü und Untermenü bleiben erreichbar.
7. Buttoneditor zeigt eine größere Button-Vorschau.
8. Öffentliche Karte / kopierter Link bleibt unverändert gut.

## Einschätzung

Stabilitätslevel: mittel  
Risiko: moderat

Grund: Das mobile Bedienkonzept wurde sichtbar verändert, aber bewusst nur im mobilen Studio. Die Public-Karte wurde nicht angepasst.

## Nächster möglicher Schritt

v52.1 – Direct Text & Button Editing Prototype

Ziel:
- Titel/Slogan/Beschreibung direkt in der Vorschau antippbar machen.
- Button direkt in der Vorschau aktivieren.
- Text, Farbe, Größe und Timing als transparente Direktsteuerung anbieten.
