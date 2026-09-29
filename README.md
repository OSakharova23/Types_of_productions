# Лабораторная 3
# REST API веб-сервис для системы управления типами производств

## Таблицы базы данных

### 1. `users` (Пользователи)
Таблица для хранения учетных записей пользователей системы.
* `user_id` (PRIMARY KEY, INT) — уникальный идентификатор пользователя.
* `username` (VARCHAR, 100) — имя пользователя.
* `password` (VARCHAR, 100) — пароль.

### 2. `production_types` (Типы производств / Услуги)
Основная таблица для хранения информации об услугах и типах производств.
* `production_id` (PRIMARY KEY, INT) — уникальный идентификатор услуги.
* `craft_title` (VARCHAR, 150) — название ремесла / производства.
* `description` (TEXT, NULLABLE) — подробное описание.
* `status` (VARCHAR, 50) — статус записи (`draft`, `published`, `deleted`).
* `image_key` (VARCHAR) — имя файла изображения в MinIO.
* `video_key` (VARCHAR) — имя файла видео в MinIO.
* `production_output_rate` (INT, NULLABLE) — норма выхода продукции (фильтруемое поле).
* `defect_waste_quantity` (INT, NULLABLE) — количество брака и отходов.
* `created_at` (TIMESTAMP) — дата создания записи.
* `formed_at` (TIMESTAMP, NULLABLE) — дата публикации/формирования.
* `creator_id` (INT, FOREIGN KEY -> `users.user_id`) — ID создателя.

### 3. `likes` (Лайки, связь М-м)
Таблица связей между пользователями и услугами для реализации лайков.
* `id` (PRIMARY KEY, SERIAL) — ID записи.
* `user_id` (FOREIGN KEY -> `users.user_id`) — ID пользователя, поставившего лайк.
* `production_id` (FOREIGN KEY -> `production_types.production_id`) — ID услуги.

---

## Описание HTTP-методов (REST API)

| № | Метод | URL | Описание |
|---|-------|-----|----------|
| 1 | `GET` | `/api/production_types` | Получение списка опубликованных услуг с фильтрацией по норме выхода (`min_rate`, `max_rate`) и признаком `is_creator` (0/1). |
| 2 | `GET` | `/api/production_types/feed` | Получение ленты опубликованных услуг (первая карточка). |
| 3 | `GET` | `/api/production_types/feed?id=1&next=true` | Получение следующей карточки ленты по ID. |
| 4 | `GET` | `/api/production_types/draft` | Получение полей черновика текущего пользователя (не более 1). |
| 5 | `POST` | `/api/production_types` | Создание черновика + загрузка файлов изображения и видео в MinIO. |
| 6 | `PUT` | `/api/production_types/:id/publish` | Публикация черновика (смена статуса на `published`, заполнение полей). |
| 7 | `DELETE` | `/api/production_types/:id` | Мягкое удаление (soft delete, перевод в статус `deleted`) своей услуги. |
| 8 | `POST` | `/api/production_types/:id/like` | Поставить/отменить лайк (`action`: 1 — поставить, 0 — отменить). |
| 9 | `POST` | `/api/users/register` | Регистрация нового пользователя. |
| 10 | `POST` | `/api/users/login` | Аутентификация (заглушка для лабы №4). |
| 11 | `POST` | `/api/users/logout` | Деавторизация (заглушка для лабы №4). |