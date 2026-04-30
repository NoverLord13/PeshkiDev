# PeshkiDev Backend (FastAPI)

Самостоятельный backend-сервис для фронтенда [`PeshkiDev`](../PeshkiDev). Реализует
тот же контракт API, что и оригинальный Express/Prisma-сервер, но на Python +
FastAPI + SQLAlchemy + asyncpg.

Деплоится отдельно от фронтенда, имеет собственный `Dockerfile`.

## Эндпоинты

| Метод | Путь                           | Описание                                            |
|-------|--------------------------------|-----------------------------------------------------|
| GET   | `/api/health`                  | Проверка живости + статус соединения с БД           |
| POST  | `/api/games`                   | Сохранить результат игры (создаёт/обновляет игрока) |
| GET   | `/api/leaderboard?mode=&limit=`| Получить таблицу лидеров                            |

JSON в запросах/ответах использует **camelCase** — полностью совместим с
`PeshkiDev/lib/backendApi.ts`.

### POST `/api/games`

```json
{
  "playerName": "Saysary",
  "mode": "YAKUTSK",
  "rounds": [
    { "roundNumber": 1, "score": 4321, "distanceKm": 0.42 },
    { "roundNumber": 2, "score": 3100, "distanceKm": 1.7 }
  ]
}
```

Ответ `201 Created`:

```json
{
  "id": "0f3c…",
  "playerName": "Saysary",
  "mode": "YAKUTSK",
  "totalScore": 7421,
  "averageScore": 3711,
  "totalDistanceKm": 2.12,
  "playedAt": "2026-04-28T12:34:56.789Z"
}
```

### GET `/api/leaderboard`

Параметры: `mode` (`YAKUTSK` | `SAKHA`, опционально), `limit` (1..100, по
умолчанию 20). Возвращает `{ "items": [...] }`, отсортировано по убыванию
`totalScore`, затем по возрастанию пройденного расстояния.

## Переменные окружения

См. `.env.example`.

| Переменная           | Назначение                                                          |
|----------------------|---------------------------------------------------------------------|
| `DATABASE_URL`       | Строка подключения к PostgreSQL. Поддерживается `postgresql://...`  |
| `HOST`               | Хост для uvicorn (по умолчанию `0.0.0.0`)                           |
| `PORT`               | Порт (по умолчанию `8000`)                                          |
| `CORS_ORIGIN`        | `*` или список доменов через запятую                                |
| `AUTO_CREATE_TABLES` | `true`/`false` — создавать таблицы при старте, если их нет          |

## Локальный запуск

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # отредактируйте DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

Документация Swagger UI: http://localhost:8000/docs

## Docker

```bash
docker build -t peshki-backend .
docker run --rm -p 8000:8000 \
  -e DATABASE_URL='postgresql+asyncpg://postgres:postgres@host.docker.internal:5432/peshki' \
  -e CORS_ORIGIN='http://localhost:3000' \
  peshki-backend
```

Фронтенд при сборке должен указывать на этот сервис через
`VITE_API_BASE_URL`, например `VITE_API_BASE_URL=http://localhost:8000`.

## Структура

```
backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, обработчики ошибок
│   ├── config.py          # Настройки из переменных окружения
│   ├── database.py        # Async-движок и сессии SQLAlchemy
│   ├── models.py          # Player / Game / Round
│   ├── schemas.py         # Pydantic-схемы (camelCase JSON)
│   ├── services.py        # Бизнес-логика
│   └── routers/
│       ├── health.py
│       ├── games.py
│       └── leaderboard.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── .env.example
└── README.md
```
