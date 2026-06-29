# v52.5.72 Diagnose

## Problem 1: Mittelspalten-Texte
Die bisherigen Fixes griffen nur teilweise, weil nur die Szene-Karten die Klasse `ureel-desktop-subnav-card` verwendeten. Text-, Button- und Design-Karten nutzten weiterhin alte Tailwind-Flex-Klassen. Dadurch liefen Titel und Beschreibung weiter zusammen.

Fix: alle Desktop-Subnav-Karten nutzen jetzt dieselbe Struktur: Icon, Textblock, Pfeil. Titel und Beschreibung erhalten zusätzlich Inline-Fallbacks.

## Problem 2: zitternder Cursor im Werbetext
Im Tap-/Desktop-Werbetextpanel wurden Titel und Untertitel direkt mit `syncCardUpdate` bei jedem Tastendruck gespeichert. Das kann Persistenz, Hydration und Re-Render auslösen und den Cursor springen lassen.

Fix: Eingaben laufen in lokalen `textDraft`; gespeichert wird erst bei `onBlur` über `flushTextDraft`.

## Mobile-Schutz
Keine Änderungen an Mobile Stable Lock, gemeinsamer Persistence oder Public Renderer.
