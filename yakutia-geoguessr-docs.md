# Документация проекта  
## Yakutia GeoGuessr (Yandex Maps)

Игра в стиле GeoGuessr для угадывания локаций в Республике Саха (Якутия).

---

## Структура проекта

yakutia-geoguessr/
│
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
├── README.md
│
├── public/
│   └── yandexAPI.txt        # API ключ Yandex Maps
│
└── src/
    ├── index.js
    ├── App.js
    ├── components/
    ├── styles/
    └── utils/

---

## Основные файлы

### .gitignore

Игнорируются:
- node_modules
- build
- .env*
- логи
- файлы с API ключами

---

### package.json

Зависимости:
- react 18
- react-dom
- react-scripts

Скрипты:
- npm start
- npm build
- npm test

---

## Установка и запуск

### 1. Установка

npm install

---

### 2. Настройка Yandex Maps API

Создать файл:

public/yandexAPI.txt

Вставить API ключ:

YOUR_YANDEX_MAPS_API_KEY

---

### 3. Подключение Yandex Maps

Пример подключения:

<script src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_YANDEX_MAPS_API_KEY&lang=ru_RU"></script>

---

### 4. Запуск

npm start

http://localhost:3000

---

## Архитектура

- App.js — основной компонент
- components — UI
- utils — логика
- styles — стили

---

## Логика игры

1. Загрузка случайной панорамы (Yandex Panorama)
2. Выбор точки
3. Расчёт расстояния
4. Начисление очков
5. 5 раундов

---

## Очки

Чем ближе к реальной точке — тем выше score.

---

## Технологии

- React
- Yandex Maps API (Panorama + Map)
- CSS3

---

## Docker

FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]

---

## Безопасность

- API ключ хранится отдельно
- .gitignore защищает от утечек

---

## Восстановление проекта

npx create-react-app yakutia-geoguessr

Заменить файлы и добавить API ключ
