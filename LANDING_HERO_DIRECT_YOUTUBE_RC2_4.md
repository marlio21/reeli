# v52.5.97 / RC2.4 – Landing Hero Direct YouTube

## Ziel
Die Hero-Showcase-Vorschau nutzt nun direkte YouTube-Shorts-Links für die wichtigsten Beispiele, damit das Video schneller und zuverlässiger sichtbar wird als über die indirekte Public-Card/Firestore-Auflösung.

## Änderungen
- Direkte YouTube-Links für Studentin, Unternehmensberaterin, Automarke, Tischlerei, Rednerpult und Reisebüro in der Landingpage-Konfiguration ergänzt.
- YouTube-Thumbnail wird als Fallback-Hintergrund angezeigt, damit kein kurzer schwarzer/leer wirkender Ladezustand entsteht.
- Wechselintervall etwas beruhigt, damit YouTube-Embeds mehr Zeit zum Laden haben.
- Galerie-Links öffnen weiterhin die echten Public-Ureel-Seiten.
- Keine Videos oder Bilder in der ZIP gespeichert.
- Mobile Studio nicht verändert.

## Hinweis
YouTube-Embeds können je nach Browser/Netzwerk weiterhin leicht verzögert starten. Für eine spätere Premium-Lösung empfiehlt sich ein eigener Video-Upload mit komprimierten kurzen Preview-Clips in Firebase Storage.
