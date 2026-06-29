# RC1.2 Public & Miniwebseite Actions Check – v52.5.92

Ziel: Desktop-Miniwebseite prüfen, ohne Mobile-Code zu verändern.

## Geänderte Bereiche
- Desktop Studio Preview: Aktionsbuttons im Miniwebseiten-Monitor sind testbar.
- Desktop Studio Preview: QR, Teilen und Kontakt nutzen dieselben Start-Aktionen wie „Webseite starten“.
- Public Desktop Renderer bleibt gemeinsame Anzeige für Studio-Vorschau und Besucheransicht.

## Testliste
1. Meine ureelSeite öffnen.
2. Website-Monitor prüfen: Karte, Menü und Inhalt sichtbar.
3. Button im Menü anklicken: Aktion startet oder meldet fehlende Aktion.
4. QR anklicken: QR-Modal öffnet sich.
5. Teilen anklicken: Share-Sheet oder Link-Fallback.
6. Kontakt anklicken: VCF-Datei wird erstellt.
7. Mobile Studio kurz prüfen: Szene, Text, Buttons unverändert.
