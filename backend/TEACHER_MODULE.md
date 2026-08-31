# Teacher Management

Admin endpoints are mounted at `/api/admin/teachers` and require an Admin JWT.

- `GET /` — search/filter Teachers with profile and active assignment count
- `POST /` — create Teacher login and employee profile
- `GET /:id` — profile plus Class/Section/Subject assignments
- `PATCH /:id` — update account/profile and optional password
- `PATCH /:id/status` — activate or deactivate Teacher login

Passwords are hashed by the existing User model and are never returned by the
API. Teacher records are restricted to the authenticated Admin's `schoolId`.
