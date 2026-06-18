# v52.0.3 – Orbit Arc Submenus & Direct Text Edit

## Ziel

Weiterentwicklung des mobilen ureel Studio-Konzepts: weniger klassische Panels, mehr transparente Direktbearbeitung über der Vorschau.

## Änderungen

- Mobile Studio bleibt im transparenten Orbit-Look.
- Rechte Untermenü-Liste aus v52.0.2 durch einen transparenten Halbkreis-/Teilring um die Hauptsteuerung ersetzt.
- Untermenüs bleiben leicht farbig und transparent:
  - Szene: Gold / Creme
  - Text: Violett / Rosé
  - Buttons: Mint / Grün
  - Design: Blau / Petrol
- Konfigurationsfenster liegt nun eigenständig als größeres Glass-Overlay über Vorschau und Menüführung.
- Konfigurationsfenster hat größere Schrift, größere Eingabefelder und mehr Touchfläche.
- Textmodus vorbereitet für direkte Bearbeitung:
  - Titel, Slogan und Beschreibung können in der mobilen Textvorschau als Hotspots angewählt werden.
  - Antippen öffnet die Text-Konfiguration über der Vorschau.
- Öffentliche Karte, Public Link und Desktop bleiben unverändert.

## Testhinweis

Nach Deployment am Smartphone öffnen mit:

```text
https://reeli-alpha.vercel.app/?v=5203
```

Prüfen:

1. Studio-Kreis öffnen.
2. Hauptbereich wählen.
3. Untermenüs erscheinen als Halbring statt rechter Seitenliste.
4. Untermenü wählen.
5. Konfigurationsfenster liegt groß und transparent über der Vorschau.
6. Textmodus öffnen und Titel/Slogan/Beschreibung antippen.
7. Public Link bleibt unverändert.
