<<<<<<< HEAD
# Website Flashcard

Project co 2 phan:

- `ASM-backend`: Node.js + Express + Mongoose REST API
- `ASM-frontend`: HTML/CSS/JavaScript frontend

## Cai backend

```bash
cd ASM-backend
npm install
```

## Cau hinh ENV

File `.env.example`:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/flashcard_db
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=8000
```

Neu chua co `.env`, copy tu `.env.example` va doi `JWT_SECRET` khi chay that.

`GEMINI_API_KEY` la bat buoc neu muon dung Tro ly AI. Backend chi tra ket qua tu Gemini; neu Gemini loi hoac qua cham, API se bao loi thay vi tao card tu du lieu noi bo.

## MongoDB

Backend dung database local:

```text
mongodb://127.0.0.1:27017/flashcard_db
```

Ten collection duoc map dung:

`users`, `flashcards`, `cards`, `languages`, `levels`, `topics`, `tags`, `saved_flashcards`, `study_progress`, `study_history`.

## Chay backend

```bash
cd ASM-backend
npm run dev
```

Backend URL:

```text
http://localhost:3001
```

Neu `localhost` bi timeout tren may Windows, dung:

```text
http://127.0.0.1:3001
```

Tao hoac reset admin local:

```bash
cd ASM-backend
npm run create-admin -- admin@gmail.com admin123 Admin
```

Health check:

```text
GET http://localhost:3001/api/health
GET http://127.0.0.1:3001/api/health
```

## Chay frontend

Can chay bang local static server, khong nen mo file HTML truc tiep vi frontend dung Fetch API.

```bash
cd ASM-frontend
node .codex-static-server.js 5501
```

Sau do mo:

```text
http://127.0.0.1:5501/home.html
```

Cac trang chinh:

```text
Trang chu:     http://127.0.0.1:5501/home.html
Tao bo the:   http://127.0.0.1:5501/create-set.html
Tai khoan:    http://127.0.0.1:5501/account.html
Da luu:       http://127.0.0.1:5501/saved.html
Admin:        http://127.0.0.1:5501/admin.html
```

Frontend can goi API tai port backend dang chay. Neu dung port `3001`, mo DevTools Console va doi API URL:

```js
localStorage.setItem("API_URL", "http://127.0.0.1:3001");
location.reload();
```

## Flow chinh

- Register/Login bang JWT
- Tao/Sua/Xoa flashcard cua user
- Upload/xem/xoa anh rieng cho mat truoc va mat sau cua card
- Tao card bang tay, import Excel, hoac them card tu Tro ly AI trong trang tao bo the
- Xem/search/filter flashcard public
- Luu/bo luu flashcard
- Hoc flashcard va ghi study progress/history
- Admin duyet/tu choi/an flashcard public pending
- Admin khoa/mo khoa user

## Tao card bang AI va Excel

Trong trang:

```text
http://127.0.0.1:5501/create-set.html
```

Co 3 cach them card vao cung mot danh sach:

- Nhap bang tay bang nut `Them the`
- Upload `.xlsx`/`.xls` bang nut `Import Excel`
- Mo drawer bang nut `Tro ly AI`, nhap yeu cau roi bam `Them vao bo`

Tat ca card chi duoc luu vao MongoDB khi bam `Luu bo the`.

Excel dung sheet dau tien, toi da 200 dong du lieu. Header ho tro:

```text
front
back
front_img
back_img
color
```

`front` va `back` la bat buoc. Doi voi dong thieu du lieu, backend tra loi trong preview va khong crash server.

API moi:

```text
POST /api/assistant/vocabulary
POST /api/import/excel
```

## Upload anh card

Backend luu anh tai:

```text
ASM-backend/uploads/cards
```

Thu muc nay duoc ignore trong Git, chi giu file `.gitkeep`. API tra ve duong dan anh dang:

```text
/uploads/cards/<ten-file>
```

Frontend dung helper `getImageUrl()` de ghep URL API, khong hard-code link anh.

## Luu y

Neu user cu trong DB dang co password plain-text, backend se migrate sang bcrypt o lan login dau tien neu password khop.
=======
# DuAnFlashCard
>>>>>>> e97277513bfc775be253e252d939e04df145b706
