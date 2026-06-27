# ureel v52.5.43 – Desktop Onepager Three Section Foundation

Diese Version testet eine Desktop-only Onepager-Struktur aus einer fertigen 9:16-ureel-Karte. Mobile und Public-Mobile bleiben unverändert.

## Neu

- Desktop-Public-Ansicht ist in drei Bereiche gegliedert:
  1. Reel / 9:16 Video ohne Kartenbuttons
  2. separater Button-Aktionsbereich mit den echten Kartenbuttons
  3. gestaltbarer Inhaltsbereich mit Text sowie optionalem Bild-/Video-URL-Feld
- Die Kartenbuttons werden auf Desktop nicht mehr im Reel angezeigt, sondern daneben als Bedienbereich.
- Der Buttonbereich nutzt weiterhin die echten Buttondaten der Karte und ist auf maximal 6 Kartenbuttons begrenzt.
- Die mobile 9:16-Karte bleibt unverändert.
- Die große Buttoneditor-Vorschau bleibt unverändert.
- Desktop-Content kann aus dem Werbetext kommen oder als eigener Desktop-Text gespeichert werden.
- Optionaler Desktop-Medienblock über Bild-/Video-URL vorbereitet.

## Upload-Hinweis

ZIP bleibt ohne `dist/`, ohne `node_modules/` und ohne `RELEASE_NOTES_*.md`. Vercel baut aus `package.json`.
