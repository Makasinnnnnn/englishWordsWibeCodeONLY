# Roadmap

## Product

- Decks and topics for class units, exams, and shared study lists.
- Public deck sharing with "copy to my dictionary".
- Study session summary with accuracy, mistakes, and words to repeat.
- Richer analytics with historical review charts and study-session summaries.
- Teacher/admin mode for preparing word sets for classmates.

## Teacher Platform

- Build a teacher workspace inspired by Uchi.ru and Yandex Textbook: classes, students, assignments, and progress dashboards.
- Let teachers create word assignments from custom word sets, CSV imports, or existing decks.
- Support assignment settings: due date, required training mode, retry policy, minimum accuracy, and whether hints are allowed.
- Give students a focused assignment page with the exact words and progress required for completion.
- Show teacher analytics by class, assignment, student, and word: completion rate, accuracy, wrong answers, typos, attempts, and time spent.
- Highlight difficult words across a class so the teacher can repeat them in lessons.
- Add invite links or class codes for students to join a teacher's class.
- Keep student privacy clear: teachers only see stats for classes where the student joined or accepted an invite.
- Start with read-only teacher analytics before adding destructive admin actions.

## Learning

- More spaced repetition tuning based on typo and wrong-answer history.
- Telegram reminders for due words.
- Tags such as `exam`, `unit-3`, and `irregular-verbs`.
- Offline-friendly dictionary view after an explicit privacy review.

## Engineering

- PostgreSQL migration guide for production.
- Redis-backed rate limiting for deployed environments.
- Planned major dependency upgrade for Next.js and ESLint after compatibility testing.
- E2E tests for auth, CRUD, CSV import/export, and training flows.
- Deployment guide for a production-like environment.
