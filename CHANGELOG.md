# CHANGELOG

## v52.4.7 – Text Template Editor & Preview Button Fix

- Mobile Kartenvorschau: echte Buttons stoppen jetzt das Vorschau-Klick-Event und öffnen direkt den Buttoneditor.
- Buttonraster: legitime Text-/Timeline-Buttons werden nicht mehr aus der Vorschau gefiltert; die ersten sechs Buttons bleiben als 3×2-Startfläche sichtbar.
- Kartenvorschau: „Video erneut ansehen“ wurde durch „Spot neu starten“ ersetzt.
- Buttoneditor: Icon-Bibliothek nochmals erweitert und direkt in der mobilen Auswahl verfügbar gemacht.
- Werbetext-Editor: mobile Werbetext-Vorschau oben ergänzt, inklusive Hinweis „Wische für Vorlage“.
- Werbetext-Vorlagen: mindestens 15 Vorlagen im horizontalen Swipe-Streifen verfügbar.
- Werbetext-Stil: Titel, Untertitel und Beschreibung mit Größe, Farbe, Schrift und einfacher Position bearbeitbar.
- Timing: Titel, Untertitel, Beschreibung, Buttons und Profilbild bekommen mobile Schieberegler.
- Timing-Länge: Slider-Maximum richtet sich jetzt nach Video-/Spotlänge statt starrem 12–15s-Fenster.
- Public Link, Desktop, Kartenverwaltung und Nutzerverwaltung unverändert.

## v52.4.6 – Mobile Card Preview & Profile/Icon Polish

- Profilbild-Größen im Mobile Studio auf relative Kartenbreite gesetzt: Klein 15 %, Normal 35 %, Groß 55 %, Sehr groß 80 %.
- Profilbild-Formen stabilisiert: Kreis, Rund und Eckig werden an den Kartenrenderer weitergegeben.
- Profilbild liegt über Reel/Video, sobald es aktiv ist und ein Bild vorhanden ist.
- Mobile Icon-Bibliothek für Buttons deutlich erweitert: Kontakt, Social, Dateien, Business, Medien, Aktion, Shopping und Info.
- Icon-Auswahl visuell größer dargestellt.
- Icon-Größen im Button-Editor erweitert: Klein, Normal, Groß, Sehr groß.
- Szene > Reel / Video: „Vorschau starten“ entfernt, weil die Karte selbst die Vorschau ist.
- Public Link, Desktop und Karten-/Nutzerverwaltung unverändert.

## Hinweis

Ab v52.4.6 soll dieses CHANGELOG fortgeführt werden, statt für jede Version neue einzelne Release-Notes-Dateien im Hauptordner anzulegen.

## v52.4.8 – Compact Upload, Text Editor Fix & Security Stabilization

- Compact GitHub upload package: old root-level `RELEASE_NOTES_*.md` files removed from the ZIP; `CHANGELOG.md` remains the single version history file.
- Mobile card editor only: card management, user management, desktop and public link are intentionally left untouched.
- Profile image visibility repaired in clean mobile preview: appears only when enabled by the user and a real image/logo exists, including over Reel/video scenes.
- Text tap target enlarged: tapping the text area in the 9:16 card opens the mobile text editor with the template strip first.
- Mobile text editor keeps ad-copy preview, swipeable templates, style controls and video/spot-length-based timing sliders.
- Button icon library is now grouped visibly by category in the mobile button editor.
- Button management position picker now counts the real visible card buttons and labels the real amount.
- New starter card copy polished for a cleaner first impression.
- Production build verified locally after the changes.
