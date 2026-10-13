"use strict";
const DB_URL = "../db.json";
async function fetchDatabase() {
    if (!databasePromise) {
        databasePromise = fetch(DB_URL, { cache: "no-store" }).then((response) => {
            if (!response.ok) {
                throw new Error(`Khong doc duoc ${DB_URL}: ${response.status}`);
            }
            return response.json();
        });
    }
    return databasePromise;
}
function toProductTopic(value) {
    const topics = ["ngon-ngu", "khoa-hoc", "cong-nghe", "lich-su", "toan-hoc"];
    return topics.includes(value) ? value : "cong-nghe";
}
function toProductLevel(value) {
    const levels = ["co-ban", "trung-cap", "nang-cao"];
    return levels.includes(value) ? value : "co-ban";
}
function toLanguageCode(value) {
    const languages = ["vi", "en", "de", "fr", "ja"];
    return languages.includes(value) ? value : "vi";
}
function findById(items, key, value) {
    return items.find((item) => item[key] === value);
}
function getFlashcardIdFromUrl() {
    const rawId = new URLSearchParams(window.location.search).get("id");
    const id = Number(rawId);
    return Number.isInteger(id) && id > 0 ? id : null;
}
function getSelectedFlashcardRecord(db) {
    const requestedId = getFlashcardIdFromUrl();
    const requestedRecord = requestedId
        ? db.Flashcard.find((flashcard) => flashcard.id_Flashcard === requestedId)
        : null;
    return (requestedRecord ??
        db.Flashcard.find((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public") ??
        db.Flashcard[0] ??
        null);
}
function buildFlashcardProduct(db, flashcard) {
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
function getCardsForFlashcard(db, flashcardId) {
    return db.Card
        .filter((card) => card.id_flashcard === flashcardId)
        .map((card) => ({
        id: card.id_card,
        front: card.front,
        front_img: card.front_img || "",
        back: card.back,
        back_img: card.back_img || "",
    }));
}
function getFlashcardCards(db, flashcardId) {
    return db.Card.filter((card) => card.id_flashcard === flashcardId);
}
function getFlashcardCardCount(db, flashcardId) {
    return getFlashcardCards(db, flashcardId).length;
}
function getCurrentUser(db) {
    const savedEmail = localStorage.getItem("userEmail")?.toLowerCase();
    const loggedInUser = savedEmail ? db.User.find((user) => user.email.toLowerCase() === savedEmail) : null;
    return loggedInUser ?? db.User.find((user) => user.role === "user") ?? db.User[0] ?? null;
}
function getUserName(db, userId) {
    return findById(db.User, "id_user", userId)?.name ?? "Nguoi dung";
}
function getUserEmail(db, userId) {
    return findById(db.User, "id_user", userId)?.email ?? "unknown@example.com";
}
function getTopicLabel(db, topicId) {
    return findById(db.Topic, "id_Topic", topicId)?.label ?? "Khac";
}
function getLevelLabel(db, levelId) {
    return findById(db.Level, "id_level", levelId)?.label ?? "Chua xep cap";
}
function getLevelClass(db, levelId) {
    const levelName = findById(db.Level, "id_level", levelId)?.name;
    return levelName === "nang-cao" ? "nang-cao" : "trung-cap";
}
function getLanguageName(db, languageId) {
    return findById(db.Language, "id_language", languageId)?.name ?? "Ngôn ngữ";
}
function getFlashcardStatusClass(flashcard) {
    if (flashcard.visibility === "private")
        return "private";
    return flashcard.approval_status;
}
function getFlashcardStatusLabel(flashcard) {
    const labels = {
        private: "Rieng tu",
        pending: "Cho duyet",
        approved: "Cong khai",
        rejected: "Bi tu choi",
    };
    return labels[getFlashcardStatusClass(flashcard)];
}
function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "";
    return new Intl.DateTimeFormat("vi-VN").format(date);
}
async function loadAppData() {
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
    }
    catch (error) {
        console.error(error);
        showDataLoadError();
        return false;
    }
}
function showDataLoadError() {
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

function getFlashcardIdFromUrl() {
    return new URLSearchParams(window.location.search).get("id");
}

function getRefId(value) {
    if (!value)
        return "";
    return typeof value === "object" ? value._id || "" : value;
}

function getRefName(value, fallback = "") {
    if (!value)
        return fallback;
    if (typeof value === "object")
        return value.name || value.email || fallback;
    return fallback || String(value);
}

function normalizeLevelCode(name) {
    const value = String(name || "").toLowerCase();
    if (value.includes("nang") || value.includes("advanced"))
        return "nang-cao";
    if (value.includes("trung") || value.includes("intermediate"))
        return "trung-cap";
    return "co-ban";
}

function normalizeLanguageCode(language) {
    const code = typeof language === "object" ? language.code : "";
    return ["vi", "en", "de", "fr", "ja"].includes(code) ? code : "en";
}

function buildFlashcardProduct(flashcard) {
    const languageId = getRefId(flashcard.language_id);
    const topicId = getRefId(flashcard.topic_id);
    const levelId = getRefId(flashcard.level_id);
    const product = new SanPhamFlashcard({
        id: flashcard._id,
        title: flashcard.name,
        description: flashcard.description || "",
        cardCount: flashcard.cards_count || 0,
        topic: topicId,
        level: normalizeLevelCode(getRefName(flashcard.level_id)),
        frontLanguage: normalizeLanguageCode(flashcard.language_id),
        backLanguage: "vi",
        status: flashcard.visibility === "private" ? "private" : flashcard.approval_status,
        detailUrl: `detailFlashcard.html?id=${flashcard._id}`,
        studyUrl: `study.html?id=${flashcard._id}`,
        topicId,
        languageId,
        levelId,
        creatorName: getRefName(flashcard.user_id, "Nguoi dung"),
        isSaved: Boolean(flashcard.is_saved),
        levelLabelText: getRefName(flashcard.level_id, "Cấp độ"),
        frontLanguageName: getRefName(flashcard.language_id, "Ngôn ngữ"),
        backLanguageName: "Tiếng Việt",
    });

    return product;
}

function getCardsForFlashcard(data, flashcardId) {
    const cards = Array.isArray(data) ? data : data?.cards || [];
    return cards.map((card) => ({
        id: card._id,
        front: card.front || "",
        front_img: card.front_img || "",
        back: card.back || "",
        back_img: card.back_img || "",
        color: card.color || "#ffffff",
        position: card.position || 0,
    }));
}

function getFlashcardCards(dbOrFlashcard, flashcardId) {
    if (Array.isArray(dbOrFlashcard))
        return dbOrFlashcard;
    if (dbOrFlashcard?.cards)
        return dbOrFlashcard.cards;
    return [];
}

function getFlashcardCardCount(dbOrFlashcard, flashcardId) {
    return getFlashcardCards(dbOrFlashcard, flashcardId).length;
}

function getCurrentUser() {
    currentUser = getStoredUser();
    return currentUser;
}

function getUserName(db, userId) {
    return typeof userId === "object" ? userId.name || "Nguoi dung" : "Nguoi dung";
}

function getUserEmail(db, userId) {
    return typeof userId === "object" ? userId.email || "unknown@example.com" : "unknown@example.com";
}

function getTopicLabel(db, topicId) {
    return typeof topicId === "object" ? topicId.name || "Khac" : "Khac";
}

function getLevelLabel(db, levelId) {
    return typeof levelId === "object" ? levelId.name || "Chua xep cap" : "Chua xep cap";
}

function getLevelClass(db, levelId) {
    return normalizeLevelCode(typeof levelId === "object" ? levelId.name : levelId);
}

function getLanguageName(db, languageId) {
    return typeof languageId === "object" ? languageId.name || "Ngôn ngữ" : "Ngôn ngữ";
}

function getFlashcardStatusClass(flashcard) {
    if (flashcard.visibility === "private")
        return "private";
    return flashcard.approval_status;
}

function getFlashcardStatusLabel(flashcard) {
    const labels = {
        private: "Rieng tu",
        pending: "Cho duyet",
        approved: "Cong khai",
        rejected: "Bi tu choi",
    };
    return labels[getFlashcardStatusClass(flashcard)] || "Khong ro";
}

async function loadLookupData() {
    const [languages, topics, levels] = await Promise.all([
        apiRequest("/api/languages"),
        apiRequest("/api/topics"),
        apiRequest("/api/levels"),
    ]);

    lookupData = {
        languages: languages.data?.items || [],
        topics: topics.data?.items || [],
        levels: levels.data?.items || [],
    };

    return lookupData;
}

function fillSelectOptions(id, items, placeholder) {
    const select = byId(id);
    if (!select)
        return;

    const selected = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>` + items
        .map((item) => `<option value="${item._id}">${escapeHtml(item.name || item.code || "Khac")}</option>`)
        .join("");
    if (selected)
        select.value = selected;
}

function renderLookupOptions() {
    fillSelectOptions("filterLang", lookupData.languages, "Ngôn ngữ");
    fillSelectOptions("filterTopic", lookupData.topics, "Chủ đề");
    fillSelectOptions("filterLevel", lookupData.levels, "Cấp độ");
    fillSelectOptions("setMainLang", lookupData.languages, "Chọn ngôn ngữ");
    fillSelectOptions("frontLang", lookupData.languages, "Mặt trước");
    fillSelectOptions("backLang", lookupData.languages, "Mặt sau");
    fillSelectOptions("setTopic", lookupData.topics, "Chọn chủ đề");
    fillSelectOptions("setLevel", lookupData.levels, "Chọn cấp độ");
}

async function loadPublicFlashcardsFromApi(params = {}) {
    const response = await apiRequest(`/api/flashcards${buildQuery({
        page: params.page || homeCurrentPage,
        limit: params.limit || HOME_PAGE_SIZE,
        search: params.search,
        language: params.language,
        topic: params.topic,
        level: params.level,
        sort: params.sort,
    })}`);
    publicFlashcardProducts = (response.data?.flashcards || []).map(buildFlashcardProduct);
    homeFilteredProducts = publicFlashcardProducts;
    homePagination = response.data?.pagination || homePagination;
    homeCurrentPage = homePagination.page || homeCurrentPage;
    return true;
}

async function loadFlashcardDetailFromApi(id) {
    const response = await apiRequest(`/api/flashcards/${id}`);
    currentFlashcardRecord = response.data?.flashcard || null;
    currentFlashcardProduct = currentFlashcardRecord ? buildFlashcardProduct(currentFlashcardRecord) : null;
    currentTerms = getCardsForFlashcard(response.data || {}, id);
    currentStudyCards = [...currentTerms];
    detailCurrentCard = 0;
    studyCurrentIndex = 0;
    return Boolean(currentFlashcardRecord);
}

async function loadStudyCardsFromApi(id) {
    const response = await apiRequest(`/api/study/${id}`);
    currentFlashcardRecord = response.data?.flashcard || null;
    currentFlashcardProduct = currentFlashcardRecord ? buildFlashcardProduct(currentFlashcardRecord) : null;
    currentStudyCards = getCardsForFlashcard(response.data?.cards || [], id);
    currentTerms = [...currentStudyCards];
    studyCurrentIndex = 0;
    return true;
}

async function loadAppData() {
    try {
        await loadLookupData();
        renderLookupOptions();

        const id = getFlashcardIdFromUrl();
        if (id && byId("studyCard")) {
            return await loadStudyCardsFromApi(id);
        }

        if (id && byId("termList")) {
            return await loadFlashcardDetailFromApi(id);
        }

        if (byId("cardsGrid")) {
            return await loadPublicFlashcardsFromApi();
        }

        return true;
    }
    catch (error) {
        console.error(error);
        showDataLoadError();
        return false;
    }
}
