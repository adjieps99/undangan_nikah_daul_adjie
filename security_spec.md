# Security Specification — Adjie & Daulika Wedding Firestore Rules

## 1. Data Invariants & Access Matrix

1. **Default-Deny Catch-All**: Any path not explicitly matched (`/databases/{database}/documents/{document=**}`) is denied for both read and write.
2. **Verified Admin Identity**:
   - Bootstrapped admin is strictly `request.auth != null && request.auth.token.email == 'adjieprasatia@gmail.com' && request.auth.token.email_verified == true`.
   - Unverified email tokens (`email_verified == false`) are always rejected.
   - `/admins/{uid}` is strictly non-writable by any client.
3. **Wishes (`/wishes/{wishId}`)**: Publicly readable only when `visibility == 'PUBLIC' && moderation_status == 'APPROVED'`; guests may create with strict schema, state coupling, and `createdAt == request.time`; only verified admin can moderate or delete.
4. **RSVPs (`/rsvps/{rsvpId}`)**: Strictly admin-only `get`/`list`; guests create/update only with high-entropy 24+ char IDs under strict 1-person policy.
5. **Guest Overrides (`/guest_overrides/{guestNo}`)**: Strictly admin-only read/write with `int(guestNo) == incoming().no`.
