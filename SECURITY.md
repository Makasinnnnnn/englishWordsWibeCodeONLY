# Security Policy

## Secrets

Never commit `.env`, API keys, Telegram bot tokens, SMTP credentials, session secrets, reset tokens, or production database URLs.

Use `.env.example` as a safe template with empty placeholders.

## Local Development

Local SQLite files, logs, build output, and cache folders are ignored by Git. Keep real credentials only in local `.env` files.

## Current Security Measures

- Passwords are hashed before storage.
- Session tokens are stored as hashes.
- Session cookies are HTTP-only and use `sameSite=lax`.
- Telegram auth data is verified server-side.
- Telegram bot webhook requests are protected with `TELEGRAM_WEBHOOK_SECRET` in deployed environments.
- Password reset tokens are stored as hashes and expire.
- Auth endpoints are rate-limited in memory for local/demo use.
- User data is scoped by `userId`.
- Account deletion is supported.

## Production Notes

- Replace in-memory rate limiting with Redis or Upstash.
- Use HTTPS and production-only secure cookies.
- Rotate any token that was ever committed to Git history.
- Keep SMTP, Telegram, and database credentials in deployment secrets.

## Reporting Issues

For this pet project, create a GitHub issue or contact the maintainer.
