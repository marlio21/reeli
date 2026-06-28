
## v52.5.55 – Desktop Menu Parity Polish & Profile Scene Fix

- Desktop-Mittelspalte weiter vereinfacht: Buttons zeigt nur noch Text, Aktion, Look und Verwalten.
- Plus-/Aktueller-Button-Zusatzkarten aus der Mittelspalte entfernt, damit der Bedienfluss wie Mobile bleibt.
- Szene bekommt Profilbild als eigenen Unterpunkt in der Mittelspalte.
- Profilbild-Unterpunkt ist mit dem vorhandenen mobilen Profilbild-Editor verbunden.
- Buttoneditor im rechten Bereich größer, zentrierter und besser als aktive Vorschaufläche dargestellt.
- Werbetext-Vorschau und Vorlagenbereich im rechten Bereich mittiger und übersichtlicher gesetzt.
- Lesbarkeit und aktive Zustände im Desktop-3-Bereich-Editor weiter verbessert.
- Mobile bleibt unverändert.


## v52.5.53 – Desktop Mobile Panel Readability Bridge

- Desktop right configuration panel now applies the mobile tap-editor styling on desktop screens.
- Fixes raw/unreadable Text, Aktion, Look and Scene panels in the desktop workbench.
- Selected chips/buttons are readable again with strong contrast.
- Mobile layout and mobile CSS behavior remain unchanged.



## v52.5.52 – Desktop Exact Mobile Editor Parity Bridge

- Desktop keeps the 3-area workbench: preview, selector, configuration.
- The right configuration area now uses the same tap-to-edit panels as the mobile version instead of simplified desktop-only editors.
- Scene, Text and Buttons therefore expose the same controls and wording as mobile.
- Global actions remain only in the top dashboard.
- Mobile remains unchanged; the bridge is desktop-only CSS/state routing.
# CHANGELOG

## v52.5.49 – Desktop Mobile-Parity Editor Cleanup

- Desktop editor is reduced to one clear workflow: dashboard on top, permanent 9:16 preview on the left, active configuration on the right.
- Top editor navigation now focuses on the mobile-parity modules: Szene, Text, Buttons and Design; Karten is handled only through the dashboard action to avoid duplicate management paths.
- Desktop subnavigation is a compact horizontal tool strip inside the configuration area, using the same scene/text/button subsections as the mobile editor.
- Removes the extra Desktop Cards workspace tab from the main editing flow.
- Keeps Mobile editor, Mobile Public View and the large Button Editor preview untouched.
- Keeps existing central button size, icon and text logic unchanged.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.5.47 – Desktop Studio Side-by-Side Editor Foundation

- Adds a desktop-only studio dashboard bar above the editor.
- Reflows desktop into a side-by-side workspace: navigation/subsections, configuration panel and permanent preview panel.
- Adds desktop workspace tabs for Szene, Text, Buttons, Website and Karten.
- Adds quick actions for Kartenverwaltung, Nutzerverwaltung, Neue Karte and Teilen in the desktop top dashboard.
- Keeps the existing mobile editor and mobile public card untouched.
- Keeps the large Button Editor preview unchanged.
- ZIP remains dist-free and excludes node_modules / release notes.


## v52.5.43 – Desktop Onepager Three Section Foundation

- Desktop-only Onepager-Foundation ergänzt.
- Desktop-Public-Ansicht besteht jetzt aus drei Bereichen: Reel/9:16 ohne Kartenbuttons, separater Button-Aktionsbereich und gestaltbarer Contentbereich.
- Kartenbuttons werden im Desktop-Reel ausgeblendet und daneben mit denselben Buttondaten dargestellt.
- Desktop-Buttonbereich ist auf 6 echte Kartenbuttons begrenzt.
- Dritter Bereich kann Text aus der Karte oder eigenen Desktop-Text nutzen.
- Optionaler Bild-/Video-URL-Block für den dritten Desktop-Bereich vorbereitet.
- Mobile Karte, Mobile Editor und Public-Mobile bleiben unverändert.
- ZIP bleibt ohne dist, node_modules und RELEASE_NOTES.


## v52.5.41 – Public Share Hydration & Six Button Cap Fix

- Public/share links render from `hydrateCardMobileLayout(card)` before mounting the unified mobile surface.
- Public View now uses the same final timeline mode as the clean editor card preview.
- The layered 9:16 card renders at most six real card buttons; QR-Code, Teilen and Erstellen remain a separate system footer bar and are not counted as card buttons.
- Fixes cases where old duplicate/legacy Firestore button entries appeared in Public although the editor showed six real buttons.
- Keeps the v52.5.38 central button sizes and v52.5.40 empty-text behavior intact.

## v52.5.40 – Empty Button Text & Ad Text Height Slider Fix

- Empty button titles now render as empty on the card instead of falling back to "Ohne Titel" / "Untitled".
- Keeps the v52.5.39 icon scaling: icon size "Sehr groß" is icon-only in the real card tile.
- Adds a mobile ad-text height slider so the Werbetext zone can be made taller/shorter without changing font sizes.
- Persists `heroTextHeightPercent` into `mobileLayout.text` and `publicLayoutSnapshot.text` for editor/public parity.
- Keeps the canonical 60 / 90 / 110px button-size system from v52.5.38.

# CHANGELOG

## v52.5.39 – Button Text/Icon Scale & Wider Ad Text Fix

- Keeps the canonical v52.5.38 card button size presets: 60 / 90 / 110px.
- Adjusts forced-card-tile text scaling so labels fit the larger 90/110px buttons better.
- Adjusts icon scaling relative to the actual card tile size.
- Makes Icongröße “Sehr groß” an icon-only CTA in real card tiles: the icon is centered and the text is hidden only for this explicit very-large icon mode.
- Keeps the large Button Editor preview unchanged.
- Keeps English/German configuration behavior and the compact / standard / large preset model.
- Gives layered Werbetext/ad-text boxes more horizontal width on the card.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.5.38 – Central Button Size Scale & Loading Cleanup Fix

- Adds a single canonical card/public button size table: Klein 60px, Normal 90px, Groß 110px.
- Removes the card-button “Sehr groß” preset from the public/card size scale.
- Reuses the central size table in editor preset writing, monitor-card cleanup, mobile hydration, public snapshots and card rendering.
- Removes scattered local button clamps such as 56–100/112 and keeps card values in the 60–110px canonical range.
- Keeps the large Button Editor preview untouched; the cleanup targets the 9:16 card preview and Public card values.
- Moves Service Worker/cache clearing out of the normal startup path; it now only runs with `?clearUreelCache=1`.
- ZIP remains dist-free and excludes node_modules / release notes.


## v52.5.37 – Larger Card Buttons & Public Action Bar Fix

- Increases card/Public button size presets to 56 / 68 / 80 / 100px.
- Raises canonical mobile button-size clamp to 100px so xlarge persists into Public view.
- Moves the button dock higher in the 9:16 card to leave room for the system action bar.
- Replaces the old bottom action row with a compact 3-button bar: QR-Code, Teilen, Erstellen.
- Keeps the large Button Editor preview untouched.
- Keeps the v52.5.36 card-preview scale parity model intact.
- ZIP remains dist-free and excludes node_modules / release notes.

# v52.5.34

Button tile cleanup and public loading performance fix.

- Action buttons in the 9:16 preview/public card are clamped to safe mobile tile sizes.
- Size presets write smaller, usable public values: 44/52/58/66px.
- Icon/text stack is centered and slightly lifted inside the tile.
- Layout debug is hidden by default and no longer appears with normal debug URLs.
- Public video backgrounds use metadata preload and stop showing the loading pill to visitors.



## v52.5.32 – Mobile Button Scale Balance & Smaller Text Range Fix

- Rebalanced mobile button size presets so Public and Editor no longer jump to oversized 104px tiles.
- New mobile button preset sizes: Klein 52px, Normal 64px, Groß 76px, Sehr groß 88px.
- Capped canonical mobile tile sizes to a safer range (44–96px) to keep the 3-column 9:16 card readable.
- Button editor preview now uses a bounded visual zoom so large tiles do not explode inside the Look editor.
- Werbetext sliders now allow smaller values: title down to 10px, subtitle/description down to 8px.
- Text layout snapshots persist the smaller text sizes so Public can match the editor.
- No new renderer architecture changes; focused on scale balance and writer ranges.
## v52.5.32 – Mobile Editor Public Size Writer Fix

- Button size presets now write the canonical public fields directly: `buttonSizePx`, `buttonGridLayout.buttonSizePx`, `mobileLayout.buttons.buttonSizePx`, and `publicLayoutSnapshot.buttons.buttonSizePx`.
- Added `Sehr groß` button size preset at 104px.
- Hydration now lets live top-level editor values win over stale public/mobile snapshots when `preferLiveFields` is active.
- Debug label updated to v52.5.32.


## v52.5.29 – Public Button Shape & Layout Writer Fix

- Mobile Buttonform wieder sauber als Kreis / Eckig / Abgerundet normalisiert.
- `forceSquare` hält nur Breite/Höhe quadratisch und überschreibt nicht mehr die sichtbare Form.
- Button-Size-Presets schreiben jetzt echte Public-Grid-Werte: 58 / 72 / 88 px statt alter 42 / 50 / 58 px.
- Size-Preset ändert nicht mehr versehentlich die gewählte Buttonform.
- Layout-Snapshot-Version auf v52.5.29 angehoben.
- ZIP bleibt ohne `dist`, ohne `node_modules`, ohne `RELEASE_NOTES`.

## v52.5.28 – Public Layout Debug Inspector

- Public View zeigt temporär einen Layout-Debug-Inspector mit geladenen Grid-/Textwerten.
- Studio-Vorschau zeigt denselben Inspector zum direkten Vergleich.
- Ausgegeben werden u. a. buttonGridLayout.buttonSizePx, canonical.buttonSizePx, publicLayoutSnapshot, mobileLayout, heroTitleSize und Layout-Version.
- Zweck: Public-View-Problem nicht weiter raten, sondern Firestore-/Hydration-/Overwrite-Pfad sichtbar machen.
- ZIP bleibt ohne dist/, node_modules und RELEASE_NOTES.


## v52.5.27 – Public Snapshot Priority & Button Shape Restore Fix

- Restores visible button shape control in mobile card tiles: Kreis, Eckig and Abgerundet are no longer overwritten by the forced square tile mode.
- `forceSquare` now means square dimensions only; it no longer forces every card button to the same rounded visual shape.
- Changes canonical button-grid priority so top-level/live `buttonGridLayout` values win over stale `mobileLayout`/`publicLayoutSnapshot` values.
- Keeps snapshots as fallback only for old public cards that do not yet have current top-level layout fields.
- Versions new mobile/public layout snapshots as `v52.5.27`.
- No new features, no renderer rewrite, no intentional Desktop-editor changes, and ZIP remains without `dist/`.

## v52.5.26 – Sofortplan Hydration, Fresh Grid Snapshot & Tile Shape Fix

- Keeps the critical Public realtime hydration path explicit: Firestore `onSnapshot` data is passed through `hydrateCardMobileLayout()` before `setVisitorCard()`.
- Keeps `deriveCanonicalButtonGridLayout` explicitly imported in `buttonUtils.ts`, preventing missing canonical layout fallback behavior.
- Hardens `persistMobileLayoutFields()` so fresh `updates.buttonGridLayout` values are written into `mobileLayout`/`publicLayoutSnapshot` without being remixed with stale snapshot values from the base card.
- Makes forced mobile button tiles respect `forceSquare=true` over legacy per-button radius data in `ButtonRenderer.tsx`.
- No renderer rewrite, no new features, no intentional Desktop-editor changes, and ZIP remains without `dist/`.

## v52.5.25 – Public Snapshot Staleness & Live Layout Priority Fix

- Fixes the root cause where stale `publicLayoutSnapshot`/`mobileLayout` data could override newly edited button-grid values during save/hydration.
- Adds live-field priority during `persistMobileLayoutFields()`, so changed `buttonGridLayout.buttonSizePx` and `buttonGapPx` are written into the new public snapshot.
- Versions new layout snapshots as `v52.5.25`, allowing old snapshots to be treated as potentially stale.
- Persists `heroTitleSize`, `heroSubtitleSize`, and `heroDescriptionSize` as top-level Firestore fields in addition to the snapshot.
- Keeps the fix intentionally small: no renderer rewrite and no intentional Desktop-editor changes.




## v52.5.24 – Dist-free Upload & Public Snapshot Priority Fix

- `dist/` aus dem ZIP entfernt, damit Vercel immer frisch aus dem Quellcode baut.
- Aktive Editor-Realtime-Updates werden jetzt ebenfalls vor `setActiveCard()` hydriert.
- Public/mobile Layout-Snapshots haben bei Buttonraster und Textgrößen Vorrang vor alten Top-Level-/Legacy-Feldern.
- Legacy-Fallback für mobile Buttongröße von 72px auf 80px angehoben.
- Kein Renderer-Umbau, keine neuen Features, Desktop nicht bewusst verändert.

## v52.5.24 – Realtime Hydration & Canonical Layout Import Fix

- Fixes the Public realtime Firestore listener: snapshot data is hydrated with `hydrateCardMobileLayout()` before entering React state.
- Initial Public slug loading also sets the hydrated card explicitly.
- Adds the missing `deriveCanonicalButtonGridLayout` import in `buttonUtils.ts`.
- Prevents raw Firestore updates from replacing canonical mobile button/text layout fields with incomplete legacy data.
- Keeps this release intentionally small: no renderer redesign, no new features, no intentional Desktop-editor changes.
- Build verified successfully.


## v52.5.22 – Public Recovery & Cache Clear Hotfix

- Public route now unregisters old service workers and clears runtime caches to prevent stale broken bundles.
- Public card rendering is wrapped in an ErrorBoundary with a visible recovery fallback instead of a black screen.
- Visitor realtime updates are hydrated through the mobile layout persistence path before rendering.
- Build verified successfully.
- No RELEASE_NOTES files.

# CHANGELOG

## v52.5.39 – Button Text/Icon Scale & Wider Ad Text Fix

- Keeps the canonical v52.5.38 card button size presets: 60 / 90 / 110px.
- Adjusts forced-card-tile text scaling so labels fit the larger 90/110px buttons better.
- Adjusts icon scaling relative to the actual card tile size.
- Makes Icongröße “Sehr groß” an icon-only CTA in real card tiles: the icon is centered and the text is hidden only for this explicit very-large icon mode.
- Keeps the large Button Editor preview unchanged.
- Keeps English/German configuration behavior and the compact / standard / large preset model.
- Gives layered Werbetext/ad-text boxes more horizontal width on the card.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.5.19 – Public Save Hydration & Layout Persistence Fix

- Public-Speicherpfad für mobile Layoutwerte gehärtet.
- Buttongröße, Buttonabstand und Raster werden als mobileLayout/publicLayoutSnapshot mitgespeichert.
- Public-Link hydriert alte Karten aus den gespeicherten mobilen Layoutwerten, bevor gerendert wird.
- Werbetextgrößen werden ebenfalls im mobilen Layout-Snapshot persistiert und im Public-Renderer gelesen.
- ButtonRenderer bleibt unverändert; Fokus liegt auf Datenpersistenz statt kosmetischer Größenkorrektur.
- Desktop-Editor wurde nicht bewusst umgebaut.

## v52.5.18 – Mobile Layout Model Hard Fix

- Removes the old Ureel `normalizeButtonGridLayout` cap that reduced saved mobile button sizes to 66px before the renderer could use them.
- Preserves the user-selected `buttonGridLayout.buttonSizePx` across editor preview, public link and mobile card surface with a broad safe range up to 112px.
- Aligns Studio monitor cleanup with the same mobile layout model instead of separately clamping to 104px.
- Improves forced mobile button text fitting: public/preview tiles ignore fine-tune offsets that clipped labels and use full-width centered text for short labels.
- Adjusts final mobile Werbetext scaling so Public and preview no longer apply separate compact shrink rules when buttons are visible.
- Keeps live timing and replay behavior from v52.5.16/v52.5.17 and does not intentionally alter the Desktop editor.

## v52.5.17 – Mobile Button Size Persistence & Text Fit Hard Fix

- Removes the remaining hard 76px cap for layered mobile card buttons.
- Uses the saved Look/Grid `buttonSizePx` in Public, Studio preview and mobile button preview up to 104px.
- Updates forced mobile button tiles to use proportional padding, so labels do not lose first/last characters.
- Stacks left/right icon layouts in small real card tiles to keep text readable.
- Keeps timeline/live behavior from v52.5.16 and does not intentionally alter the Desktop editor.

## v52.5.16 – Public Timing Restore, Text Scale & Button Size Fix

Mobile/Public correction after the final visual mode rollout.

- Restores live timeline reveals in Public and preview while keeping the unified visual scale.
- Separates timeline behavior from visual parity with `timelineMode`.
- Brings back the replay/“Spot neu starten” control after the configured spot duration.
- Increases mobile/Public Werbetext scaling so it better matches the editor preview.
- Increases the final mobile button tile baseline so Public buttons are no longer overly small.
- Keeps Desktop editor changes protected.

## v52.5.15 – Final Visual Mode Parity Fix

- Public-/Live-Link und Studio-Vorschau verwenden jetzt einen expliziten finalen visuellen Render-Modus.
- `isPreview` darf in der Unified Mobile Surface nicht mehr Layout, Animation, Timeline oder Buttongrößen verändern, sondern nur Editor-Interaktion/Klickbarkeit.
- Werbetext-Animationen und Timeline-Reveals werden im finalen Modus eingefroren, damit Public und Vorschau denselben Endzustand zeigen.
- Buttons in der Layered-Ureel-Karte nutzen in Public und Preview dieselbe Mobile-Tile-Größenlogik.
- Endcard/Replay-Zustand wird im finalen visuellen Vergleichsmodus nicht automatisch über die Karte gelegt.
- Public-Link, mobile Studio-Vorschau und Desktop-Phone-Preview bleiben auf der gemeinsamen 390×693 Kartenbasis.
- Desktop-Editor nicht bewusst umgebaut.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.


## v52.5.14 – Public Renderer Hard Switch Fix

- Public-/Live-Link-Pfad hart auf die zentrale Unified Mobile Live Card Surface umgestellt.
- Public View verwendet nicht mehr den separaten Desktop/Public-Page-Renderer für die eigentliche Karte.
- Public View, mobile Vorschau und Studio-Monitor teilen dieselbe 390×693 Kartenbasis.
- Dashboard-/Start-Preview-Chrome wird im Public-Link nicht mehr gerendert.
- Public-Karte darf nur noch außen skaliert werden; Button-/Werbetextgrößen werden nicht mehr je Public-Pfad neu berechnet.
- Desktop-Editor nicht bewusst umgebaut.


## v52.5.13 – Unified Mobile Live Renderer & Desktop Preview Chrome Cleanup

- Zentrale mobile 9:16-Live-Surface ergänzt: Public-Link, Desktop-Phone-Preview und Studio-Kartenvorschau rendern nun dieselbe feste 390×693 Kartenbasis und skalieren nur die ganze Fläche.
- Unterschiedliche Neuberechnung von Button-/Werbetextgrößen zwischen Editor-Vorschau und geteilter Karte reduziert.
- Public-Mobile-Karte nutzt dieselbe skalierte Live-Surface, damit Buttons und Werbetext nicht mehr kleiner wirken als in der Vorschau.
- Desktop-Phone-Preview nutzt ebenfalls dieselbe mobile Live-Surface, statt eigene Telefon-Skalierungen zu rechnen.
- Rechte Desktop-Vorschau bereinigt: zusätzliche Dashboard-/Start-Chrome-Buttons im Preview-Header ausgeblendet, ohne den eigentlichen Desktop-Editor umzubauen.
- Buttonrenderer bleibt zentral; Buttoneditor, mobile Karte und Public-Karte sollen dadurch dieselben Text-/Icon-Fits sehen.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.

## v52.5.12 – Mobile Public Preview Scale & Button Text Fit Fix

- Mobile-only: öffentliche geteilte Karte, eingebettete 9:16-Vorschau und Buttoneditor verwenden besser abgestimmte Button-Tile-Größen.
- Kartenbuttons werden auf Mobile größer und lesbarer gerendert, statt in Public/Share zu klein zu wirken.
- Buttontext-Fit verbessert: Klein/Normal/Groß/Sehr groß bekommen klarere Verhältnisse; kurze Labels werden weniger getrennt.
- Werbetext in der echten Karte etwas größer skaliert, damit Public/Share näher an der Editor-Vorschau liegt.
- Schriftart-Auswahl im Buttoneditor visuell auf genau eine aktive Schriftart stabilisiert.
- Desktop nicht bewusst verändert.

## v52.5.11 – Mobile Dashboard Share Placement & Textfield Readability Fix

- Mobile-only cleanup: duplicate top preview/dashboard/start bar hidden on mobile; the lower mobile Dashboard remains the main entry.
- Share action moved into the mobile Dashboard strip.
- Mobile card-side share pill hidden to reduce clutter.
- Dark account/dashboard input fields made high-contrast and readable.
- Button editor font chips stabilized so only one font family is visually active.
- Button editor text/input fields kept bright and readable on mobile.
- No RELEASE_NOTES files.

# CHANGELOG

## v52.5.39 – Button Text/Icon Scale & Wider Ad Text Fix

- Keeps the canonical v52.5.38 card button size presets: 60 / 90 / 110px.
- Adjusts forced-card-tile text scaling so labels fit the larger 90/110px buttons better.
- Adjusts icon scaling relative to the actual card tile size.
- Makes Icongröße “Sehr groß” an icon-only CTA in real card tiles: the icon is centered and the text is hidden only for this explicit very-large icon mode.
- Keeps the large Button Editor preview unchanged.
- Keeps English/German configuration behavior and the compact / standard / large preset model.
- Gives layered Werbetext/ad-text boxes more horizontal width on the card.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.5.10 – Mobile Share, Action Paste, Icon Library & Button Size Parity Fix

- Mobile-only Reparatur: Desktop-Version wird nicht bewusst verändert.
- Teilen-Button neben der mobilen Karte ergänzt; nutzt `navigator.share` und fällt auf Link-kopieren zurück.
- Buttoneditor Aktion: Link-Eingaben unterstützen Paste aus der Zwischenablage per Eingabefeld und separatem Einfügen-Button.
- Mobile Aktionseingabe ergänzt Paste-Button, damit Weblinks auf Touch-Geräten zuverlässiger übernommen werden.
- Mobile Buttongrößen werden nicht mehr im Monitor auf 46px gekappt; Look-Tab und echte Vorschaukarte verwenden dieselben Tile-Werte.
- ButtonRenderer: Textgrößen für Klein/Normal/Groß/Sehr groß in Forced-Mobile-Tiles neu feinjustiert.
- Iconpositionen Links/Rechts/Oben/Mitte/Unten sind im mobilen Editor sichtbar und werden mit `iconEnabled` in die Karte geschrieben.
- Icon-Bibliothek ist jetzt einklappbar und öffnet nur über „Icon-Bibliothek öffnen“.
- Design-Übertragen nimmt Iconposition und den expliziten Button-Font-Key mit.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.


## v52.5.9 – Mobile Button Font Control & Text Animation Parity Fix

- Mobile-only Reparatur: Desktop-Version wird nicht bewusst verändert.
- Mobile Button-Schriftarten auf fünf Optionen erweitert: Klar, Rund, Elegant, Modern und Mono.
- Schriftart-Erkennung im mobilen Buttoneditor case-insensitive normalisiert, damit Klar/Rund/Elegant/Modern/Mono exklusiv aktiv sind.
- Schriftgewicht Normal/Fett wird sauber in den Buttondaten gespeichert und vom ButtonRenderer ausgewertet.
- ButtonRenderer: Forced mobile Tiles bekommen neue preset-spezifische Textcaps für Klein/Normal/Groß/Sehr groß.
- Kurze Buttontexte bis neun Zeichen werden in mobilen Kartentiles nicht mehr unnötig getrennt oder hypheniert.
- Icongröße in mobilen Kartentiles wurde reduziert, damit Icons nicht klobiger als im Editor wirken.
- Look-Tab/Design übertragen nimmt jetzt auch Font-Family, Font-Weight, Letter-Spacing und Text-Wrap mit.
- Mobile Werbetext-Editorvorschau rendert dunkle Textfarben auf dunklen Designs mit lesbarem Fallback.
- Werbetext-Animationen werden in der Editor-Vorschau eingefroren, damit die Karte die finale Konfiguration zeigt; öffentliche Animation bleibt vorbereitet.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.


## v52.5.8 – Mobile Text Visibility, Button Proportion & Toggle Fix

- Mobile-only: Werbetext kann oben im Texteditor aktiviert/deaktiviert werden.
- Beschreibungstext bleibt im mobilen Werbetext-Vorschaueditor sichtbar und aktualisiert sich beim Bearbeiten.
- Dunkle Textfarben auf dunklen Werbetext-Designs werden in der mobilen Karte auf lesbare Fallbackfarben gehoben.
- ButtonRenderer: Icon-Aus zentriert den Buttontext, Icon-Aus kann durch erneute Icon-Auswahl wieder aktiviert werden.
- ButtonRenderer: Klein/Groß/Sehr groß wurden für mobile Kartentiles neu begrenzt, damit Text und Icon sauberer im Verhältnis bleiben.
- Buttoneditor: Schriftart und Schriftgewicht bleiben getrennt; Rund und Klar werden nicht gleichzeitig als Schriftart aktiv markiert.
- Mobile Design-Hintergrund-Schaltung wurde breiter/zweispaltig stabilisiert.
- Desktop wurde nicht bewusst verändert.


## v52.5.7 – Mobile Final Renderer Parity Fix

- Mobile Buttoneditor-Vorschau rendert dieselbe echte Kartenkachel und wird nur visuell vergrößert.
- Mobile 9:16-Karte und Buttoneditor verwenden dadurch dieselbe Text-/Icon-Skalierung.
- Kleine Icon-Hintergründe in Kartenbuttons entfernt.
- Schriftart und Schriftgewicht im mobilen Buttoneditor getrennt.
- Design-Hintergrund AN/AUS als robuste mobile 2er-Schaltung repariert.
- Mobile Konto-/Verwaltungsdialoge für Touch-Scroll weiter stabilisiert.
- Desktop nicht bewusst verändert.

# CHANGELOG

## v52.5.39 – Button Text/Icon Scale & Wider Ad Text Fix

- Keeps the canonical v52.5.38 card button size presets: 60 / 90 / 110px.
- Adjusts forced-card-tile text scaling so labels fit the larger 90/110px buttons better.
- Adjusts icon scaling relative to the actual card tile size.
- Makes Icongröße “Sehr groß” an icon-only CTA in real card tiles: the icon is centered and the text is hidden only for this explicit very-large icon mode.
- Keeps the large Button Editor preview unchanged.
- Keeps English/German configuration behavior and the compact / standard / large preset model.
- Gives layered Werbetext/ad-text boxes more horizontal width on the card.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.5.6 – Mobile Button Tile Parity, Text Background Toggle & Account Scroll Fix

- Mobile-only Reparatur: Desktop-Version wird nicht bewusst verändert.
- Ursache für den fehlenden Beschreibungstext im Werbetexteditor geklärt: Die echte mobile 9:16-Karte renderte den Beschreibungstext aus `description/heroDescription`, der Editor-Vorschau-Block verwendete aber deutlich größere eigene Schrift-Caps und schnitt die Beschreibung durch `overflow:hidden` ab.
- Werbetexteditor-Vorschau nutzt jetzt kompaktere mobile Preview-Größen, damit Titel, Untertitel und Beschreibung gleichzeitig sichtbar bleiben.
- `box.enabled` ist jetzt offizieller Bestandteil des Ureel-Texttemplate-Modells und bleibt beim Normalisieren/Speichern erhalten.
- Design-Hintergrund AN/AUS wirkt jetzt in der mobilen Editor-Vorschau und in der echten mobilen 9:16-Karte, inklusive CSS-Override für alle Template-Skins.
- Mobile Button-Tiles wurden neu abgestimmt: Icon- und Textgrößen werden in echten Kartenbuttons weniger klobig skaliert und bleiben näher am Buttoneditor.
- Mobile Buttoneditor-Mittelvorschau rendert eine vergrößerte echte Kartenkachel, damit Buttonform, Text und Icon nicht mehr mit einem anderen Layout berechnet werden.
- Nutzerverwaltung/Konto ist mobil scrollbar und behält den Header erreichbar.
- Profilbild-Rendering bleibt geschützt.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.

## v52.5.5 – Mobile Preview Sync, Button Scale & Dashboard Access Fix

- Mobile-only Reparatur: Desktop-Version wird nicht bewusst verändert.
- Werbetext-Vorschaueditor nutzt die Template-Daten sichtbarer synchron zur mobilen 9:16-Karte.
- Beschreibungstext ist im mobilen Werbetext-Vorschaueditor wieder klar sichtbar.
- Design-Hintergrund AN/AUS ergänzt, damit Textdesigns wahlweise mit oder ohne große Box/Overlay wirken.
- Mobile 9:16-Karte respektiert den ausgeschalteten Design-Hintergrund ohne Box-Schatten.
- Buttontext und zweite Zeile skalieren in den echten mobilen Kartenbuttons größer und näher an der Buttoneditor-Vorschau.
- Icongrößen werden in echten mobilen Kartenbuttons stärker, aber weiter buttonflächenbezogen begrenzt.
- Mobile Dashboard-Schnellzugriff öffnet Kartenverwaltung, Nutzerverwaltung/Konto und Neue Karte direkt unter dem Tap-to-Edit Einstieg.
- Profilbild-Rendering bleibt geschützt.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.

## v52.5.4 – Mobile Text Design & Button Renderer Sync Fix

- Mobile-only Reparatur: Desktop-Version wird nicht bewusst verändert.
- Werbetext-Vorlagen im mobilen Editor erzeugen sichtbare Designs mit anderer Ausrichtung, Box, Rahmen, Akzent und Größenwirkung.
- Echte 9:16-Vorschaukarte liest dieselben mobilen Texttemplate-Daten, damit Designwechsel nicht nur im Editor sichtbar sind.
- Mobile Kartenbuttons bleiben Quadrat, Kreis oder abgerundetes Quadrat und fallen nicht in Rechteck-/Pill-Formen zurück.
- Buttoneditor-Preview und mobile Kartenbuttons nutzen denselben ButtonRenderer und dieselbe Force-Square-Größenlogik.
- Icongrößen werden im mobilen Kartenraster auf eine sinnvolle Maximalgröße relativ zur Buttonfläche begrenzt.
- Profilbild-Rendering bleibt geschützt.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.

## v52.5.3 – Dashboard Routing, Button Visibility & Text Field Reset Fix

- Dashboard-Einstieg bleibt sichtbar und öffnet Kartenverwaltung/Nutzerverwaltung über echte Panels.
- Kartenbuttons in der echten 9:16-Karte kollabieren nicht mehr zu Linien/Platzhaltern.
- 3×2-Buttonbereich bleibt auf echte Buttons ausgelegt; Button-Tap öffnet weiter den Buttoneditor.
- Buttontext, zweite Zeile, Radius/Form, Farbe, Rahmen und Transparenz lesen weiter aus dem zentralen ButtonRenderer.
- Beschreibungstext bleibt sauber an `description` + `heroDescription` gekoppelt und wird in Editor-Vorschau und 9:16-Karte gerendert.
- Farbeditor startet geschlossen; Spektrum-Punkt und Hue-Regler synchronisieren sichtbar mit Tap, Drag und Hex-Code.
- Profilbild-Rendering bleibt unverändert und geschützt.
- Keine `RELEASE_NOTES_*.md` im Upload-Paket.

## v52.4.12 – Repository Cleanup & Editor Hard Fix Continuation

- Upload-Struktur bereinigt: `RELEASE_NOTES_*.md` bleiben aus der ZIP entfernt; `CHANGELOG.md` ist die einzige Versionshistorie.
- README auf v52.4.12 aktualisiert.
- Replay-Dopplung weiter reduziert: der Endkarten-Replay-Button wird nicht zusätzlich zum globalen `Spot neu starten` gerendert.
- Profilbild-Sichtbarkeit robuster: zusätzliche Profilbild-Felder werden gelesen; Aktivierung bleibt Voraussetzung.
- Profilbild bleibt über Reel/Video sichtbar, wenn aktiv und ein Bild vorhanden ist.
- Buttonform-Aliase stabilisiert: Kreis/Rund/Eckig, circle/rounded/square werden einheitlicher gerendert.
- Button-Transparenz härter umgesetzt: Hintergrundfarbe nutzt Alpha/rgba statt nur Element-Opacity.
- Beschreibungstext in der Karten-Vorschau größer und flexibler sichtbar.
- Public Link, Desktop und Verwaltungsbereiche bleiben unverändert.

## v52.4.10 – Text Preview & Color Picker Hard Fix

- Werbetext-Vorlagen aktualisieren nun auch die kleine Vorschau im Texteditor sichtbar.
- Wisch-Hinweis im mobilen Werbetext-Editor deutlicher gemacht.
- Titel, Untertitel und Beschreibung haben größere, flexiblere Schriftgrößen-Slider.
- Beschreibungstext ist größer voreingestellt und separat farblich steuerbar.
- Mobile Textfarben auf Spektrum-Farbfeld + Hex-Code umgestellt.
- Mehrfachanzeige von „Spot neu starten“ in der Karten-Vorschau entfernt; nur ein Neustart-Button bleibt sichtbar.
- Keine Kartenverwaltung/Nutzerverwaltung in dieser Reparaturversion; diese folgt separat.

# CHANGELOG

## v52.5.39 – Button Text/Icon Scale & Wider Ad Text Fix

- Keeps the canonical v52.5.38 card button size presets: 60 / 90 / 110px.
- Adjusts forced-card-tile text scaling so labels fit the larger 90/110px buttons better.
- Adjusts icon scaling relative to the actual card tile size.
- Makes Icongröße “Sehr groß” an icon-only CTA in real card tiles: the icon is centered and the text is hidden only for this explicit very-large icon mode.
- Keeps the large Button Editor preview unchanged.
- Keeps English/German configuration behavior and the compact / standard / large preset model.
- Gives layered Werbetext/ad-text boxes more horizontal width on the card.
- ZIP remains dist-free and excludes node_modules / release notes.

## v52.4.7 – Text Template Editor & Preview Button Fix

- Mobile Kartenvorschau: echte Buttons stoppen jetzt das Vorschau-Klick-Event und öffnen direkt den Buttoneditor.
- Buttonraster: legitime Text-/Timeline-Buttons werden nicht mehr aus der Vorschau gefiltert; die ersten sechs Buttons bleiben als 3×2-Startfläche sichtbar.
- Kartenvorschau: „Video erneut ansehen“ wurde durch „Spot neu starten“ ersetzt.
- Buttoneditor: Icon-Bibliothek nochmals erweitert und direkt in der mobilen Auswahl verfügbar gemacht.
- Werbetext-Editor: mobile Werbetext-Vorschau oben ergänzt, inklusive Hinweis „Wische für Vorlage“.
- Werbetext-Vorlagen: mindestens 15 Vorlagen im horizontalen Swipe-Streifen verfügbar.
- Werbetext-Stil: Titel, Untertitel und Beschreibung mit Größe, Farbe, Schrift und einfacher Position bearbeitbar.
- Timing: Titel, Untertitel, Beschreibung, Buttons und Profilbild bekommen mobile Schieberegler.
- Timing-Länge: Slider-Maximum richtet sich jetzt nach Video-/Spotlänge statt starrem 12–15s-Fenster.
- Public Link, Desktop, Kartenverwaltung und Nutzerverwaltung unverändert.

## v52.4.6 – Mobile Card Preview & Profile/Icon Polish

- Profilbild-Größen im Mobile Studio auf relative Kartenbreite gesetzt: Klein 15 %, Normal 35 %, Groß 55 %, Sehr groß 80 %.
- Profilbild-Formen stabilisiert: Kreis, Rund und Eckig werden an den Kartenrenderer weitergegeben.
- Profilbild liegt über Reel/Video, sobald es aktiv ist und ein Bild vorhanden ist.
- Mobile Icon-Bibliothek für Buttons deutlich erweitert: Kontakt, Social, Dateien, Business, Medien, Aktion, Shopping und Info.
- Icon-Auswahl visuell größer dargestellt.
- Icon-Größen im Button-Editor erweitert: Klein, Normal, Groß, Sehr groß.
- Szene > Reel / Video: „Vorschau starten“ entfernt, weil die Karte selbst die Vorschau ist.
- Public Link, Desktop und Karten-/Nutzerverwaltung unverändert.

## Hinweis

Ab v52.4.6 soll dieses CHANGELOG fortgeführt werden, statt für jede Version neue einzelne Release-Notes-Dateien im Hauptordner anzulegen.

## v52.4.8 – Compact Upload, Text Editor Fix & Security Stabilization

- Compact GitHub upload package: old root-level `RELEASE_NOTES_*.md` files removed from the ZIP; `CHANGELOG.md` remains the single version history file.
- Mobile card editor only: card management, user management, desktop and public link are intentionally left untouched.
- Profile image visibility repaired in clean mobile preview: appears only when enabled by the user and a real image/logo exists, including over Reel/video scenes.
- Text tap target enlarged: tapping the text area in the 9:16 card opens the mobile text editor with the template strip first.
- Mobile text editor keeps ad-copy preview, swipeable templates, style controls and video/spot-length-based timing sliders.
- Button icon library is now grouped visibly by category in the mobile button editor.
- Button management position picker now counts the real visible card buttons and labels the real amount.
- New starter card copy polished for a cleaner first impression.
- Production build verified locally after the changes.

## v52.4.9 – Text Preview Polish, Profile Text Mode, Color Picker & Card Management

- Werbetext-Editor mit deutlicherem Wisch-Hinweis und Design-Zähler erweitert.
- Werbetext-Vorschau nutzt die ausgewählte Vorlage sichtbar im Editor.
- Textfeld in der 9:16-Karte öffnet jetzt den Texteditor.
- Untertitel- und Beschreibungsgröße per größerem Sliderbereich erweitert.
- Profilbildmodus ergänzt: Profilbild aktivieren plus Name, Position, Firma und Profiltextfarbe.
- Profilbild wird in der Karten-Vorschau sichtbar, wenn Nutzer es aktiviert und ein Bild vorhanden ist.
- Timing-Slider für Titel, Untertitel, Beschreibung, Buttons, Profilbild und Profiltext ergänzt; Slider richten sich nach Spot-/Videolänge.
- Icon-Bibliothek im Buttoneditor erweitert.
- Farbauswahl im Texteditor vereinheitlicht: Farbfeld, Hex-Code und echter Picker.
- Build- und Upload-Paket kompakt gehalten; alte Einzel-Release-Notes aus dem Upload entfernt.


## v52.5.2 – Renderer Sync Foundation & Dashboard Entry

- Dashboard-Button in der Preview-Leiste ergänzt; Kartenverwaltung und Nutzerverwaltung sind darüber sichtbar erreichbar.
- Werbetext-Vorlagen synchronisieren Textvorschau und 9:16-Karte härter.
- Beschreibungstext bleibt an description + heroDescription gebunden und wird im Preview-Modell sofort angezeigt.
- Farbeditor startet geschlossen und nutzt ein echtes Spektrumfeld mit Pointer-Capture, Hue-Leiste und Hex-Code.
- ButtonRenderer erzwingt in der echten Kartenvorschau keine Quadratform mehr; abgerundete Buttons bleiben sichtbar.
- Profilbild-Rendering wird nicht verändert.


## v52.5.21 – Public Black Screen Hotfix

- Hotfix: riskante v52.5.20-Hydration im Public-Realtime-Pfad zurückgenommen.
- Hotfix: Dashboard-Aktion „Public aktualisieren“ aus dieser Version entfernt, bis der Public-Speicherpfad sicher geprüft ist.
- Public View soll wieder rendern statt schwarzem Bildschirm.
- Basis: v52.5.19 mit stabilem Public-Save-Hydration-Stand.

## v52.5.33 – Button Tile Cleanup & Debug Off
- Mobile/Public debug overlay hidden by default. It appears only with `?debugLayout=1`.
- Button tile sizes rebalanced again for 3-column 9:16 cards: 46 / 56 / 66 / 76px.
- Live mobile button tile clamp reduced to 42–84px to prevent oversized circles/vertical pills from breaking the card.
- Forced card tiles center icon/text vertically and nudge content slightly upward toward the visual middle.
- Button icon/text fitting made calmer for forced tiles: smaller icon cap, lower text caps, less bottom bias.
- Button editor large preview reduced so it no longer exaggerates the real card button.
- Werbetext size controls get more room toward small values for title, subtitle and description.

## v52.5.35 – Button Preview Restore & Public First Frame Fix

- Rebuilt the mobile button tile size mapping after v52.5.31–v52.5.34 caused oversized/warped tiles.
- Unified card tile clamps across Studio preview, clean preview and Public view to 38–68px.
- Balanced presets: compact 42px, standard 50px, large 58px, xlarge 66px.
- Reduced forced-tile icon/text scale and kept content centered slightly above optical center.
- Moved the layered action dock slightly upward and reduced its max height to avoid clipped semicircle buttons.
- Public/direct videos now use preload="auto" again to reduce the temporary empty surface before playback.
- Layout debug remains off by default and only appears with ?debugLayout=force.

## v52.5.36 – Card Preview Scale Parity Fix

- Mobile-Tap-Vorschau ersetzt direkten KonuCardCore-Render durch UnifiedMobileLiveCardSurface.
- Vorschaufenster skaliert dadurch die gesamte 390×693-Karte wie Public, anstatt einzelne Button-Kacheln separat zu interpretieren.
- Public-/Karten-Buttonwerte wieder auf sicheren großen Bereich gesetzt: 52 / 64 / 76 / 88px.
- KonuCardCore-Clamp für echte Kartenbuttons auf 42–88px erweitert.
- Button-Dock minimal nach oben gesetzt, um abgeschnittene untere Kacheln zu reduzieren.
- Surface zeigt optional vorhandenes Hintergrund-/Posterbild sofort als Fallback, bevor das Video bereit ist.
- Debug-Version auf v52.5.36 aktualisiert; Debug bleibt nur mit ?debugLayout=force sichtbar.

## v52.5.48 – Desktop Workbench Preview Format & Placement Fix

- Desktop-only layout override: preview is forced into the left workbench column, configuration stays on the right.
- The desktop preview phone is locked to a true 9:16 aspect ratio.
- Old flex/order classes can no longer push the preview back to the right column.
- Mobile editor/public rendering remains untouched.

## v52.5.50 – Desktop 3-Bereich Mobile-Parity Workbench
- Desktop-only: Editor auf drei klare Bereiche umgestellt: Vorschau, Auswahl, Konfiguration.
- Mobile bleibt unverändert.
- Desktop-Haupttabs auf Szene, Text und Buttons reduziert; Karten/Nutzer/Neue Karte/Teilen bleiben oben als globale Aktionen.
- Vorschau bleibt auf Desktop immer die echte 9:16-Karte, nicht mehr Button-/Text-Sondermonitor.
- Mittlere Spalte zeigt die mobilen Untermenüs vertikal; rechte Spalte zeigt die aktive Konfiguration.


## v52.5.62 - Mobile Werbetext Height Range Fix
- Mobile Werbetext height/position values are no longer clamped back to 24–76%.
- Renderer and mobile layout persistence now accept the intended 4–88% range.


## v52.5.63 - Mobile Action Paste & Preview Restart
- Mobile Button-Aktion: Einfügen-Button robuster gemacht, inklusive iOS/Safari-Prompt-Fallback, wenn navigator.clipboard blockiert ist.
- Mobile Button-Aktion: Weblink-Felder nutzen URL-Keyboard, deaktivieren Autokorrektur und normalisieren Domains ohne Protokoll zu https://.
- Mobile Vorschau-Karteneditor: sichtbarer Button „Spot neu starten“ ergänzt, der die Timeline auf 0s zurücksetzt und die Vorschau sofort neu startet.
