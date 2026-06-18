# v52.0 – Mobile Orbit Bottom Sheet Prototype

## Ziel

Diese Version startet den neuen mobilen Studio-Modus als Prototyp. Die öffentliche Live-Karte bleibt unverändert.

## Konzept

- Die Vorschau ist auf Mobile die Bühne.
- Unten liegt ein kleiner Studio-Mittelpunkt.
- Tippen auf den Mittelpunkt öffnet das transparente Orbit-Hauptmenü.
- Szene steht als Segment oben/12 Uhr.
- Buttons stehen rechts, Design unten, Text links.
- Nach Auswahl einer Hauptkategorie fährt ein Bottom-Sheet von unten hoch.
- Im Bottom-Sheet liegen die Untermenüs als Teilring-/Ringsegment-Leiste, nicht als Pills.
- Der Button „● Vorschau frei“ fährt das Bedienfeld herunter und zeigt die Vorschau frei.

## Enthalten

1. Mobile Orbit-Steuerung über der Studio-Vorschau.
2. Mobile Hauptnavigation wird auf Smartphone durch den Orbit ersetzt.
3. Mobile Subnavigation wird auf Smartphone durch Ringsegmente im Bottom-Sheet ersetzt.
4. Detailpanel wird auf Mobile zum festen Bottom-Sheet mit begrenzter Höhe.
5. Nur der Inhalt im Bottom-Sheet scrollt; die Vorschau bleibt sichtbar.
6. Öffentliche Karte / Public Link wurde nicht verändert.

## Noch bewusst offen

- Buttoneditor-Cockpit mit Button in der Mitte ist noch nicht vollständig gebaut.
- Timeline/Text-Cockpit ist noch nicht vollständig gebaut.
- Eigene ureel-Icons sind noch nicht integriert.
- Gesten wie langes Drücken, Doppeltippen oder Wischen sind noch nicht eingebaut.

## Empfohlener Test

1. Am Smartphone öffnen: `https://reeli-alpha.vercel.app/?v=520`
2. Prüfen, ob nur die Vorschau mit Studio-Kreis erscheint.
3. Studio-Kreis tippen.
4. Szene / Text / Buttons / Design auswählen.
5. Prüfen, ob Bottom-Sheet von unten hochfährt.
6. Untermenüs als Ringsegmente testen.
7. „● Vorschau frei“ tippen und prüfen, ob die Vorschau frei wird.
8. Public Live-Link erneut prüfen.

## Nächster sinnvoller Schritt

v52.1 – Button Cockpit Prototype

Ziel: Im Buttoneditor ein eigenes Bediencockpit bauen:
- aktueller Button in der Mitte
- Konfigurationsbereiche außen herum
- Buttonliste als scrollbarer Bereich im Sheet
- Design in kleinere Gruppen teilen
