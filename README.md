# ureel.me v52.5.9

Mobile Button Font Control & Text Animation Parity Fix.

- Änderungen bewusst auf die Mobile-Version / mobile 9:16-Karte begrenzt.
- Mobile Button-Schriftarten erweitert: Klar, Rund, Elegant, Modern und Mono.
- Schriftart- und Schriftgewicht-Schalter im mobilen Buttoneditor normalisiert, damit nicht mehrere Schriftarten gleichzeitig aktiv wirken.
- Schriftgewicht Normal/Fett wird jetzt sauber als Buttondaten gespeichert und vom mobilen Kartenrenderer gelesen.
- Mobile Kartenbuttons erhalten neue Text-Proportionen: Klein bleibt wirklich klein, Groß/Sehr groß bleiben sauber im Button und kurze Labels wie Telefon/Mail werden nicht mehr unnötig getrennt.
- Icongrößen in echten mobilen Kartentiles wurden etwas entschärft, damit Icons nicht klobig wirken.
- Look-Tab übernimmt Text-/Font-/Gewichtsdaten beim Design-Übertragen mit, damit die schöne Buttonvorschau nicht von der echten Karte abweicht.
- Werbetext-Animation im Editor zeigt jetzt die finale konfigurierte Textposition/Größe, statt durch Slide/Scale/Reveal kurz anders auszusehen.
- Dunkler Text in der mobilen Werbetext-Vorschau wird auf dunklen Flächen lesbarer gemacht.
- Desktop, Public Link und Profilbild wurden nicht bewusst umgebaut.

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
