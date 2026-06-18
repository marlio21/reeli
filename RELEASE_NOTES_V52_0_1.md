# v52.0.1 – Orbit Submenu Flow Cleanup

## Ziel

Diese Version verfeinert den mobilen Orbit-Prototyp. Die öffentliche Karte, Desktop-Live-Seite und der Desktop-Editor bleiben unverändert. Der Fokus liegt ausschließlich auf der mobilen Studio-Bedienung.

## Änderungen

- Hauptbereiche öffnen nicht mehr sofort ein Konfigurationsfenster.
- Nach Auswahl eines Hauptbereichs erscheint zuerst ein eigenes Untermenü als leicht farbiger, transparenter Orbit-Bogen.
- Untermenüfarben:
  - Szene: warmes Gold / Creme
  - Text: Violett / Rosé
  - Buttons: Mint / Grün
  - Design: Blau / Petrol
- Erst nach Auswahl eines Untermenüsegments öffnet sich das Konfigurationsfenster.
- Das Konfigurationsfenster wurde kleiner gehalten, damit die Vorschau sichtbarer bleibt.
- Schriftgrößen im Konfigurationsfenster wurden erhöht.
- Das Konfigurationsfenster zeigt oben jetzt klar den aktiven Hauptbereich und Unterbereich.
- „Vorschau frei“ blendet das Konfigurationsfenster aus.
- „Untermenü“ öffnet wieder den farbigen Orbit-Bogen des aktiven Bereichs.

## Hinweise

Dies ist weiterhin ein Prototyp. Button-Cockpit, Text-Cockpit und weitere Spezialsteuerungen sind noch nicht final umgesetzt.

## Test

Nach dem Deployment am Smartphone öffnen:

```text
https://reeli-alpha.vercel.app/?v=5201
```

Prüfen:

1. Studio-Kreis öffnen.
2. Hauptbereich wählen.
3. Farbig-transparentes Untermenü prüfen.
4. Untermenüsegment wählen.
5. Kleineres Konfigurationsfenster prüfen.
6. „Vorschau frei“ testen.
7. Öffentlichen Live-Link prüfen.
