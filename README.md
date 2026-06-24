# ureel.me v52.5.8

Mobile Button Tile Parity, Text Background Toggle & Account Scroll Fix.

- Änderungen bewusst auf die Mobile-Version / mobile 9:16-Karte begrenzt.
- Beschreibungstext-Problem geklärt und repariert: Der mobile Werbetexteditor nutzte bisher andere, zu große Text-Caps als die echte Vorschaukarte. Dadurch wurde die Beschreibung in der Editor-Vorschau abgeschnitten, obwohl sie in der echten Karte sichtbar war.
- Werbetext-Vorschaueditor nutzt jetzt kompaktere mobile Vorschaugrößen, damit Titel, Untertitel und Beschreibung gemeinsam sichtbar bleiben.
- Design-Hintergrund AN/AUS speichert jetzt `box.enabled` sauber im Texttemplate und überschreibt auch template-spezifische CSS-Hintergründe.
- Button-Tiles in der mobilen 9:16-Vorschau werden feiner skaliert: Icon und Text werden nicht mehr klobig aufgeblasen.
- Buttoneditor-Mittelvorschau nutzt eine vergrößerte echte mobile Kachel statt einer anders berechneten Buttondarstellung.
- Nutzerverwaltung/Konto ist mobil scrollbar.
- Desktop, Public Link und Profilbild wurden nicht bewusst umgebaut.
