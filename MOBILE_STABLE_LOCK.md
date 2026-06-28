# Mobile Stable Lock – v52.5.64

Dieser Stand behandelt die mobile Version als stabile Produktreferenz.

## Nicht ohne Mobile-Regressionstest ändern

- `App.tsx`
- `KonuCardCore.tsx`
- `ButtonRenderer.tsx`
- `buttonUtils.ts`
- `mobileLayoutPersistence.ts`
- `FirebaseContext.tsx`
- mobile/tap Editorbereiche in `UreelStudioShell.tsx`

## Desktop-Regel

Desktop darf dieselbe Logik nur anders anzeigen. Desktop soll bevorzugt in eigenen Shell-/CSS-Bereichen erweitert werden:

- `DesktopStudioShell.tsx`
- Desktop-spezifische Klassen unter `.ureel-desktop-studio-root`
- später: `DesktopPublicPage` / `DesktopLandingPage`

## Pflichttest vor Deployment

1. Mobile Szene öffnet korrekt.
2. Mobile Text öffnet mit Einstieg: Werbetext / Vorlagen / Rahmen & Stil / Timing.
3. Titel, Untertitel und Beschreibung sind editierbar.
4. Texthöhe bewegt sichtbar von 4% bis 88%.
5. Button Aktion / Weblink kann eingefügt werden.
6. Spot neu starten funktioniert.
7. Button Look auf alle übernimmt Design, aber nicht Text, Aktion oder Icon.
8. Public Link zeigt gleiche Button- und Textgrößen wie Editor.

## v52.5.64 Änderung

Nur Absicherung/Dokumentation plus Desktop-Buttonvorschau-Polish. Keine Änderung an mobiler Datenlogik.
