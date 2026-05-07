# Security Specification - EduGenius AI

## Data Invariants
1. An exam must be associated with a valid `creatorId` that matches the authenticated user's UID at creation.
2. User roles are either 'teacher' or 'student'.
3. Exams must have a title, topic, and course.
4. Timestamps (`createdAt`) must be server-generated.

## The "Dirty Dozen" Payloads (Attacks)
1. **Identity Spoofing**: Attempt to create an exam with a different `creatorId`.
2. **Resource Poisoning**: Use a 1MB string as an exam ID.
3. **State Shortcutting**: Bypass validation by sending missing required fields in an update.
4. **Denial of Wallet**: Create an exam with 10,000 questions (array size attack).
5. **PII Leak**: Read another user's profile from the `users` collection.
6. **Privilege Escalation**: Attempt to update own role to 'admin' (if I were to add one).
7. **Orphaned Write**: Create an exam without a valid creator.
8. **Shadow Field**: Add a `verified: true` field to an exam to bypass hypothetical future checks.
9. **Terminal State Break**: Modify a "published" exam (if I had locking).
10. **Query Scraping**: Attempt to list all exams in the database without being signed in.
11. **Timestamp Spoofing**: Provide a future `createdAt` date from the client.
12. **Relationship Hijack**: Update an exam ID to point to a different document.

## The Test Runner
(I would write `firestore.rules.test.ts` here if I had the test environment set up, but I will focus on the rules implementation following the guidelines).
