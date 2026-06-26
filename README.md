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
