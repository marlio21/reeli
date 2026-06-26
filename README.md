# ureel v52.5.37 – Larger Card Buttons & Public Action Bar Fix

Diese Version baut auf v52.5.36 auf: Die kleine 9:16-Vorschau bleibt eine proportionale Public-Karten-Surface, aber die Kartenbuttons werden etwas größer und unten entsteht eine klare 3er-Systemleiste.

## Fokus
- Buttoneditor groß bleibt unverändert.
- Karten-/Public-Buttongrößen: Klein 56px, Normal 68px, Groß 80px, Sehr groß 100px.
- Canonical Mobile Layout erlaubt jetzt bis 100px, damit „Sehr groß“ wirklich gespeichert und in Public angezeigt wird.
- Button-Dock in der Karte sitzt höher, damit unten Platz bleibt.
- Untere Systemleiste ist jetzt kompakt mit drei Aktionen: QR-Code, Teilen, Erstellen.
- Debug bleibt aus und erscheint nur noch mit `?debugLayout=force`.
- ZIP bleibt ohne `dist`, ohne `node_modules`, ohne `RELEASE_NOTES`.

## Hinweis
Nach Deployment bitte im Mobile-Editor einmal Buttongröße neu wählen, damit Firestore die v52.5.37-Größenwerte schreibt.

# ureel v52.5.36 – Card Preview Scale Parity Fix

Diese Version trennt nicht den großen Buttoneditor, sondern korrigiert das kleine 9:16-Vorschaufenster: Es rendert nun über dieselbe Unified-Mobile-Surface wie Public, damit Buttons nicht mehr separat falsch skaliert werden.

## Fokus
- Buttoneditor groß bleibt unverändert.
- Kleine Studio-/Mobile-Kartenvorschau nutzt wieder die echte 390×693 Public-Surface.
- Public-Buttongrößen dürfen wieder bis 88px gehen.
- Preview skaliert die ganze Karte proportional, statt Buttonwerte einzeln zu verkleinern.
- Optionaler First-Frame/Fallback im Surface gegen leere Ladefläche vor dem Video.

## Hinweis
Nach Deployment bitte im Mobile-Editor einmal Buttongröße neu wählen, damit Firestore die v52.5.36-Größenwerte schreibt.
