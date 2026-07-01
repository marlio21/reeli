# Security Spec – v52.6.09 / RC3.2 Security Audit Safe

## Ziel

RC3.2 härtet sicherheitskritische Server- und Regelbereiche, ohne den stabilen RC3.1.2-Produktzustand zu gefährden.

## Bewusst nicht geändert

- Keine harte Umstellung von `/cards` auf `/publicCards`.
- Keine Änderung an Landingpage-Showcases.
- Keine Änderung am Mobile Studio.
- Keine Änderung am Public-View-Ladeweg.

## Server-Endpunkte

### `/api/process-video-job`

Erfordert jetzt:

- Firebase ID Token per `Authorization: Bearer ...` oder Body `idToken`.
- Karte muss existieren.
- Token-User muss `ownerId` der Karte sein oder Admin/Owner-Rolle besitzen.

### `/api/upload-file-fallback`

Erfordert jetzt:

- Firebase ID Token.
- `userId` muss mit Token-UID übereinstimmen.
- Karte muss dem User gehören oder User muss Admin/Owner sein.
- Typ muss in der Allowlist sein.
- MIME-Type nur Bild oder PDF.
- Dateigröße: Bilder max. 10 MB, PDF max. 20 MB.
- Dateinamen werden serverseitig bereinigt.
- `makePublic()` wird im Fallback nicht mehr aufgerufen.
- lokaler `/uploads`-Fallback nur mit `ENABLE_LOCAL_UPLOADS=true`.

## TestGate

Das alte Fallback-Passwort wurde entfernt. TestGate funktioniert nur noch, wenn `VITE_TEST_GATE_PASSWORD` explizit gesetzt ist.

## Storage Rules

`application/octet-stream` ist nicht mehr als Video erlaubt. Damit werden unklare Binärdateien nicht mehr als Video-Upload akzeptiert.

## Firestore Rules

- Legacy-Pläne `fun` und `enterprise` werden toleriert, damit alte Nutzerprofile nicht blockieren.
- Reports validieren Status, Grund, Message-Länge und Card-ID.
- Globale Analytics-Events validieren Card-ID, Event-Type und CreatedAt.
- Bestehender Public-Card-Leseweg bleibt unverändert, um keine Landing-/Public-Regression zu verursachen.

## Offene Security-Migration

Für eine spätere Beta-Härtung bleibt empfohlen:

```text
/cards/{cardId} privat
/publicCards/{slug} öffentliche reduzierte Kopie
Migration und Backfill vor harter Umstellung
```

Diese Migration darf erst nach separatem Test-Sprint aktiviert werden.
