# API Test

Base URL:

```text
http://localhost:3001
```

Tat ca response dung format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## Auth

### Register

`POST /api/auth/register`

Token: khong can.

Body:

```json
{
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "password": "123456"
}
```

### Login

`POST /api/auth/login`

Token: khong can.

Body:

```json
{
  "email": "a@example.com",
  "password": "123456"
}
```

### Me

`GET /api/auth/me`

Token: can `Authorization: Bearer <token>`.

### Change Password

`PUT /api/auth/change-password`

Token: can.

Body:

```json
{
  "current_password": "123456",
  "new_password": "654321"
}
```

## Master Data

`GET /api/languages`

`GET /api/topics`

`GET /api/levels`

Admin token co the goi:

`POST /api/languages`

`PUT /api/languages/:id`

`DELETE /api/languages/:id`

Tuong tu voi `/api/topics` va `/api/levels`.

## Flashcards

### Public List

`GET /api/flashcards?search=english&language=<id>&topic=<id>&level=<id>&sort=newest&page=1&limit=12`

Token: khong bat buoc.

### Detail

`GET /api/flashcards/:id`

Token: khong bat buoc neu flashcard public approved. Can token neu la private/owner/admin.

### My Flashcards

`GET /api/flashcards/my`

Token: can.

### Create

`POST /api/flashcards`

Token: can.

Body:

```json
{
  "name": "English Basic",
  "description": "Basic vocabulary",
  "language_id": "OBJECT_ID",
  "topic_id": "OBJECT_ID",
  "level_id": "OBJECT_ID",
  "tag_ids": [],
  "visibility": "public",
  "cards": [
    {
      "front": "Apple",
      "back": "Qua tao",
      "front_img": "",
      "back_img": "",
      "color": "#ffffff"
    }
  ]
}
```

Neu `visibility = public`, `approval_status = pending`.

Neu `visibility = private`, `approval_status = approved` de owner hoc duoc ngay.

### Update/Delete

`PUT /api/flashcards/:id`

`DELETE /api/flashcards/:id`

Token: can. Update chi owner. Delete owner hoac admin.

## Cards

`GET /api/flashcards/:flashcardId/cards`

`POST /api/flashcards/:flashcardId/cards`

`PUT /api/cards/:id`

`DELETE /api/cards/:id`

Create/update/delete can owner token.

## Saved Flashcards

`GET /api/saved`

`POST /api/saved/:flashcardId`

`DELETE /api/saved/:flashcardId`

Token: can. Duplicate saved tra `409 Conflict`.

## Study

### Get Study Cards

`GET /api/study/:flashcardId`

Token: can.

### Review

`POST /api/study/review`

Token: can.

Body:

```json
{
  "card_id": "OBJECT_ID",
  "rating": "good"
}
```

Rating hop le: `again`, `hard`, `good`, `easy`.

### Progress

`GET /api/study/progress/:flashcardId`

Token: can.

## Admin

Tat ca `/api/admin/*` can JWT va `role = admin`.

`GET /api/admin/dashboard`

`GET /api/admin/flashcards/pending`

`GET /api/admin/flashcards?status=pending`

`GET /api/admin/flashcards?status=approved`

`GET /api/admin/flashcards?status=rejected`

`GET /api/admin/flashcards?status=hidden`

`PUT /api/admin/flashcards/:id/approve`

`PUT /api/admin/flashcards/:id/reject`

`GET /api/admin/users`

`PUT /api/admin/users/:id/lock`

`PUT /api/admin/users/:id/unlock`
