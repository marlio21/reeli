
## v52.6.09 / RC3.2.2 – Landing Showcase Safety Fix

- Landingpage-Showcase-Karten als gebündelte Demo/Public-Karten abgesichert, damit die Startseite nach dem `/publicCards` Security-Hardening nicht von alten Firestore-Dokumenten abhängig ist.
- `getCardBySlug` erkennt jetzt alle gebündelten Demo-Karten über `DEMO_CARDS[slug]` statt nur drei feste Demo-Slugs.
- Die bekannten Startseiten-Slugs `dein-angebot-sofort-klickbar`, `dein-angebot-sofort-klickbar-6`, `dein-angebot-sofort-klickbar-4` und `your-offer-instantly-clickable` bleiben dadurch direkt unter `/u/...` und in Landing-Iframes funktionsfähig.
- Keine Lockerung der Firestore- oder Storage-Sicherheitsregeln; Mobile Studio bleibt unverändert.

# Ureel Product Book 1.0

## Vision

**Aus Video wird Aktion.**

Ureel verwandelt ein Video, Bild oder Reel in eine interaktive Karte und auf Desktop optional in eine Miniwebseite. Besucher sollen nicht nur zusehen, sondern sofort handeln können: anrufen, schreiben, buchen, kaufen, herunterladen, teilen oder eine Webseite öffnen.

## Produktkern

Ureel besteht aus vier Produktbereichen:

1. **Studio** – Ersteller bauen und bearbeiten ihre ureel-Karten.
2. **Interaktive Karte** – Mobile 9:16 Public View mit Video/Bild, Werbetext und Buttons.
3. **Meine Ureel Seite** – Desktop-Miniwebseite aus Karte, Menü und Contentbereich.
4. **Administration** – später Landingpage, Showcase-Karten, Nutzer, Rollen, Analytics und Preise.

## Zielgruppen

### Privat
Bewerbungen, Hochzeiten, Geburtstage, Portfolios, Reisen und persönliche Linksammlungen.

### Unternehmen
Restaurants, Hotels, Immobilien, Handwerk, Ärzte, Friseure, Händler, Berater, Coaches und Agenturen.

### Vereine
Mitgliedschaft, Kalender, Spenden, Veranstaltungen, Ansprechpartner, Downloads und Videos.

### Schulen und Bildung
Tag der offenen Tür, Anmeldung, Schwerpunkte, Downloads, Videos, Team und Kontakt.

### Gemeinden und Tourismus
Sehenswürdigkeiten, Veranstaltungen, Bürgerservice, Formulare, Routen und Angebote.

## Was Ureel anders macht

- Ein Reel bleibt nicht nur ein Reel, sondern wird zur interaktiven Aktionsseite.
- Eine Karte ist die zentrale Quelle für Mobile, Desktop, QR, Public Link und Landingpage.
- Die mobile Darstellung bleibt eine einfache 9:16 Karte.
- Die Desktop-Darstellung kann zusätzlich eine Miniwebseite sein.
- Nutzer brauchen keine Programmierkenntnisse.
- Änderungen an einer Karte wirken überall dort, wo diese Karte verwendet wird.

## Architekturregeln

### Mobile bleibt geschützt
Die mobile Version ist die stabile Referenz. Desktop-Änderungen dürfen Mobile nicht beschädigen.

Nicht ohne Regressionstest ändern:

- `App.tsx`
- `KonuCardCore.tsx`
- `ButtonRenderer.tsx`
- `mobileLayoutPersistence.ts`
- `buttonUtils.ts`
- `FirebaseContext.tsx`

### Desktop bekommt eigene Shells
Desktop darf anders angeordnet sein, aber keine zweite Datenlogik besitzen.

Erlaubte Desktop-Arbeit:

- `UreelStudioShell.tsx`
- Desktop-spezifische CSS-Regeln
- Desktop-Miniwebseite
- Public Desktop Renderer
- Desktop-i18n

### Eine Quelle pro Wert
Buttongrößen, Textposition, Buttonlook, Public Layout und Miniwebseitenwerte müssen kanonisch gespeichert und von Editor/Public gleich gelesen werden.

## Desktop Studio Regeln für RC1

Jeder Hauptbereich folgt demselben Muster:

1. Oben globale Aktionen.
2. Links 9:16 Livekarte.
3. Mitte Auswahlkarten.
4. Rechts aktiver Editor.
5. Bei „Meine Ureel Seite“ rechts immer oben die komplette Desktop-Webseitenvorschau und darunter der aktive Editor.

Hauptbereiche:

- Szene
- Text
- Buttons
- Meine Ureel Seite

## Designsystem-Regeln

### Auswahlkarten
Alle Auswahlkarten haben dieselbe Struktur:

- Icon
- Titel
- Erklärung darunter
- klare aktive Markierung
- keine zusammenlaufenden Texte

### AN/AUS
Alle booleschen Funktionen verwenden denselben AN/AUS-Stil.

### Aktionsbuttons
Große Aktionen wie „Webseite starten“, „Look auf alle Buttons übertragen“ oder „Neue Karte“ sind als echte Buttons sichtbar, nicht als Textzeilen.

### Vorschauen
Vorschaufenster sind keine technischen Debugflächen. Sie sollen immer wie ein kleiner Monitor wirken.

## Landingpage-Regel

Die öffentliche Startseite soll später echte Live-Showcase-Karten laden, keine statischen Screenshots.

Beispiel:

- Restaurant → Karten-ID
- Hotel → Karten-ID
- Immobilien → Karten-ID
- Schule → Karten-ID
- Verein → Karten-ID

Ändert der Administrator die Karte, aktualisiert sich die Landingpage automatisch.

## Release Candidate Plan

### RC1 – Desktop Studio fertigstellen
Desktop-Struktur, Designsystem, Miniwebseiten-Editor, konsistente Vorschauen.

### RC2 – Public Views stabilisieren
Mobile Public und Desktop Public exakt testen.

### RC3 – Landingpage
Startseite mit Live-Showcase-Karten.

### RC4 – Mehrsprachigkeit
DE/EN zuverlässig im Desktop-Studio und später Public.

### RC5 – Browser- und Gerätetests
Safari, Chrome, Edge, Firefox, iPhone, Android.

### RC6 – Beta
20–50 Testnutzer, Feedback und Fehlerliste.

## Launch-Leitsatz

**Ureel macht aus Aufmerksamkeit direkte Handlung.**

---

## v52.6.08 / RC3.1 – Premium Share System

### Umsetzung

Der Teilenmodus erhält eine eigene öffentliche Seite unter `/share/:slug`. Diese Seite ist der Distributions-Layer für Social Media, QR, NFC und E-Mail. Die echte interaktive Karte bleibt unter `/u/:slug` und wird nicht mit Marketing-Elementen überladen.

### Visuelle Regel

Für die Share-Fallbacks wird bewusst kein dauerhaftes App-Branding in den Bildern verwendet. Da der Produktname später zentral wechselbar bleiben soll, tragen die Fallback-Grafiken primär den Leitsatz:

**Aus Video wird Aktion.**

### Share-Assets

- `public/brand/ureel-share-og.png` – 1200×630 für Open Graph, WhatsApp, LinkedIn und Facebook.
- `public/brand/ureel-story-template.png` – 1080×1920 für Instagram Story und WhatsApp Status.

### Link-Strategie

```text
/share/...  = hochwertiger Teilenmodus mit Vorschau, Kanälen, QR und CTA
/u/...      = direkte interaktive Karte
```

### Kanal-Strategie

- WhatsApp, LinkedIn, Facebook und E-Mail teilen bevorzugt `/share/:slug`.
- QR-Code und NFC öffnen direkt `/u/:slug`.
- Instagram Story und WhatsApp Status verwenden ein eigenes Story-Bild mit QR-Code.

### Schutzregel

Mobile Studio, Mobile Renderer und Mobile Layout Persistence bleiben unangetastet.

### RC3.1.1 – WhatsApp Preview Stabilisierung

Nach dem ersten Live-Test zeigten LinkedIn und Facebook das Premium-Share-Bild korrekt an. WhatsApp zeigte zwar Titel, Beschreibung und Domain, aber kein Vorschaubild. Ursache: WhatsApp ist bei Open-Graph-Bildern strenger und benötigt besonders zuverlässig absolute, öffentlich erreichbare HTTPS-Bild-URLs.

Für RC3.1.1 gilt deshalb:

```text
Social Preview Bild: absolute HTTPS-URL
Standard-Domain: https://www.ureel.me
Kein temporärer Vercel-Preview-Link im geteilten Share-Link
Kein App-Name im Social-Titel erzwingen
```

Damit bleibt das Brand-System zukunftssicher: Der visuelle Fallback zeigt nur den Slogan und das Nutzenversprechen, während der Name später zentral gewechselt werden kann.


## RC3.1.2 – LinkedIn Large Preview Polish

LinkedIn behandelt Link-Vorschauen nicht immer wie Facebook. Eine Open-Graph-Vorschau kann trotz korrektem Bild kleiner dargestellt werden, weil LinkedIn die Feed-Darstellung selbst steuert.

Für RC3.1.2 gilt deshalb eine Doppelstrategie:

```text
Link Preview = /share/... mit 1200×627 Open-Graph-Bild
Großer LinkedIn-Beitrag = Bild direkt in LinkedIn hochladen + Link/Text aus Share Modal einfügen
```

Das Share Modal enthält dafür eine eigene Aktion „LinkedIn großes Bild“. Diese lädt das optimierte 1200×627-Bild und kopiert den passenden Beitragstext. So bleibt die normale Social Preview erhalten, aber für wichtige Beiträge gibt es eine große, visuelle LinkedIn-Variante.

Mobile Studio bleibt unverändert.

---

## RC3.2 – Phase 1 Security Hardening

### Ziel

Vor Beta darf niemand fremde Karten, private Medien oder Nutzerdaten lesen, ändern oder löschen. RC3.2 trennt deshalb private Studio-Daten stärker von öffentlichen Public-/Share-Daten.

### Datenmodell-Regel

```text
/cards/{cardId}       = private Studio-/Owner-Daten
/publicCards/{slug}   = veröffentlichte Public-/Share-Kopie
```

Die öffentliche UREEL und die Share-Seite dürfen nicht mehr anonym direkt aus der privaten `cards` Collection geladen werden. Alte veröffentlichte Karten werden über eine serverseitig gefilterte Public-API weiterhin kompatibel ausgeliefert.

### Sicherheitsregeln

- Firestore `cards` ist nur noch für Owner/Admin lesbar.
- Öffentliche Karten werden über `publicCards` ausgeliefert.
- Analytics sind create-only und payload-validiert.
- Storage liest Medien öffentlich nur noch bei veröffentlichter, öffentlicher Karte.
- Video-MIME-Fallback `application/octet-stream` wurde entfernt.

### Server APIs

- Video Processing benötigt Firebase ID Token und Owner/Admin-Prüfung.
- Upload-Fallback prüft Token, Ownership, Upload-Typ, MIME-Type, Dateigröße und Dateinamen.

### Performance-Nebene

Public und Share Views laden öffentliche Kartendaten einmalig. Realtime Listener bleiben Studio/Admin vorbehalten.

### Schutzregel

Mobile Studio und Mobile Layout Persistence wurden nicht verändert.

---

## RC3.2.1 – Security Hardening Safety Fix

RC3.2.1 closes the most important safety gaps discovered after the first Phase-1 hardening pass.

The public data model remains:

```text
/cards/{cardId}       = private Studio data
/publicCards/{slug}   = public/share data
```

But the public copy is now safer: sensitive password, token and internal fields are removed before the card is published to `publicCards`. The legacy public API applies the same redaction for older cards that do not yet have a public copy.

For compatibility, old published cards without a `visibility` field should still be able to load their media. Older user profiles with legacy plan values should not be unnecessarily blocked during login or profile updates.

Media access is now more consistent with the new rules: optimized videos and thumbnails are no longer explicitly made public by the server. Public availability should come from the card being published, not from permanent public file flags.

The local `/uploads` fallback is disabled by default for beta safety, because it bypasses Firestore/Storage authorization. It may only be enabled intentionally in controlled local/dev environments.

Mobile Studio and mobile layout persistence remain protected and unchanged.


## v52.6.09 / RC3.2.3 – Landing Showcase Open Fix

- Landingpage-Showcase-Karten sind jetzt als ganze Kartenflächen klickbar.
- Public-Preview-Iframes fangen Klicks nicht mehr ab, damit die Landing-Karten zuverlässig zur echten `/u/...` Public View öffnen.
- Die gelben Pfeil-Buttons nutzen die interne SPA-Navigation statt einen unsicheren Browser-Reload.
- Security Hardening aus RC3.2.1/RC3.2.2 bleibt unverändert; Mobile Studio bleibt unverändert.
