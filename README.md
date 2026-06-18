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
