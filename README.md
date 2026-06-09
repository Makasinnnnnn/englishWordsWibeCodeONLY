# Word Memory Trainer

Word Memory Trainer is a free vocabulary learning app for students. It helps create a personal English dictionary, practice translations, use associations and images, repeat difficult words, and track learning progress.

## Why This Project Exists

This project started as a practical fullstack pet project: small enough to understand, but real enough to show product thinking, authentication, validation, persistence, testing, and documentation.

The goal is not to imitate a huge SaaS product. The goal is a clean learning tool that classmates can actually use before English classes, tests, and exams.

## For Classmates

The app is designed as a free tool for classmates who want to prepare for English classes using personal vocabulary lists. CSV import/export makes it easy to exchange word lists without paid services.

## Features

- Email/password registration and login.
- Telegram login/register through the Telegram Login Widget.
- Telegram linking/unlinking from account settings.
- Password reset by email, with a console mailer fallback in development.
- Personal dictionary with English word, translation, association, image URL, notes, difficulty, and review state.
- Word add/edit/delete/detail flows.
- Training modes: hint ladder, multiple choice, manual input, reverse translation, image association, and progressive hints.
- Typo detection with Levenshtein distance.
- Review scheduling with level, streak, correct, wrong, typo, and next review fields.
- CSV import/export from settings.
- Account deletion with confirmation.

## Screenshots

Screenshots are intentionally not committed yet. Add real screenshots after running the app:

```text
docs/screenshots/dashboard.png
docs/screenshots/training.png
docs/screenshots/dictionary.png
docs/screenshots/account-settings.png
```

## Tech Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- SQLite
- Zod
- Vitest
- Nodemailer
- Prettier
- ESLint

## Getting Started

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run seed
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Open:

```text
http://localhost:3000
```

Demo account after seeding:

```text
demo@example.com
demo-password
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
APP_URL="https://uchi-slovo.ru"
SESSION_TTL_DAYS="30"

TELEGRAM_BOT_TOKEN=""
TELEGRAM_BOT_USERNAME=""

SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""

PASSWORD_RESET_TOKEN_TTL_MINUTES="30"
```

## Database

The project uses Prisma with SQLite for local development. Local database files such as `prisma/dev.db` are ignored by Git.

Useful commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run seed
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:watch
npm run format
npm run format:check
npm run check:config
npm run db:generate
npm run db:migrate
npm run db:studio
npm run seed
```

`npm run check:config` prints which features are enabled by the current environment:

- database connectivity and migration count;
- Telegram login readiness;
- SMTP/password reset mode;
- CSV import/export readiness.

## Project Structure

```text
app/                  Next.js pages and API routes
components/           Reusable UI, auth, word, and training components
lib/auth/             Password, session, Telegram, and reset-token helpers
lib/validation/       Zod schemas
lib/email/            Mailer abstraction
lib/import-export/    CSV parsing and export formatting
utils/                Training queue, answer checking, and hint helpers
prisma/               Prisma schema, migrations, and seed script
docs/screenshots/     Screenshots for README and portfolio review
```

## Authentication

- Passwords are hashed with PBKDF2.
- Session cookies are HTTP-only and use `sameSite=lax`.
- Session tokens are stored in the database as SHA-256 hashes.
- Telegram auth data is verified server-side with the bot token.
- Password reset tokens are stored as hashes and expire.
- Auth endpoints use in-memory rate limiting for the pet-project version.

Telegram setup:

1. Create a bot with [BotFather](https://t.me/BotFather).
2. Set the website domain with `/setdomain`: `uchi-slovo.ru`.
3. Fill `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in `.env`.

For local Telegram testing, use an HTTPS tunnel and set `APP_URL` to that URL. For regular local development without Telegram, `APP_URL="http://localhost:3000"` is fine.

Telegram reminders and bot commands are not implemented yet. They are listed in the roadmap, so no webhook URL, webhook secret, admin IDs, or channel IDs are required by the current code.

## Security And Privacy

- Secrets are read from env variables and are not committed.
- `.env*`, local SQLite databases, logs, build output, and caches are ignored.
- User-owned data is scoped by `userId`.
- Account deletion removes the user and related data through Prisma cascade rules.
- In production, replace in-memory rate limiting with Redis or Upstash.

See [SECURITY.md](./SECURITY.md) for the repository security policy.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## Author

Student pet project by the repository owner.
