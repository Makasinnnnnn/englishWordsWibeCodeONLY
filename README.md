# Word Memory Trainer

Word Memory Trainer is a free Web/PWA vocabulary learning app for students. The default screen is the swipe-card training workspace, so a user can open the app and start learning immediately.

## Why This Project Exists

This project started as a practical fullstack pet project: small enough to understand, but real enough to show product thinking, authentication, validation, persistence, testing, and documentation.

The goal is not to imitate a huge SaaS product. The goal is a clean learning tool that classmates can actually use before English classes, tests, and exams.

## For Classmates

The app is designed as a free tool for classmates who want to prepare for English classes using personal vocabulary lists. CSV import/export makes it easy to exchange word lists without paid services.

## Features

- Email/password registration and login.
- Email confirmation after registration, with resend from the signed-in app.
- Telegram login/register through a Telegram bot deep link.
- Telegram linking/unlinking from account settings.
- Password reset by email, with a console mailer fallback in development.
- Personal dictionary with English word, translation, association, image URL, notes, difficulty, and review state.
- Word add/edit/delete/detail flows.
- Training modes: hint ladder, multiple choice, manual input, reverse translation, image association, and progressive hints.
- Typo detection with Levenshtein distance, answer variants, punctuation normalization, and short-answer safeguards.
- Review scheduling with level, streak, correct, wrong, typo, and next review fields.
- Analytics page with accuracy, due words, weekly activity, and hardest words.
- Swipe-card dictionary training as the main app screen.
- Active card dictionary selection stored per user.
- Local dictionary catalog with download/update/select/reset controls.
- Dictionary updates preserve progress for matching words and archive removed words.
- Server-side card translation/example API with Yandex, Google, and fallback modes.
- Analytics dashboard for the active dictionary with instant statistics and period filters: today, 7 days, 30 days, 90 days, and all time.
- Daily content page with text, translation, source, and video subtitle status.
- Minimal `/admin/daily` panel for manually managing content of the day.
- CSV import/export from settings.
- Authenticated translation and image suggestion endpoints for word creation.
- Light, dark, and system theme switching.
- Installable PWA shell for mobile home screens.
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
npm run build
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
NEXT_PUBLIC_APP_URL="https://uchi-slovo.ru"
SESSION_SECRET="change-me-in-production"
ADMIN_PASSWORD=""
SESSION_TTL_DAYS="30"
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES="1440"

TELEGRAM_BOT_TOKEN=""
TELEGRAM_BOT_USERNAME=""
TELEGRAM_WEBHOOK_SECRET=""

SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""

PASSWORD_RESET_TOKEN_TTL_MINUTES="30"

TRANSLATE_PROVIDER="auto"
YANDEX_TRANSLATE_API_KEY=""
YANDEX_TRANSLATE_FOLDER_ID=""
GOOGLE_TRANSLATE_API_KEY=""
YOUTUBE_API_KEY=""
```

`TRANSLATE_PROVIDER` can be `auto`, `yandex`, or `google`. Without translation keys the app returns a safe fallback response and keeps the UI usable. `YOUTUBE_API_KEY` is optional; when it is absent, daily videos are selected from trusted learning channels and marked as likely to have English subtitles.

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
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:studio
npm run seed
```

`npm run check:config` prints which features are enabled by the current environment:

- database connectivity and migration count;
- Telegram login and webhook readiness;
- SMTP/password reset mode;
- CSV import/export readiness.

## Project Structure

```text
app/                  Next.js pages and API routes
components/           Reusable UI, auth, word, and training components
lib/auth/             Password, session, Telegram, and reset-token helpers
lib/analytics/        Word analytics calculations
lib/dictionaries/     Active dictionary and catalog sync helpers
lib/translate/        Server-side card translation providers
lib/training/         Review scheduling logic
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
- Email verification tokens are stored as SHA-256 hashes and expire.
- Telegram Login Widget auth data can be verified server-side, but the UI uses the bot deep-link flow by default to avoid domain-widget failures in local/dev environments.
- Telegram bot login uses one-time hashed login tokens and a webhook secret.
- Password reset tokens are stored as hashes and expire.
- Auth endpoints use in-memory rate limiting for the pet-project version.

Telegram setup:

1. Create a bot with [BotFather](https://t.me/BotFather).
2. Set the website domain with `/setdomain`: `uchi-slovo.ru`.
3. Fill `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` without `@`, and `TELEGRAM_WEBHOOK_SECRET` in `.env`.
4. Register the webhook after deployment:

```bash
set -a
source .env
set +a

curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/api/auth/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Check it:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

For local Telegram testing, use an HTTPS tunnel and set `APP_URL` to that URL. For regular local development without Telegram, `APP_URL="http://localhost:3000"` is fine.

Telegram learning reminders and rich bot commands are not implemented yet. They are listed in the roadmap.

## Email Confirmation

After email/password registration, the app creates a hashed verification token and sends a confirmation link to `/verify-email?token=...`.

If SMTP is not configured, the link is printed in the server console. Signed-in users with an unverified email see a banner with a resend button.

## Mobile And PWA

The app includes:

- responsive auth, dashboard, dictionary, training, settings, and analytics layouts;
- mobile bottom navigation for the main app sections;
- `public/manifest.webmanifest`;
- PWA icons in `public/icons`;
- a small service worker that caches static assets and the offline fallback, but does not cache `/api/*`;
- an install prompt with iOS instructions.

## Card Dictionaries

The card trainer uses `Dictionary`, `DictionaryWord`, and `CardProgress` models. Each user has an active dictionary. If the selected dictionary is missing, the app falls back to the default B2 dictionary and stores it as active.

Settings include a dictionary catalog loaded from `public/dictionaries/catalog.json`. A dictionary can be downloaded, updated, selected as active, or reset. Updates match words by normalized English key, keep existing `CardProgress`, add new words, and mark removed words as archived instead of deleting them.

## Card Translation API

Cards can request examples through `POST /api/cards/translate`. The route accepts `word`, optional `wordId`, `sourceLang`, `targetLang`, and context. API keys stay server-side. Provider order is controlled by `TRANSLATE_PROVIDER`; without keys the route returns fallback content instead of failing.

## Analytics

`/analytics` shows momentary statistics for the active dictionary: total words, learned, rotation, known, left, due now, reviewed today, learned today, and progress percent. Period buttons recalculate reviews, new words moved into rotation, learned words, activity, and charts by day.

Card actions create `CardReviewEvent` rows, so period charts are based on real user activity rather than a single updated timestamp.

## Daily Content

`/daily` first reads active manual content from the database. If none exists, it uses the parser/fallback. Videos are selected only when English subtitles are confirmed or likely. The UI shows one of:

- Английские субтитры подтверждены
- Субтитры вероятно доступны
- Субтитры не подтверждены

`/admin/daily` is a small admin page for creating or editing the content of the day. It supports English text, Russian translation, sources, video fields, subtitle status, publication date, and active state. Set `ADMIN_PASSWORD` to protect it with a simple password form; without it, authenticated local development users can open it.

On iOS, open the site in Safari, tap Share, then choose "Add to Home Screen".

## Theme Switching

Use the theme control in the header or account settings. Supported modes:

- light;
- dark;
- system.

The preference is saved in `localStorage`.

## Security And Privacy

- Secrets are read from env variables and are not committed.
- `.env*`, local SQLite databases, logs, build output, and caches are ignored.
- User-owned data is scoped by `userId`.
- Word update, delete, review, import, export, analytics, and suggestion APIs require the current user.
- Email verification, password reset, session, and Telegram login tokens are stored hashed.
- Account deletion removes the user and related data through Prisma cascade rules.
- In production, replace in-memory rate limiting with Redis or Upstash.

See [SECURITY.md](./SECURITY.md) for the repository security policy.

## Roadmap

See [ROADMAP.md](./ROADMAP.md).

## Author

Student pet project by the repository owner.
