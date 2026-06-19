# v52.1.1 – Single Orbit Step Ring Cleanup

## Ziel

Diese Version korrigiert den gescheiterten Drei-Ring-Prototyp aus v52.1.
Statt drei überlagerter Ringe zeigt das mobile Studio jetzt immer nur eine klare Orbit-Ebene.

## Änderungen

- Drei gleichzeitig sichtbare Ringe werden im mobilen Studio nicht mehr gerendert.
- Das Orbit-Menü arbeitet als Stufenring:
  1. Hauptmenü
  2. Untermenü
  3. konkrete Einstellung
- Die jeweils nächste Ebene ersetzt die vorherige Ebene.
- Auswahlpunkte bleiben im Ring selbst sichtbar.
- Keine schwebenden rechten Untermenü-Listen mehr.
- Keine chaotischen transparenten Eingabe-Fenster über der Karte.
- Zurück-Button bringt eine Ebene zurück.
- Studio-Button bringt zurück zum Hauptmenü.
- Vorschau-Button blendet die Bearbeitung aus.
- Unten bleibt das helle Bedienfeld für echte Eingaben erhalten.

## Mobile-only

Diese Änderung betrifft nur das mobile Studio.
Public Link, öffentliche Karte und Desktop bleiben unverändert.

## Test

Nach Upload öffnen mit:

```text
https://reeli-alpha.vercel.app/?v=5211
```

Prüfen:

1. Nur ein Orbit-Ring ist sichtbar.
2. Hauptmenü → Untermenü → Einstellung ersetzt jeweils die vorige Ebene.
3. Zurück funktioniert eine Ebene zurück.
4. Studio öffnet das Hauptmenü.
5. Untenes Bedienfeld bleibt hell, vollbreit und lesbar.
6. Public Link bleibt unverändert.
