# Firestore Security Specification

This document details the security constraints, relational access patterns, and threat vectors examined for the CVCraft AI database.

## 1. Data Invariants

1. **User Ownership Isolation**: Users can only read, write, create, or update their own user documents. `/users/{userId}` is accessible ONLY if `request.auth.uid == userId`.
2. **Sub-collection Master-Gate Sync**: `/users/{userId}/resumes/{resumeId}` and `/users/{userId}/letters/{letterId}` are sub-resources. A user cannot read, query, or write to these resources unless `request.auth.uid == userId`.
3. **Email Verification**: Standard writes require that `request.auth.token.email_verified == true` to prevent fraudulent access (using the email verification flow implemented).
4. **Data Size Validation**: Fields like user names, resumes, or letters must not exceed defensive length boundaries to avoid cost-based attacks or resource exhaustion.

## 2. The "Dirty Dozen" Threat Payloads (Rejected by Rules)

The security rules must reject each of the following payloads:

1. **Spoofed User Creation**: Creating a document at `/users/attacker_uid` with `email` of `victim@example.com` but signed in as `attacker_uid`. (Rule checks `userId == request.auth.uid` and validates email ownership).
2. **Ghost Fields injection**: Writing a profile at `/users/uid` with an extra unapproved field `isSystemAdmin: true`.
3. **Privilege Escalation**: Attempting to update `isPremium` field manually on `/users/{userId}` directly from client.
4. **Orphaned Resume Write**: Attempting to write a resume under `/users/victim_uid/resumes/res_123` while authenticated as `attacker_uid`.
5. **Junk Character ID injection**: Attempting to write `/users/uid/resumes/%%%%$$$$` containing non-alphanumeric characters.
6. **Immortal Field Override**: Attempting to update the `createdAt` timestamp of an existing resume or user profile.
7. **Temporal Violation**: Supplying a future `updatedAt` date instead of the server timestamp `request.time`.
8. **PII Exposure / Blanket Reading**: Attempting to perform a list query on `/users` collection without filtering by the authenticated user's ID.
9. **No Email Verification Write**: Attempting to create a resume when `request.auth.token.email_verified == false`.
10. **Oversized String Injection**: Attempting to set a 2MB base64 string as a username in the profile.
11. **Negative Value Manipulation**: Setting `creationsCount` or `adViews` to a negative integer like `-500`.
12. **Foreign Reference Infiltration**: Writing a resume with a corrupted `colorTheme` (e.g., passing a long script injection instead of a valid hex color code).

## 3. Test Assertions

Our `firestore.rules` will enforce these checks statically and relationally on the server side, ensuring that any client-side bypass attempt receives a `PERMISSION_DENIED` status.
