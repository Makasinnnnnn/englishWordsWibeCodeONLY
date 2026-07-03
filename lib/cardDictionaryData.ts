export const defaultCardDictionarySlug = "cefr-j-b2-card-deck";

export const defaultCardDictionary = {
  slug: defaultCardDictionarySlug,
  title: "B2 Card Deck",
  description: "Default B2-level card dictionary for swipe training.",
  level: "B2",
  sourceName: "CEFR-J Vocabulary Profile 1.5",
  sourceUrl: "https://github.com/openlanguageprofiles/olp-en-cefrj"
};

export type CardDictionarySeedWord = {
  english: string;
  transcription: string;
  translation: string;
  exampleEn: string;
  exampleRu: string;
};

export const b2CardSeedWords: CardDictionarySeedWord[] = [
  {
    english: "abandoned",
    transcription: "/əˈbændənd/",
    translation: "заброшенный",
    exampleEn: "They found an abandoned house near the river.",
    exampleRu: "Они нашли заброшенный дом рядом с рекой."
  },
  {
    english: "absorb",
    transcription: "/əbˈzɔːrb/",
    translation: "впитывать; усваивать",
    exampleEn: "Good readers absorb new ideas quickly.",
    exampleRu: "Хорошие читатели быстро усваивают новые идеи."
  },
  {
    english: "abstract",
    transcription: "/ˈæbstrækt/",
    translation: "абстрактный",
    exampleEn: "The article explains an abstract theory in simple words.",
    exampleRu: "Статья объясняет абстрактную теорию простыми словами."
  },
  {
    english: "accurate",
    transcription: "/ˈækjərət/",
    translation: "точный",
    exampleEn: "The report gives an accurate description of the problem.",
    exampleRu: "Отчёт даёт точное описание проблемы."
  },
  {
    english: "adapt",
    transcription: "/əˈdæpt/",
    translation: "адаптироваться; приспосабливать",
    exampleEn: "Students need time to adapt to a new schedule.",
    exampleRu: "Студентам нужно время, чтобы адаптироваться к новому расписанию."
  },
  {
    english: "adequate",
    transcription: "/ˈædɪkwət/",
    translation: "достаточный",
    exampleEn: "The team had adequate resources for the project.",
    exampleRu: "У команды было достаточно ресурсов для проекта."
  },
  {
    english: "adjust",
    transcription: "/əˈdʒʌst/",
    translation: "настраивать; приспосабливаться",
    exampleEn: "You can adjust the brightness in the settings.",
    exampleRu: "Яркость можно настроить в параметрах."
  },
  {
    english: "analyse",
    transcription: "/ˈænəlaɪz/",
    translation: "анализировать",
    exampleEn: "We need to analyse the results before Friday.",
    exampleRu: "Нам нужно проанализировать результаты до пятницы."
  },
  {
    english: "annual",
    transcription: "/ˈænjuəl/",
    translation: "ежегодный",
    exampleEn: "The annual meeting will take place in June.",
    exampleRu: "Ежегодная встреча состоится в июне."
  },
  {
    english: "apparent",
    transcription: "/əˈpærənt/",
    translation: "очевидный; видимый",
    exampleEn: "It became apparent that the plan needed changes.",
    exampleRu: "Стало очевидно, что план нужно изменить."
  },
  {
    english: "approach",
    transcription: "/əˈproʊtʃ/",
    translation: "подход",
    exampleEn: "This approach works well with advanced learners.",
    exampleRu: "Этот подход хорошо работает с продвинутыми учениками."
  },
  {
    english: "assumption",
    transcription: "/əˈsʌmpʃən/",
    translation: "предположение",
    exampleEn: "The decision was based on a false assumption.",
    exampleRu: "Решение было основано на ложном предположении."
  },
  {
    english: "benefit",
    transcription: "/ˈbenɪfɪt/",
    translation: "польза; преимущество",
    exampleEn: "Regular practice has a clear benefit.",
    exampleRu: "Регулярная практика имеет очевидную пользу."
  },
  {
    english: "capacity",
    transcription: "/kəˈpæsəti/",
    translation: "способность; вместимость",
    exampleEn: "The app has the capacity to store many dictionaries.",
    exampleRu: "Приложение способно хранить много словарей."
  },
  {
    english: "challenge",
    transcription: "/ˈtʃælɪndʒ/",
    translation: "вызов; сложная задача",
    exampleEn: "Speaking without notes was a real challenge.",
    exampleRu: "Говорить без заметок было настоящим вызовом."
  },
  {
    english: "collapse",
    transcription: "/kəˈlæps/",
    translation: "рушиться; крах",
    exampleEn: "The old bridge could collapse after heavy rain.",
    exampleRu: "Старый мост может рухнуть после сильного дождя."
  },
  {
    english: "complex",
    transcription: "/ˈkɑːmpleks/",
    translation: "сложный",
    exampleEn: "The teacher explained a complex topic clearly.",
    exampleRu: "Учитель понятно объяснил сложную тему."
  },
  {
    english: "concept",
    transcription: "/ˈkɑːnsept/",
    translation: "понятие; концепция",
    exampleEn: "The concept is easier to remember with examples.",
    exampleRu: "Понятие легче запомнить с примерами."
  },
  {
    english: "consequence",
    transcription: "/ˈkɑːnsəkwens/",
    translation: "последствие",
    exampleEn: "Every choice has a consequence.",
    exampleRu: "У каждого выбора есть последствие."
  },
  {
    english: "consistent",
    transcription: "/kənˈsɪstənt/",
    translation: "последовательный; стабильный",
    exampleEn: "Consistent study is better than rare long sessions.",
    exampleRu: "Стабильная учёба лучше редких длинных занятий."
  },
  {
    english: "contribute",
    transcription: "/kənˈtrɪbjuːt/",
    translation: "вносить вклад",
    exampleEn: "Everyone can contribute to the discussion.",
    exampleRu: "Каждый может внести вклад в обсуждение."
  },
  {
    english: "convert",
    transcription: "/kənˈvɜːrt/",
    translation: "преобразовывать",
    exampleEn: "The tool can convert text into flashcards.",
    exampleRu: "Инструмент может преобразовать текст в карточки."
  },
  {
    english: "criteria",
    transcription: "/kraɪˈtɪriə/",
    translation: "критерии",
    exampleEn: "The judges explained the evaluation criteria.",
    exampleRu: "Судьи объяснили критерии оценки."
  },
  {
    english: "crucial",
    transcription: "/ˈkruːʃəl/",
    translation: "решающий; крайне важный",
    exampleEn: "Sleep is crucial for memory.",
    exampleRu: "Сон крайне важен для памяти."
  },
  {
    english: "derive",
    transcription: "/dɪˈraɪv/",
    translation: "получать; происходить",
    exampleEn: "Many English words derive from Latin.",
    exampleRu: "Многие английские слова происходят из латыни."
  },
  {
    english: "device",
    transcription: "/dɪˈvaɪs/",
    translation: "устройство",
    exampleEn: "You can install the app on a mobile device.",
    exampleRu: "Приложение можно установить на мобильное устройство."
  },
  {
    english: "distinct",
    transcription: "/dɪˈstɪŋkt/",
    translation: "отчётливый; отдельный",
    exampleEn: "The two words have distinct meanings.",
    exampleRu: "У этих двух слов разные значения."
  },
  {
    english: "efficient",
    transcription: "/ɪˈfɪʃənt/",
    translation: "эффективный",
    exampleEn: "Swipe cards are an efficient way to review vocabulary.",
    exampleRu: "Свайп-карточки - эффективный способ повторять лексику."
  },
  {
    english: "emerge",
    transcription: "/ɪˈmɜːrdʒ/",
    translation: "появляться; возникать",
    exampleEn: "A pattern began to emerge from the data.",
    exampleRu: "В данных начала появляться закономерность."
  },
  {
    english: "enable",
    transcription: "/ɪˈneɪbəl/",
    translation: "позволять; включать",
    exampleEn: "The feature enables faster practice.",
    exampleRu: "Эта функция позволяет практиковаться быстрее."
  },
  {
    english: "enhance",
    transcription: "/ɪnˈhæns/",
    translation: "улучшать",
    exampleEn: "Examples enhance understanding.",
    exampleRu: "Примеры улучшают понимание."
  },
  {
    english: "evaluate",
    transcription: "/ɪˈvæljueɪt/",
    translation: "оценивать",
    exampleEn: "The teacher will evaluate our presentations.",
    exampleRu: "Учитель оценит наши презентации."
  },
  {
    english: "evidence",
    transcription: "/ˈevɪdəns/",
    translation: "доказательство",
    exampleEn: "There is strong evidence for this method.",
    exampleRu: "Есть убедительные доказательства в пользу этого метода."
  },
  {
    english: "expand",
    transcription: "/ɪkˈspænd/",
    translation: "расширять",
    exampleEn: "Reading helps expand your vocabulary.",
    exampleRu: "Чтение помогает расширять словарный запас."
  },
  {
    english: "feature",
    transcription: "/ˈfiːtʃər/",
    translation: "функция; особенность",
    exampleEn: "The main feature is swipe review.",
    exampleRu: "Главная функция - повторение свайпами."
  },
  {
    english: "flexible",
    transcription: "/ˈfleksəbəl/",
    translation: "гибкий",
    exampleEn: "A flexible schedule makes learning easier.",
    exampleRu: "Гибкое расписание облегчает обучение."
  },
  {
    english: "generate",
    transcription: "/ˈdʒenəreɪt/",
    translation: "создавать; генерировать",
    exampleEn: "The app can generate a review queue.",
    exampleRu: "Приложение может создать очередь повторения."
  },
  {
    english: "highlight",
    transcription: "/ˈhaɪlaɪt/",
    translation: "выделять; подчёркивать",
    exampleEn: "The chart highlights your progress.",
    exampleRu: "График подчёркивает твой прогресс."
  },
  {
    english: "impact",
    transcription: "/ˈɪmpækt/",
    translation: "влияние",
    exampleEn: "Daily practice has a big impact.",
    exampleRu: "Ежедневная практика оказывает большое влияние."
  },
  {
    english: "implement",
    transcription: "/ˈɪmpləment/",
    translation: "реализовывать; внедрять",
    exampleEn: "We need to implement the new design.",
    exampleRu: "Нам нужно реализовать новый дизайн."
  },
  {
    english: "indicate",
    transcription: "/ˈɪndɪkeɪt/",
    translation: "указывать",
    exampleEn: "The badge indicates the current stage.",
    exampleRu: "Значок указывает текущий этап."
  },
  {
    english: "initial",
    transcription: "/ɪˈnɪʃəl/",
    translation: "первоначальный",
    exampleEn: "The initial version is ready for testing.",
    exampleRu: "Первоначальная версия готова к тестированию."
  },
  {
    english: "interpret",
    transcription: "/ɪnˈtɜːrprət/",
    translation: "толковать; интерпретировать",
    exampleEn: "It is easy to interpret the chart.",
    exampleRu: "Этот график легко интерпретировать."
  },
  {
    english: "maintain",
    transcription: "/meɪnˈteɪn/",
    translation: "поддерживать; сохранять",
    exampleEn: "Try to maintain a learning streak.",
    exampleRu: "Старайся поддерживать серию занятий."
  },
  {
    english: "method",
    transcription: "/ˈmeθəd/",
    translation: "метод",
    exampleEn: "Spaced repetition is a useful method.",
    exampleRu: "Интервальное повторение - полезный метод."
  },
  {
    english: "obtain",
    transcription: "/əbˈteɪn/",
    translation: "получать",
    exampleEn: "You can obtain better results with practice.",
    exampleRu: "С практикой можно получить лучшие результаты."
  },
  {
    english: "occur",
    transcription: "/əˈkɜːr/",
    translation: "происходить",
    exampleEn: "Mistakes occur when we learn something new.",
    exampleRu: "Ошибки происходят, когда мы учим что-то новое."
  },
  {
    english: "perspective",
    transcription: "/pərˈspektɪv/",
    translation: "точка зрения",
    exampleEn: "The story is told from a child's perspective.",
    exampleRu: "История рассказана с точки зрения ребёнка."
  },
  {
    english: "previous",
    transcription: "/ˈpriːviəs/",
    translation: "предыдущий",
    exampleEn: "Review the previous card before moving on.",
    exampleRu: "Повтори предыдущую карточку перед тем, как идти дальше."
  },
  {
    english: "priority",
    transcription: "/praɪˈɔːrəti/",
    translation: "приоритет",
    exampleEn: "Due words have the highest priority.",
    exampleRu: "Слова, срок которых наступил, имеют высший приоритет."
  },
  {
    english: "process",
    transcription: "/ˈprɑːses/",
    translation: "процесс",
    exampleEn: "Learning is a gradual process.",
    exampleRu: "Обучение - постепенный процесс."
  },
  {
    english: "reliable",
    transcription: "/rɪˈlaɪəbəl/",
    translation: "надёжный",
    exampleEn: "A reliable system saves your progress.",
    exampleRu: "Надёжная система сохраняет твой прогресс."
  },
  {
    english: "require",
    transcription: "/rɪˈkwaɪər/",
    translation: "требовать",
    exampleEn: "Some words require more repetition.",
    exampleRu: "Некоторые слова требуют больше повторений."
  },
  {
    english: "respond",
    transcription: "/rɪˈspɑːnd/",
    translation: "отвечать; реагировать",
    exampleEn: "The card responds to a swipe gesture.",
    exampleRu: "Карточка реагирует на жест свайпа."
  },
  {
    english: "restore",
    transcription: "/rɪˈstɔːr/",
    translation: "восстанавливать",
    exampleEn: "You can restore a word to rotation.",
    exampleRu: "Слово можно вернуть в ротацию."
  },
  {
    english: "significant",
    transcription: "/sɪɡˈnɪfɪkənt/",
    translation: "значительный",
    exampleEn: "Small habits can make a significant difference.",
    exampleRu: "Небольшие привычки могут дать значительный результат."
  },
  {
    english: "specific",
    transcription: "/spəˈsɪfɪk/",
    translation: "конкретный",
    exampleEn: "Choose a specific goal for today.",
    exampleRu: "Выбери конкретную цель на сегодня."
  },
  {
    english: "strategy",
    transcription: "/ˈstrætədʒi/",
    translation: "стратегия",
    exampleEn: "A good strategy makes revision less stressful.",
    exampleRu: "Хорошая стратегия делает повторение менее стрессовым."
  },
  {
    english: "structure",
    transcription: "/ˈstrʌktʃər/",
    translation: "структура",
    exampleEn: "The structure of the lesson is simple.",
    exampleRu: "Структура урока простая."
  },
  {
    english: "sufficient",
    transcription: "/səˈfɪʃənt/",
    translation: "достаточный",
    exampleEn: "Ten minutes is sufficient for a quick review.",
    exampleRu: "Десяти минут достаточно для быстрого повторения."
  },
  {
    english: "temporary",
    transcription: "/ˈtempəreri/",
    translation: "временный",
    exampleEn: "A wrong answer creates a temporary repeat loop.",
    exampleRu: "Неверный ответ создаёт временный цикл повторения."
  },
  {
    english: "transfer",
    transcription: "/trænsˈfɜːr/",
    translation: "переносить; передавать",
    exampleEn: "You can transfer knowledge to real conversations.",
    exampleRu: "Знания можно перенести в реальные разговоры."
  },
  {
    english: "valid",
    transcription: "/ˈvælɪd/",
    translation: "действительный; обоснованный",
    exampleEn: "That is a valid reason to repeat the word.",
    exampleRu: "Это обоснованная причина повторить слово."
  }
];

export const confirmedB2CardSeedWordSet = new Set([
  "abandoned",
  "adequate",
  "approach",
  "assumption",
  "benefit",
  "challenge",
  "collapse",
  "consistent",
  "convert",
  "crucial",
  "enhance",
  "evaluate",
  "feature",
  "flexible",
  "highlight",
  "implement",
  "initial",
  "interpret",
  "perspective",
  "priority",
  "process",
  "transfer",
  "valid"
]);

export const confirmedB2CardSeedWords = b2CardSeedWords.filter((word) =>
  confirmedB2CardSeedWordSet.has(word.english.toLowerCase())
);
