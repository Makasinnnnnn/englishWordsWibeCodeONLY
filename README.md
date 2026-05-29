# Word Memory Trainer

Современное веб-приложение для изучения английских слов через личный словарь, переводы, ассоциации, изображения и постепенное исчезновение подсказок.

## Стек

- Next.js App Router
- TypeScript
- TailwindCSS
- Prisma
- SQLite
- Zod
- Controlled React components

## Запуск

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Приложение использует SQLite и локальный `.env`:

```env
DATABASE_URL="file:./dev.db"
```

## Структура проекта

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
  layout.tsx
  page.tsx
components/
  Button.tsx
  EmptyState.tsx
  Header.tsx
  HiddenHintBlock.tsx
  HintLadderTraining.tsx
  HintStepProgress.tsx
  HintVisibilityControls.tsx
  ImagePicker.tsx
  Input.tsx
  Layout.tsx
  ManualInputQuiz.tsx
  MultipleChoiceQuiz.tsx
  ProgressBar.tsx
  Select.tsx
  SettingsClient.tsx
  Sidebar.tsx
  StatsCards.tsx
  Textarea.tsx
  Toast.tsx
  TrainingCard.tsx
  TrainingSidebar.tsx
  TrainingWorkspace.tsx
  WordCard.tsx
  WordForm.tsx
lib/
  mockSuggestions.ts
  prisma.ts
  schemas.ts
  trainingSettings.ts
  wordSerializer.ts
prisma/
  schema.prisma
  seed.ts
utils/
  checkAnswer.ts
  cn.ts
  hintLadder.ts
  reviewClient.ts
  trainingQueue.ts
```

## Основная логика

- Пользователь добавляет английское слово, перевод, ассоциацию, картинку, заметки и сложность.
- Перевод предлагается mock-функцией `suggestTranslation`.
- Картинки предлагаются mock-функцией `suggestImages`; можно вставить свой URL.
- Словарь поддерживает просмотр, редактирование, удаление, тренировку конкретного слова и отметку "выучено".
- Тренировка выбирает слова сначала по меньшему `learningLevel`, затем по большему числу ошибок, затем по давности повторения.
- Ответы сохраняются через `/api/words/[id]/review`.
- `correct` повышает уровень, `typo` считает опечатку без повышения уровня, `wrong` снижает уровень.
- Уровень 5 автоматически помечает слово как выученное.

## Режимы тренировки

- Hint Ladder / Лестница подсказок
- Multiple Choice
- Manual Input
- Reverse Translation
- Image Association
- Progressive Hints

## Проверка ответа

Файл `utils/checkAnswer.ts` содержит:

- `normalizeAnswer(text)`
- `levenshteinDistance(a, b)`
- `checkAnswer(userAnswer, correctAnswer)`

`checkAnswer` возвращает:

```ts
{
  status: "correct" | "typo" | "wrong",
  distance: number,
  message: string
}
```

## Будущие улучшения

- Подключить реальный переводчик через API.
- Подключить полноценный image search API.
- Добавить авторизацию и несколько словарей.
- Добавить интервальное повторение по расписанию.
- Добавить импорт/экспорт CSV.
- Добавить синхронизацию настроек между устройствами.
