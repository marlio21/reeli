# v52.1 – Three Ring Orbit Cockpit Foundation

Diese Version ist ein gezielter Mobile-Studio-Prototyp. Public Link, öffentliche Karte und Desktop sollen unverändert bleiben.

## Ziel

Das mobile Studio nutzt ein klareres Drei-Ring-Prinzip:

- Ring 1: Hauptmenü – Szene, Text, Buttons, Design
- Ring 2: Untermenü des gewählten Bereichs
- Ring 3: konkrete Einstellung / Werkzeug
- Mitte: aktiver Mini-Editor oder Vorschau
- Unten: helles Bedienfeld nur für große Listen oder längere Eingaben

## Änderungen

- Neues Three-Ring-Orbit-Cockpit für Mobile Studio.
- Hauptmenü-Ring wird nach Auswahl stark zurückgenommen.
- Aktiver Bereich bekommt mehr Platz und zeigt in der Mitte eine Mini-Vorschau.
- Buttonmodus zeigt den ausgewählten Button groß im Zentrum.
- Button-Untermenüs erweitert: Buttonliste, Text, Aktion, Icon, Look, Größe, Design übertragen.
- Text-Untermenüs erweitert: Inhalt, Vorlagen, Größe/Farbe, Timing, Animation.
- Einstellungsring ergänzt konkrete Optionen wie Telefon, Website, Datei, Titel, Untertitel, Beschreibung, Farbe, Form usw.
- Unteres Bedienfeld ist jetzt volle Bildschirmbreite, hell, kompakt und mit kurzer Erklärung.
- Schriftgrößen im Bedienfeld sind bewusst moderat: lesbar, aber nicht überdimensioniert.
- Design übertragen ist im Buttonmodus sichtbar vorbereitet.
- Große Listen bleiben unten scrollbar, während Vorschau und Orbit sichtbar bleiben.

## Testhinweise

Nach Upload auf Vercel am Smartphone öffnen mit:

```text
https://reeli-alpha.vercel.app/?v=521
```

Bitte prüfen:

1. Studio-Kreis öffnen.
2. Hauptmenü wählen, z. B. Buttons.
3. Hauptmenü-Ring soll fast verschwinden.
4. Ring 2 und Ring 3 sollen sichtbar und geordneter wirken.
5. In der Mitte soll bei Buttons der aktuelle Button größer erscheinen.
6. Unteres Bedienfeld soll volle Breite haben, hell sein und Erklärungstext zeigen.
7. Public Link erneut prüfen.

## Bekannte Einschränkung

In dieser Umgebung konnte kein vollständiger lokaler Build bestätigt werden, weil `vite`/Dependencies nicht installiert sind. Bitte Build über Vercel prüfen.
