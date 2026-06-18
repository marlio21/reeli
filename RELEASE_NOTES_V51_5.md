# v51.5 – Mobile Studio Usability Cleanup

## Ziel

Diese Version verbessert gezielt die Bedienbarkeit des mobilen Studios. Die öffentliche ureel-Karte / der kopierte Live-Link bleibt unverändert, weil diese Ansicht bereits sauber und hochwertig funktioniert.

## Geändert

1. Mobile Studio-Vorschau besser lesbar gemacht.
   - Smartphone-Preview auf kleinen Bildschirmen vergrößert.
   - Rahmen reduziert, damit Werbetext und Buttons weniger gequetscht wirken.
   - Vorschaufläche visuell ruhiger gestaltet.

2. Mobile Hauptnavigation verbessert.
   - Modul-Tabs bekommen mehr Touch-Fläche.
   - Textlabels werden größer dargestellt.
   - Zusatzicons rechts werden mobil ausgeblendet, damit mehr Platz für Szene / Timeline / Buttons / Design bleibt.

3. Mobiles Modul-/Untermenü lesbarer gemacht.
   - Szenen-Studio, Buttonbereiche und Untermenü-Karten erscheinen mobil heller.
   - Schrift- und Rahmenkontraste verbessert.
   - Touch-Flächen für Unterpunkte vergrößert.

4. Mobile Detailformulare verbessert.
   - Eingabefelder und Buttons bekommen mehr Höhe.
   - Schriftgrößen werden mobil angehoben.

## Nicht geändert

- Öffentlicher Live-Link
- PublicMobileCardRenderer
- PublicDesktopPageRenderer
- KonuCardCore Kartenlogik
- Video-/Endkarten-Ablauf
- Button-Datenmodell
- Neue Features

## Risiko

Niedrig bis moderat. Die Änderungen sind überwiegend CSS-/Layout-Verbesserungen für den mobilen Editor. Die öffentliche Karte soll unverändert bleiben.

## Nach dem Upload testen

1. Studio am Smartphone öffnen.
2. Obere Navigation prüfen: Szene / Timeline / Buttons / Design.
3. Vorschau prüfen: Werbetext darf weniger gequetscht wirken.
4. Szenen-Studio prüfen: Video / Bild / Farbe / Darstellung / Endkarte müssen lesbarer sein.
5. Buttoneditor prüfen: Buttontexte und Beschriftungen müssen besser erkennbar sein.
6. Öffentlichen kopierten Link erneut öffnen: Die gute öffentliche Karte muss unverändert bleiben.
