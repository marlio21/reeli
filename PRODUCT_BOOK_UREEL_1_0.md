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

## RC3.2 – Security Audit Safe

RC3.2 wird nach dem RC3.1.2-Stabilitätsstand bewusst nicht als großer Architekturumbau umgesetzt. Die harte Umstellung von öffentlichen Karten auf eine neue `/publicCards`-Quelle wird nicht erneut aktiviert, solange keine getestete Migration existiert.

### Grundsatz

```text
Stabilität zuerst.
Security schrittweise härten.
Keine Landingpage- oder Mobile-Studio-Regression.
```

### Umgesetzter Safe-Scope

- Authentifizierung für Video-Processing-Start.
- Owner/Admin-Prüfung für serverseitige Upload- und Processing-Endpunkte.
- Entfernen des alten TestGate-Fallback-Passworts.
- kleinere Server-Body-Limits mit Environment-Konfiguration.
- strengere Upload-Fallback-Prüfung für Typ, MIME, Größe und Dateiname.
- lokaler Upload-Fallback standardmäßig aus.
- keine Änderung an `/u/:slug`, `/share/:slug`, Landing-Showcases oder Mobile Studio.

### Nicht umgesetzt in RC3.2

```text
Keine harte /publicCards-Migration.
Keine Änderung des Public-View-Ladewegs.
Keine Neustrukturierung der Landingpage.
Keine Änderung an Mobile Renderer oder Mobile Studio.
```

Die PublicCards-Architektur bleibt für einen separaten, getesteten Migrationssprint vorgesehen.

---

## RC3.3 – Public Performance Polish

Nach RC3.2 bleibt die stabile Produktbasis erhalten. RC3.3 verändert keine Sicherheitsarchitektur und keine Mobile-Studio-Logik, sondern verbessert die wahrgenommene Geschwindigkeit der öffentlichen Darstellung.

### Ziel

```text
Public View wirkt sofort sichtbar.
Video lädt danach.
Landingpage lädt Showcases kontrolliert.
Kein schwarzer oder leerer Zwischenzustand.
```

### Technische Linie

- `/u/:slug` und `/share/:slug` behalten den stabilen Ladeweg aus RC3.2 Safe.
- Public Pages laden Karten einmalig und halten keine dauerhaften Firestore-Realtime-Listener mehr offen.
- Realtime für Public ist nur noch als Diagnosemodus mit `?live=1` verfügbar.
- Public Loading zeigt ein hochwertiges Smartphone-Skeleton, damit Nutzer sofort ein visuelles Ergebnis sehen.
- Landing-Hero zeigt keine vollständige eingebettete Public-App mehr, sondern eine leichte Showcase-Preview mit echtem Link.
- Showcase-Iframes werden erst nach Sichtbarkeit und mit Verzögerung geladen.
- Videos laden in Public-/Landing-Kontexten weniger aggressiv; Studio/Editor-Preview bleibt unverändert.

### Schutzregel

```text
Mobile Studio nicht anfassen.
Share-System nicht neu bauen.
Landingpage nicht neu erfinden.
Nur Ladeverhalten verbessern.
```
