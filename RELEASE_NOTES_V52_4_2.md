# v52.4.2 – Mobile Button Editor Structure Fix

## Fokus
Gezielter Feinschliff für den mobilen Button-Editor im Tap-to-Edit Studio.

## Änderungen
- Button-Tabs neu strukturiert: `Text | Aktion | Look | Verwalten`.
- `Übertragen` wurde zu `Verwalten`; Look-Übertragung sitzt jetzt am Ende von `Look`.
- Tab `Text` enthält jetzt Buttontext, zweite Zeile, Textgröße, Schriftart, Textfarbe, Icon-Auswahl, Iconfarbe und Icongröße.
- Tab `Look` enthält Form, Buttonfarbe mit Farbcode, Buttonbild Upload/Entfernen, Buttongröße, Rahmen, Rahmenfarbe und `Look auf alle Buttons`.
- Tab `Verwalten` enthält Button kopieren, verschieben und entfernen.
- Buttongrößen neu kalibriert: `Klein` ist deutlich kompakter und skaliert Schrift, Icon, Rahmen, Radius und Innenabstand mit.
- ButtonRenderer nutzt jetzt auch die zweite Zeile (`subtitle`) als sichtbare zweite Button-Zeile.
- Public Link und Desktop bleiben unverändert.

## Test
https://reeli-alpha.vercel.app
