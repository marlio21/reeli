# RC3.3 – Landing Stable & Release Candidate

Basis: v52.6.09 / RC3.2.3.

Ziel dieser Version ist Stabilisierung, nicht neue Funktionen.

## Änderungen

- Showcase-Karten auf der Landingpage öffnen wieder zuverlässig die echten Public Views.
- Jede Showcase-Karte ist ein echter Link (`<a href="/u/...">`).
- Die eingebettete Preview bleibt rein visuell und blockiert keine Navigation.
- Public View bleibt kompatibel mit vorhandenen Karten; keine harte Migration auf `/publicCards` in der Landingpage.
- Mobile Studio wurde nicht verändert.

## Regel ab RC3.3

Keine Version darf gleichzeitig UI, Security und Datenarchitektur verändern.
Security-Migrationen werden künftig isoliert und parallel vorbereitet.
