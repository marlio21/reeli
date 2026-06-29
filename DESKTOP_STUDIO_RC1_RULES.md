# RC1 Desktop Studio Rules

Diese Version startet den sichtbaren RC1-Cleanup des Desktop Studios.

## Geschützte Bereiche

Nicht verändert werden dürfen ohne Regressionstest:

- Mobile Studio Shell / Orbit
- `KonuCardCore.tsx`
- `ButtonRenderer.tsx`
- `mobileLayoutPersistence.ts`
- Firebase Hydration / Public Renderer

## Desktop-Regeln

1. Hauptbereiche: Szene, Text, Buttons, Meine ureelSeite.
2. Mitte: immer Auswahlkarten.
3. Rechts: immer aktiver Editor, bei Meine ureelSeite immer mit Webseiten-Vorschau oben.
4. Auswahlkarten haben immer: Icon, Titel, Erklärung, Pfeil.
5. Titel und Erklärung dürfen nicht zusammenlaufen.
6. AN/AUS-Elemente, Action-Buttons und Auswahlkarten sollen einheitlich wirken.

## RC1-Test

- Szene: Video, Bild/Poster, Farbe, Darstellung, Endkarte, Profilbild.
- Text: Werbetext, Vorlagen, Rahmen & Stil, Timing.
- Buttons: Text, Aktion, Look, Verwalten.
- Meine ureelSeite: Webseite, Hintergrund, Webseite starten.
- Mobile: Text, Szene, Buttons und Public Link kurz prüfen.
