# Security Notes v52.5.36

Keine Änderungen an Auth, Firestore Rules, Storage Rules oder Zahlungslogik. Die Version ändert nur Vorschau-/Rendering-Skalierung, Button-Size-Presets und einen nicht-interaktiven Bild-Fallback für die Public-Surface.

## RC3.2 Phase 1 Security Hardening

### Public/private data boundary

- `/cards/{cardId}` is treated as the private full Studio document.
- `/publicCards/{slug}` is treated as the anonymous public/share document.
- Anonymous client-side queries against `/cards` are no longer required for Public View.
- A server-side `/api/public-card/:slug` fallback serves only published, public legacy cards that do not yet have a `publicCards` copy.

### Firestore rules

- `/cards` get/list is restricted to owner/admin.
- `/publicCards` get is public only when `isPublished == true`, `visibility == public`, and `isDeleted != true`.
- Analytics writes are create-only and must match a constrained payload schema.

### Storage rules

- Broad `allow read: if true` under `/users/{userId}` was removed.
- Card media can be read by owner/admin or by public users only when the related card is published and public.
- `application/octet-stream` is no longer accepted as video upload MIME type.

### Server API security

- `/api/process-video-job` requires a Firebase ID token and verifies card ownership/admin state before starting FFmpeg work.
- `/api/upload-file-fallback` validates token, UID, card ownership, upload type, content type, size and filename before writing through Admin SDK.
