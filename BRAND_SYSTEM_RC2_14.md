# RC2.14 Brand System

Ziel dieser Version: Markenname, Domain, Claim und zentrale Landingpage-CTA werden nicht mehr hart an vielen Stellen gepflegt, sondern über eine zentrale Brand-Konfiguration vorbereitet.

## Neue Datei

`src/brand/brandConfig.ts`

Darin stehen aktuell:

- `name`: UREEL
- `domain`: ureel.me
- `appDomain`: app.ureel.me
- `studioDomain`: studio.ureel.me
- `supportEmail`: office@ureel.me
- Claim DE/EN
- primärer Landingpage-CTA DE/EN

## Zweck

Ein späterer Markenwechsel, z. B. auf einen anderen Namen oder eine andere Domain, kann an einer zentralen Stelle vorbereitet werden.

## Landingpage

Die Landingpage wurde sprachlich neutraler formuliert:

- weniger feste Begriffe wie „UREELER“
- mehr Fokus auf „Präsentation“, „Begegnung“, „Aktion“ und „kostenlos starten“
- Markenname wird im Header aus der Brand-Konfiguration gelesen

## Mobile-Schutz

Mobile Studio, Public Mobile Renderer und Button-Logik wurden nicht verändert.
