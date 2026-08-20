# Safe Card database starter

This project converts **user accounts, demo request history, admin decisions, and sold-item state** from browser `localStorage` to a server-side SQLite database. It intentionally does **not** store payment screenshots, UPI credentials, card credentials, or other real financial data.

## Files
- `server.js` — Express server
- `db.js` — SQLite database + tables
- `user.js` — user model helpers
- `routes/auth.js` — signup/login/me + optional Google ID-token verification
- `routes/requests.js` — permanent per-user history, request submission, sold IDs
- `routes/admin.js` — admin login, request review, approve/reject
- `middleware/auth.js` — JWT authentication
- `public/index.html` — your current frontend copy
- `.env.example` — required secrets/config

## Run
1. Install Node.js 20+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Set a long random `JWT_SECRET` and a strong `ADMIN_PASSWORD`.
6. Run `npm start`.
7. Open `http://localhost:3000`.

SQLite creates `data/app.db` automatically. That file is the persistent database. Back it up if you want to preserve accounts/history across server moves.

## API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google` (optional, needs `GOOGLE_CLIENT_ID`)
- `GET /api/auth/me`
- `GET /api/history`
- `POST /api/requests`
- `GET /api/cards/sold`
- `POST /api/admin/login`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/:id`

## Important frontend note
The included `public/index.html` is the current UI copy. Its browser-local data calls still need to be switched to the API endpoints above before the database becomes the source of truth. The backend is complete and ready for that wiring.
