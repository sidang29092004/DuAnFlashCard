// ===== PHAN DA SUA 8: LOAD DU LIEU TU db.json =====
// Khi HTML nam trong thu muc views, duong dan ../db.json se tro ve file db.json o thu muc goc.
const DB_URL = "../db.json";

async function fetchDatabase(): Promise<AppDatabase> {
    if (!databasePromise) {
        databasePromise = fetch(DB_URL, { cache: "no-store" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Khong doc duoc ${DB_URL}: ${response.status}`);
            }

            return response.json() as Promise<AppDatabase>;
        });
    }

    return databasePromise;
}

function toProductTopic(value: string | undefined): ProductTopic {
    const topics: ProductTopic[] = ["ngon-ngu", "khoa-hoc", "cong-nghe", "lich-su", "toan-hoc"];
    return topics.includes(value as ProductTopic) ? (value as ProductTopic) : "cong-nghe";
}

function toProductLevel(value: string | undefined): ProductLevel {
    const levels: ProductLevel[] = ["co-ban", "trung-cap", "nang-cao"];
    return levels.includes(value as ProductLevel) ? (value as ProductLevel) : "co-ban";
}

function toLanguageCode(value: string | undefined): ProductLanguageCode {
    const languages: ProductLanguageCode[] = ["vi", "en", "de", "fr", "ja"];
    return languages.includes(value as ProductLanguageCode) ? (value as ProductLanguageCode) : "vi";
}

function findById<T>(items: T[], key: keyof T, value: number): T | undefined {
    return items.find((item) => item[key] === value);
}

function getFlashcardIdFromUrl(): number | null {
    const rawId = new URLSearchParams(window.location.search).get("id");
    const id = Number(rawId);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function getSelectedFlashcardRecord(db: AppDatabase): FlashcardRecord | null {
    const requestedId = getFlashcardIdFromUrl();
    const requestedRecord = requestedId
        ? db.Flashcard.find((flashcard) => flashcard.id_Flashcard === requestedId)
        : null;

    return (
        requestedRecord ??
        db.Flashcard.find((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public") ??
        db.Flashcard[0] ??
        null
    );
}

function buildFlashcardProduct(db: AppDatabase, flashcard: FlashcardRecord): SanPhamFlashcard {
    const topic = findById(db.Topic, "id_Topic", flashcard.id_topic);
    const level = findById(db.Level, "id_level", flashcard.id_level);
    const language = findById(db.Language, "id_language", flashcard.id_language);
    const cardCount = db.Card.filter((card) => card.id_flashcard === flashcard.id_Flashcard).length;

    return new SanPhamFlashcard({
        id: flashcard.id_Flashcard,
        title: flashcard.name,
        description: flashcard.Description,
        cardCount,
        topic: toProductTopic(topic?.name),
        level: toProductLevel(level?.name),
        frontLanguage: toLanguageCode(language?.code),
        backLanguage: "vi",
        status: flashcard.approval_status,
        detailUrl: `detailFlashcard.html?id=${flashcard.id_Flashcard}`,
        studyUrl: `study.html?id=${flashcard.id_Flashcard}`,
    });
}

function getCardsForFlashcard(db: AppDatabase, flashcardId: number): FlashcardTerm[] {
    return db.Card
        .filter((card) => card.id_flashcard === flashcardId)
        .map((card) => ({
            id: card.id_card,
            front: card.front,
            front_img: card.front_img,
            back: card.back,
            back_img: card.back_img,
        }));
}

function getFlashcardCards(db: AppDatabase, flashcardId: number): CardRecord[] {
    return db.Card.filter((card) => card.id_flashcard === flashcardId);
}

function getFlashcardCardCount(db: AppDatabase, flashcardId: number): number {
    return getFlashcardCards(db, flashcardId).length;
}

function getCurrentUser(db: AppDatabase): UserRecord | null {
    const savedEmail = localStorage.getItem("userEmail")?.toLowerCase();
    const loggedInUser = savedEmail ? db.User.find((user) => user.email.toLowerCase() === savedEmail) : null;

    return loggedInUser ?? db.User.find((user) => user.role === "user") ?? db.User[0] ?? null;
}

function getUserName(db: AppDatabase, userId: number): string {
    return findById(db.User, "id_user", userId)?.name ?? "Nguoi dung";
}

function getUserEmail(db: AppDatabase, userId: number): string {
    return findById(db.User, "id_user", userId)?.email ?? "unknown@example.com";
}

function getTopicLabel(db: AppDatabase, topicId: number): string {
    return findById(db.Topic, "id_Topic", topicId)?.label ?? "Khac";
}

function getLevelLabel(db: AppDatabase, levelId: number): string {
    return findById(db.Level, "id_level", levelId)?.label ?? "Chua xep cap";
}

function getLevelClass(db: AppDatabase, levelId: number): string {
    const levelName = findById(db.Level, "id_level", levelId)?.name;
    return levelName === "nang-cao" ? "nang-cao" : "trung-cap";
}

function getLanguageName(db: AppDatabase, languageId: number): string {
    return findById(db.Language, "id_language", languageId)?.name ?? "Ngôn ngữ";
}

function getFlashcardStatusClass(flashcard: FlashcardRecord): ProductStatus {
    if (flashcard.visibility === "private") return "private";
    return flashcard.approval_status;
}

function getFlashcardStatusLabel(flashcard: FlashcardRecord): string {
    const labels: Record<ProductStatus, string> = {
        private: "Rieng tu",
        pending: "Cho duyet",
        approved: "Cong khai",
        rejected: "Bi tu choi",
    };

    return labels[getFlashcardStatusClass(flashcard)];
}

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("vi-VN").format(date);
}

async function loadAppData(): Promise<boolean> {
    try {
        const db = await fetchDatabase();
        appDatabase = db;
        currentFlashcardRecord = getSelectedFlashcardRecord(db);
        currentFlashcardProduct = currentFlashcardRecord ? buildFlashcardProduct(db, currentFlashcardRecord) : null;
        currentTerms = currentFlashcardProduct ? getCardsForFlashcard(db, currentFlashcardProduct.id) : [];
        currentStudyCards = [...currentTerms];
        publicFlashcardProducts = db.Flashcard
            .filter((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public")
            .map((flashcard) => buildFlashcardProduct(db, flashcard));
        detailCurrentCard = 0;
        studyCurrentIndex = 0;
        return true;
    } catch (error) {
        console.error(error);
        showDataLoadError();
        return false;
    }
}

function showDataLoadError(): void {
    const cardsGrid = byId("cardsGrid");
    if (cardsGrid) {
        cardsGrid.innerHTML = `
            <div class="card" style="cursor:default;">
                <div class="card-header">
                    <h3 class="card-title">Khong tai duoc du lieu</h3>
                </div>
                <div class="card-divider"></div>
                <p class="card-desc">Hay chay bang local server de trinh duyet doc duoc file db.json.</p>
            </div>
        `;
    }

    const pagination = byId("homePagination");
    if (pagination) {
        pagination.classList.add("hidden");
        pagination.innerHTML = "";
    }
}
