# Development

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run seed
npm run check:config
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
npm run db:migrate
npm run db:studio
npm run check:config
```

## Auth

Users can register with email/password or Telegram. Passwords are stored as PBKDF2 hashes. Sessions are stored in the database as hashed random tokens, while the browser receives an HTTP-only cookie.

Auth endpoints use a small in-memory rate limiter. It is good enough for local/demo use; production should use Redis or another shared store.

Telegram Login Widget data is verified in `lib/auth/telegram.ts` using the official data-check-string and HMAC-SHA256 flow. Configure the bot through BotFather `/setdomain`.

Password reset uses hashed reset tokens. Without SMTP config, `lib/email/mailer.ts` prints the reset URL to the server console.

`npm run check:config` checks whether Telegram, SMTP, Prisma migrations, and the database connection are ready.

## Training Scheduler

Review state lives on each word: level, streak, counts, last result, and next review date. Correct answers move reviews farther into the future, wrong answers lower the level and make the word due sooner, and typos keep the level stable.

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

## Quality Gates

```bash
npm run format
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
- Password reset tokens are stored as hashes and expire.
- Auth endpoints are rate-limited.
- Private data queries include `userId`.
- Secrets stay in `.env`.
- Account deletion deletes user-owned data through Prisma cascades.
