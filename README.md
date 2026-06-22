# ureel v50 – Stabilisierung, Mobile Lesbarkeit und Werbetext-Größen

Diese Version ist eine Stabilisierungsrunde. Ziel ist nicht ein neues Großfeature, sondern die Bedienung klarer und die vorhandenen Module zuverlässiger zu machen.

## Änderungen in v50

- Mobile Editor-Fenster: Formular-/Editorflächen im Detailbereich werden auf Smartphone-Ansicht cremeweiß mit dunkler Schrift dargestellt. Dadurch unterscheiden sich Editorfenster besser vom dunklen Smartphone-Preview.
- Mobile Hauptbereiche: obere Hauptnavigation auf kleinen Bildschirmen optisch stärker hervorgehoben.
- Werbetexter-Vorlagen: Im Reiter **Vorlagen** gibt es jetzt direkt eine Größensteuerung für Kompakt / Balance / Poster sowie einzelne Größenregler für Headline, Slogan und Beschreibung.
- Stabilisierungs-Checkliste ergänzt, damit Szene, Werbetext, Buttons, Endkarte, Live-Link und Mobile systematisch getestet werden können.

## v50 Test-Checkliste

### 1. Neue Karte
- Neue ureel erstellen.
- Anthrazit-Startkarte sichtbar?
- 6 Startbuttons vorhanden?
- Buttondarstellung in Editor, Szene und Live-Link gleich?

### 2. Szene
- Video-Link einfügen.
- Darstellung prüfen: Reel füllen / Ganz anzeigen / Als Video-Bildschirm.
- Video entfernen funktioniert?
- Bild / Poster hochladen und entfernen funktioniert?
- Farbe / Verlauf sichtbar und nicht durch alte Bilder/Videos verdeckt?

### 3. Werbetexter
- Titel, Slogan, Beschreibung eingeben.
- Sichtbarkeit AN/AUS prüfen.
- Vorlage auswählen.
- Vorlagen-Größe Kompakt / Balance / Poster prüfen.
- Szene-Vorschau und Live-Link sollen dieselbe Vorlage zeigen.

### 4. Buttons
- Buttontext mit optionaler zweiter Zeile testen.
- Aktion darf nicht als zweiter sichtbarer Text erscheinen.
- Icon, Iconfarbe, Textfarbe, Form und Transparenz testen.
- Reihenfolge in Buttonliste ändern.

### 5. Endkarte
- Endkarte aktivieren.
- Endkartenbild testen.
- Endkarten-Video 16:9 testen.
- Übergang ca. 2 Sekunden prüfen.

### 6. Design / Desktop-Webseite
- Desktop-Vorschau zeigt Karte, Werbetext und Buttonbereich.
- Kein unnötiger Scrollbalken im Desktop-Live-Link.
- Buttonbereich-Anordnungen prüfen.

### 7. Live-Link und Smartphone
- Link kopieren.
- Live-Link am Desktop öffnen.
- Live-Link am Smartphone öffnen.
- Smartphone soll die echte 9:16-Karte zeigen, nicht die Desktop-Webseite.

### 8. Nutzerverwaltung
- ureel-Icon oben links klicken.
- Nutzerverwaltung muss als eigenes Fenster über der App erscheinen.
- Persönliche Daten / Plan / Team / Sicherheit sichtbar?

## Commit-Vorschlag

`Stabilize mobile editor panels and ad template sizing`

## v51 – Clean Preview Stabilization

Diese Version stabilisiert die Design-Vorschau und verhindert, dass die Smartphone-Karte in der Desktop-Vorschau intern neu umbricht.

### Fokus
- Keine neuen Funktionen.
- Design-Vorschau bleibt bei der 3-Spalten-Logik: Smartphone-Karte | Werbetext | Buttonbereich.
- Die Smartphone-Karte wird in der Design-Vorschau als skalierte echte Karte angezeigt, nicht als neu berechnete Mini-Karte.
- Dadurch brechen Werbetexte in der kleinen Design-Vorschau nicht mehr in einzelne Buchstaben auseinander.

### Prüfpunkte
1. Designbereich öffnen.
2. Live-Desktop-Vorschau prüfen.
3. Smartphone-Karte darf nicht mehr extrem vertikal umbrechen.
4. Live-Link und Design-Vorschau vergleichen.
5. Szene-Vorschau bleibt die Detail-Wahrheit für die Karte.

Build geprüft: `npm run build` erfolgreich.

## v52.0.3 – Orbit Arc Submenus & Direct Text Edit

Mobile Studio Feinschliff: Untermenüs erscheinen als transparenter Halbkreis-/Teilring statt rechter Seitenliste. Konfiguration öffnet als größeres Glass-Overlay über Vorschau und Menüführung. Im Textmodus sind Titel/Slogan/Beschreibung in der mobilen Vorschau als direkte Hotspots anwählbar. Public Link und Desktop bleiben unverändert.


## v52.1.1 – Single Orbit Step Ring Cleanup

Korrektur des Drei-Ring-Prototyps: Im mobilen Studio ist jetzt immer nur ein Orbit-Ring sichtbar. Hauptmenü, Untermenü und Einstellung ersetzen sich stufenweise. Unten bleibt ein helles, vollbreites Bedienfeld für echte Eingaben. Public Link und Desktop bleiben unverändert.

## v52.2.1 – Simple Studio Layout Fix

Repair release for v52.2. The simple mobile Studio layout is forced into a top-down mobile flow: compact topbar, preview directly below it, subsection chips, then the light full-width editing panel. Public Link and public renderers remain untouched.


## v52.2.2 – Compact 9:16 Preview & Big Button Editor

This polish release keeps the simple mobile studio direction, tightens the Studio preview to a compact true 9:16 card, and improves the Button Studio with a large active button workspace plus a horizontal button selector. Public Link and Desktop renderers remain untouched.


## v52.2.3 – Visible Simple Studio Controls

Mobile-Studio-Sichtbarkeitsfix: Hauptmenü, Untermenü und großer Button werden direkt unter der kompakten 9:16-Vorschau sichtbar erzwungen. Public Link unverändert.

## v52.3 – Simple Card Builder

Mobile Studio reset toward a block-based editor inspired by digital business cards: compact 9:16 preview, then Video/Szene, Werbetext, Aktionen/Buttons, Design, Teilen/QR as clear editing blocks. Buttons appear as large editable action cards. Public Link and desktop remain unchanged.

## v52.4 – Tap-to-Edit Mobile Studio

Diese Version ersetzt den mobilen Simple Card Builder durch einen Tap-to-Edit-Ansatz:

- echte 9:16-Karte im mobilen Editor
- Szene, Text oder Buttons direkt auf der Karte antippen
- unten erscheint nur das passende helle Bedienfeld
- Szene mit Reel/Video, Bildhintergrund, Farbhintergrund, Darstellung und Endkarte
- Text mit Werbetext, Vorlage und einfacher Timeline
- Buttons mit großem Arbeitsbutton, Aktion, Ziel, Look und Design übertragen
- Design bleibt mobil bewusst reduziert und primär Desktop-Thema
- Public Link und Desktop bleiben unverändert

## v52.4.1 – Mobile Button Editor Polish

Fokus auf mobilen Button-Workflow: Auswahlreihe entfernt, Look-Bereich erweitert, Farbfelder ausgebaut, Buttongröße proportional skaliert und Vollbild-Speicheroverlay durch kleinen Hinweis ersetzt.
