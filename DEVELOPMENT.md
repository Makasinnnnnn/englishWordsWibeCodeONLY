# Development

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run seed
npm run check:config
npm run db:validate
npm run dev
```

Demo account after seeding:

```text
demo@example.com
demo-password
```

## Environment Files

Use `.env.example` as the template:

```powershell
Copy-Item .env.example .env
```

When a new environment variable is introduced:

1. Read it through `process.env`.
2. Add a safe placeholder to `.env.example`.
3. Document it in `README.md`.
4. Never commit the real value.

## Database

The project uses Prisma with SQLite for local development. Keep SQLite for easy portfolio review; use the roadmap before moving to PostgreSQL in production.

Useful commands:

```bash
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:studio
npm run check:config
```

## Auth

Users can register with email/password or Telegram. Passwords are stored as PBKDF2 hashes. Sessions are stored in the database as hashed random tokens, while the browser receives an HTTP-only cookie.

Auth endpoints use a small in-memory rate limiter. It is good enough for local/demo use; production should use Redis or another shared store.

Telegram Login Widget data is still verified in `lib/auth/telegram.ts`, but the UI uses bot deep-link login by default. This avoids the raw `Bot domain invalid` widget error when the BotFather domain, localhost, or deployment URL are not aligned.

Telegram bot login uses:

- `POST /api/auth/telegram/bot/start` to create a short-lived one-time token;
- `POST /api/auth/telegram/webhook` to receive `/start auth_<token>` from Telegram;
- `GET /api/auth/telegram/bot/status` to complete login or account linking in the browser.

The raw bot login token is only sent to the browser and Telegram deep link. The database stores its SHA-256 hash.

For deployed environments, set `TELEGRAM_WEBHOOK_SECRET` and register the webhook:

```bash
set -a
source .env
set +a

curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/auth/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Password reset uses hashed reset tokens. Without SMTP config, `lib/email/mailer.ts` prints the reset URL to the server console.

Email confirmation uses hashed verification tokens. Without SMTP config, `lib/email/mailer.ts` prints the verification URL to the server console. The signed-in app shows a resend banner until `emailVerifiedAt` is set.

`npm run check:config` checks whether Telegram, SMTP, Prisma migrations, and the database connection are ready.

## Telegram Local Development

For local bot testing:

1. Start the app with `npm run dev`.
2. Expose it through ngrok or cloudflared.
3. Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to the HTTPS tunnel URL.
4. Register the webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/auth/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

The Telegram deep link has this shape:

```text
https://t.me/<BOT_USERNAME>?start=auth_<one-time-token>
```

Do not include `@` in `TELEGRAM_BOT_USERNAME`.

## Training Scheduler

Review state lives on each word: level, streak, counts, last result, and next review date. Correct answers move reviews farther into the future, wrong answers lower the level and make the word due sooner, and typos keep the level stable.

## Analytics

Analytics lives in `lib/analytics/word-analytics.ts` and is exposed through `/analytics` and `GET /api/analytics`. It only reads words for the current `userId`.

## PWA And Themes

PWA files live in `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, and `public/icons`.

The service worker is registered only in production and does not cache `/api/*`.

Theme switching is implemented in `components/theme/ThemeToggle.tsx`. It stores `light`, `dark`, or `system` in `localStorage` and sets `data-theme` on `<html>`.

## CSV Import And Export

Settings contains CSV import/export controls. CSV columns:

```text
english,translation,association,imageUrl,notes,difficulty
```

`english` and `translation` are required. Existing words are skipped by normalized English text per user.

## Project Structure

```text
app/                  Pages and API routes
components/           UI components
components/auth/      Auth forms and account settings UI
lib/auth/             Auth helpers
lib/analytics/        Word analytics helpers
lib/training/         Review scheduler
components/pwa/       PWA registration and install prompt
components/theme/     Theme controls
lib/validation/       Zod schemas
lib/import-export/    CSV logic
utils/                Training helpers and tests
prisma/               Schema, migrations, seed
```

## Files That Must Never Be Committed

- `.env`
- `.env.local`
- `.env.production.local`
- local database files
- logs
- build output
- tokens
- API keys
- SMTP credentials
- Telegram bot tokens
- Telegram webhook secrets

## Quality Gates

```bash
npm run format
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
```

## Security Checklist

- Passwords are hashed before storage.
- Session tokens are stored as SHA-256 hashes.
- Cookies are HTTP-only, sameSite=lax, and secure in production.
- Telegram auth data is verified server-side with `TELEGRAM_BOT_TOKEN`.
- Telegram bot webhook requests use `TELEGRAM_WEBHOOK_SECRET` in deployed environments.
- Password reset tokens are stored as hashes and expire.
- Auth endpoints are rate-limited.
- Private data queries include `userId`.
- Secrets stay in `.env`.
- Account deletion deletes user-owned data through Prisma cascades.
