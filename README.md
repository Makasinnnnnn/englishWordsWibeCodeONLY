# Word Memory Trainer

Word Memory Trainer is a local web app for learning English words through a personal dictionary, translations, associations, images, progressive hints, multiple choice, and manual answer checks.

The project is designed as a stable MVP that works without paid APIs. Translation and image suggestions are mock-based and can be replaced later with real providers.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- SQLite
- Zod
- Vitest
- Controlled React components

## Features

- Personal dictionary with English word, translation, association, image, notes, difficulty, and progress.
- Dashboard with stats, quick actions, due words, and recent words.
- Word add/edit/delete/detail flows.
- Duplicate protection through `englishNormalized`.
- Mock translation suggestions.
- Mock image suggestions and manual image URL input.
- Training sidebar with hint visibility settings.
- Training modes:
  - Hint Ladder
  - Multiple Choice
  - Manual Input
  - Reverse Translation
  - Image Association
  - Progressive Hints
- Levenshtein typo detection.
- Review progress with level, streak, review count, last result, and next review date.
- Dictionary search, filters, and sorting.
- Local training settings saved in `localStorage`.

## Screenshots

Add screenshots here after running the app:

```text
docs/screenshots/dashboard.png
docs/screenshots/training.png
docs/screenshots/dictionary.png
```

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

On Windows PowerShell, if `cp` is not available:

```powershell
Copy-Item .env.example .env
```

Default `.env`:

```env
DATABASE_URL="file:./dev.db"
```

The app runs at:

```text
http://localhost:3000
```

If port 3000 is busy, Next.js will use the next free port.

## Quality Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Prisma

Schema:

```text
prisma/schema.prisma
```

Seed:

```bash
npm run seed
```

Demo words:

- apple
- book
- river
- cloud
- fire

## Project Structure

```text
app/
  api/
    suggest/images/route.ts
    suggest/translation/route.ts
    words/route.ts
    words/[id]/route.ts
    words/[id]/review/route.ts
  settings/page.tsx
  training/page.tsx
  training/[id]/page.tsx
  words/page.tsx
  words/new/page.tsx
  words/[id]/page.tsx
  words/[id]/edit/page.tsx
components/
  HintLadderTraining.tsx
  ManualInputQuiz.tsx
  MultipleChoiceQuiz.tsx
  TrainingWorkspace.tsx
  WordForm.tsx
  WordCard.tsx
  WordListClient.tsx
lib/
  apiResponse.ts
  mockSuggestions.ts
  prisma.ts
  schemas.ts
  trainingSettings.ts
  wordLogic.ts
  wordSerializer.ts
utils/
  checkAnswer.ts
  hintLadder.ts
  reviewClient.ts
  trainingQueue.ts
```

## Training Logic

Words are prioritized by:

1. Not learned first.
2. Due now or missing `nextReviewAt`.
3. Lower `learningLevel`.
4. Higher `wrongCount`.
5. Older `lastReviewedAt`.

Shuffle, when enabled, only breaks ties inside the priority queue instead of destroying the learning priority.

Review results:

- `correct`: increments correct count, review count, streak, level, and schedules a later review.
- `typo`: increments typo count and review count, keeps level and streak.
- `wrong`: increments wrong count and review count, resets streak, lowers level, and schedules a sooner review.

Level intervals:

- 0: today
- 1: tomorrow
- 2: in 2 days
- 3: in 4 days
- 4: in 7 days
- 5: in 14 days

## What Works Now

- App starts locally.
- Prisma migrations and seed work.
- TypeScript, ESLint, tests, and production build pass.
- CRUD dictionary works.
- Duplicate words are rejected.
- Training updates progress through API.
- Hint Ladder requires manual input on the final stage.
- Multiple Choice and Manual Input no longer allow easy progress through self-rating buttons.

## Future Improvements

- Real translation API integration.
- Real image search API integration.
- User accounts and multiple dictionaries.
- CSV import/export.
- Scheduled review calendar.
- More tests for API routes and React components.
