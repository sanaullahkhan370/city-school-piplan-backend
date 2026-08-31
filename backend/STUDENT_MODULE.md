# Student Management

Admin endpoints are mounted at `/api/admin/students` and require an Admin JWT.

- `GET /` — paginated search and filters
- `POST /` — create Student with first enrollment
- `GET /:id` — Student, Parent links, Cards and enrollment history
- `PATCH /:id` — update personal/admission information
- `PATCH /:id/status` — active/inactive/transferred/graduated/suspended
- `PATCH /:id/enrollment` — move Student while preserving history
- `POST /:id/parents` — link a Parent account
- `DELETE /:id/parents/:linkId` — deactivate a Parent link
- `POST /:id/cards` — revoke the previous Card and issue a secure code

`schoolId` always comes from the authenticated Admin. The Flutter Students
screen supports creation, search, status changes, Parent linking and QR Card
generation.
