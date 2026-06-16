# Security Specifications (TDD)

## 1. Data Invariants
- A User entity cannot self-modify their primary membership `plan`, `role`, or `storageLimitMB` once registered.
- A Card entity must be linked to a valid `ownerId` that strictly matches the authenticated user ID on creation and updates.
- Profile and custom button images are limited in size to protect system resources and billing quotas (Client limits: 500kb buttons, 1MB profiles; rules enforce presence of structured bounds).
- Public users can submit Abuse Reports (`/reports/{id}`) with status initialized exclusively as `pending`.
- Standard visitors can capture Analytics logging interactions anonymously to safeguard profiles without forcing viewers to log in.

## 2. Security Rules Payloads ("Dirty Dozen" Vulnerabilities Blocked)
1. **Privilege Escalation**: Attempting to create a user profile with `"role": "admin"` or `"plan": "business"` on standard login.
2. **Identity Spoofing**: Attempting to alter metadata on a Card where `slug` or `ownerId` does not match the active session user's identifier.
3. **Draft Bypass**: Trying to query a draft Card profile that isn't published yet where the client is not authenticated as the card owner.
4. **Unregulated DB Overwrites**: Writing custom fields directly inside the nested `buttons` array of foreign cards.
5. **PII Harvesting**: Public users trying to list or search the `/users` collection without proper authentication.
6. **Report Tampering**: A viewer trying to read or delete a moderation complaint they submitted after creation.
7. **Ad-hoc Admin Creation**: Writing directly to the `/admins` list collection without system authorization.
8. **Malicious ID Poisoning**: Sending long (~1MB string) random junk strings as standard card document IDs.
9. **Creation Timestamp Hijack**: Overwriting `createdAt` timestamps with fixed past or future values manually.
10. **State Corruption**: Skipping draft statuses or overwriting validated limits during updates.
11. **Orphaned Writes**: Writing button metadata that doesn't belong to any parent card schema.
12. **Double Analytics Write**: Spamming or updating existing analytics data events to exhaust data targets.
