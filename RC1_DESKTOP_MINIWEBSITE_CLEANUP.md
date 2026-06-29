# RC1.1 Desktop Miniwebseite Cleanup

Ziel: Die Desktop-Miniwebseite wird als eigener, stabiler Produktbereich behandelt, ohne die Mobile-Version zu verändern.

## Grundregel
Im Bereich **Meine ureelSeite** bleibt rechts immer derselbe Aufbau sichtbar:

1. oben die komplette Website-Vorschau mit allen drei Bereichen
2. darunter der aktive Editor

## Kanonische Editorstruktur
- **Webseite** enthält Bereich 1, Bereich 2 und Bereich 3.
- **Hintergrund** enthält Desktop-Hintergrund und Menü-Hintergrund.
- **Webseite starten** enthält Öffnen, Link kopieren, Teilen, QR und Kontakt.

Der alte Unterbereich **Text & Medien** ist nicht mehr als eigener Navigationspunkt vorgesehen. Bereich 3 liegt direkt unter **Webseite**.

## Mobile-Schutz
Diese RC1.1-Änderung darf nicht anfassen:

- App.tsx
- KonuCardCore.tsx
- ButtonRenderer.tsx
- mobileLayoutPersistence.ts
- buttonUtils.ts
- FirebaseContext.tsx

## Testcheckliste
- Meine ureelSeite öffnen
- Webseite anklicken: Vorschau bleibt oben, Bereich 1/2/3 erscheinen darunter
- Hintergrund anklicken: Vorschau bleibt oben, Hintergrundeditor erscheint darunter
- Webseite starten anklicken: Vorschau bleibt oben, Startaktionen erscheinen darunter
- Zurück aus dem Werbetexter führt zur Webseite-Konfiguration, nicht zu einem alten Text-&-Medien-Unterbereich
- Mobile: Szene, Text, Buttons kurz prüfen
