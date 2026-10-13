"use strict";
function updateCardCount() {
    const count = queryAll(".card-editor-item").length;
    setText(byId("cardCount"), `(${count} thẻ)`);
    setText(byId("saveBarCardCount"), `${count} thẻ`);
    setDisplay(byId("emptyCardState"), count === 0 ? "flex" : "none");
}
function renumberCards() {
    queryAll(".card-editor-item").forEach((item, index) => {
        setText(item.querySelector(".card-num"), `Thẻ ${index + 1}`);
    });
}
function addCard() {
    const list = byId("cardEditorList");
    if (!list)
        return;
    const item = document.createElement("div");
    item.className = "card-editor-item";
    item.innerHTML = `
        <div class="card-editor-item-header">
            <span class="card-num">Thẻ ${list.children.length + 1}</span>
            <button class="btn-remove-card" onclick="removeCard(this)" title="Xóa thẻ">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="card-editor-inputs">
            <div class="card-input-field">
                <label>Mặt trước (Thuật ngữ)</label>
                <input type="text" placeholder="Nhập thuật ngữ..." class="card-front-input">
            </div>
            <div class="card-input-field">
                <label>Mặt sau (Định nghĩa)</label>
                <textarea placeholder="Nhập định nghĩa hoặc bản dịch..." rows="2" class="card-back-input"></textarea>
            </div>
        </div>
    `;
    list.appendChild(item);
    updateCardCount();
    item.querySelector(".card-front-input")?.focus();
    renumberCards();
}
function removeCard(btn) {
    btn.closest(".card-editor-item")?.remove();
    renumberCards();
    updateCardCount();
}
function initCreateSetPage() {
    if (!byId("cardEditorList"))
        return;
    on(byId("btnAddCard"), "click", addCard);
    on(byId("publicToggle"), "change", (event) => {
        const checkbox = event.currentTarget;
        const isPublic = checkbox.checked;
        const badge = byId("statusBadge");
        byId("publicOptions")?.classList.toggle("show", isPublic);
        if (!badge)
            return;
        badge.textContent = isPublic ? "Chờ duyệt" : "Riêng tư";
        badge.className = isPublic ? "status-badge-inline pending" : "status-badge-inline private";
    });
    on(byId("btnSaveSet"), "click", () => {
        const titleInput = byId("setTitle");
        const title = titleInput?.value.trim() ?? "";
        if (!title) {
            alert("Vui lòng nhập tên bộ thẻ!");
            titleInput?.focus();
            return;
        }
        const isPublic = byId("publicToggle")?.checked ?? false;
        if (isPublic) {
            const topic = inputValue("setTopic");
            const level = inputValue("setLevel");
            const lang = inputValue("setMainLang");
            if (!topic || !level || !lang) {
                alert("Vui lòng điền đầy đủ thông tin Chủ đề, Cấp độ và Ngôn ngữ để công khai bộ thẻ!");
                return;
            }
        }
        alert(`Lưu bộ thẻ thành công!\n${isPublic ? "Bộ thẻ đang chờ Admin duyệt để xuất hiện công khai." : "Bộ thẻ đã lưu ở chế độ riêng tư."}`);
        window.location.href = "account.html";
    });
    updateCardCount();
    addCard();
}

function addCard(front = "", back = "") {
    const list = byId("cardEditorList");
    if (!list)
        return;
    const item = document.createElement("div");
    item.className = "card-editor-item";
    item.innerHTML = `
        <div class="card-editor-item-header">
            <span class="card-num">The ${list.children.length + 1}</span>
            <button class="btn-remove-card" onclick="removeCard(this)" title="Xoa the">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="card-editor-inputs">
            <div class="card-input-field">
                <label>Mặt trước (Thuật ngữ)</label>
                <input type="text" placeholder="Nhap thuat ngu..." class="card-front-input" value="${escapeAttribute(front)}">
            </div>
            <div class="card-input-field">
                <label>Mặt sau (Định nghĩa)</label>
                <textarea placeholder="Nhap dinh nghia hoac ban dich..." rows="2" class="card-back-input">${escapeHtml(back)}</textarea>
            </div>
        </div>
    `;
    list.appendChild(item);
    updateCardCount();
    item.querySelector(".card-front-input")?.focus();
    renumberCards();
}

function collectCardPayload() {
    return Array.from(queryAll(".card-editor-item"))
        .map((item) => ({
            front: item.querySelector(".card-front-input")?.value.trim() || "",
            back: item.querySelector(".card-back-input")?.value.trim() || "",
            front_img: "",
            back_img: "",
            color: "#ffffff",
        }))
        .filter((card) => card.front || card.back);
}

async function loadEditFlashcard(id) {
    const response = await apiRequest(`/api/flashcards/${id}`);
    const flashcard = response.data.flashcard;
    byId("setTitle").value = flashcard.name || "";
    byId("setDesc").value = flashcard.description || "";
    byId("setMainLang").value = getRefId(flashcard.language_id);
    byId("frontLang").value = getRefId(flashcard.language_id);
    byId("setTopic").value = getRefId(flashcard.topic_id);
    byId("setLevel").value = getRefId(flashcard.level_id);
    const publicToggle = byId("publicToggle");
    publicToggle.checked = flashcard.visibility === "public";
    publicToggle.dispatchEvent(new Event("change"));
    const list = byId("cardEditorList");
    if (list)
        list.innerHTML = "";
    (response.data.cards || []).forEach((card) => addCard(card.front, card.back));
    if ((response.data.cards || []).length === 0)
        addCard();
    updateCardCount();
}

async function initCreateSetPage() {
    if (!byId("cardEditorList"))
        return;
    if (!checkAuth()) {
        alert("Vui long dang nhap de tao bo the.");
        window.location.href = "home.html";
        return;
    }
    await loadLookupData();
    renderLookupOptions();
    const editingId = getFlashcardIdFromUrl();
    on(byId("btnAddCard"), "click", () => addCard());
    on(byId("publicToggle"), "change", (event) => {
        const checkbox = event.currentTarget;
        const isPublic = checkbox.checked;
        const badge = byId("statusBadge");
        byId("publicOptions")?.classList.toggle("show", isPublic);
        if (!badge)
            return;
        badge.textContent = isPublic ? "Cho duyet" : "Rieng tu";
        badge.className = isPublic ? "status-badge-inline pending" : "status-badge-inline private";
    });
    if (editingId) {
        try {
            await loadEditFlashcard(editingId);
        }
        catch (error) {
            alert(error.message);
            window.location.href = "account.html";
            return;
        }
    }
    else {
        updateCardCount();
        addCard();
    }
    on(byId("btnSaveSet"), "click", async () => {
        const titleInput = byId("setTitle");
        const name = titleInput?.value.trim() ?? "";
        const description = inputValue("setDesc").trim();
        const language_id = inputValue("setMainLang") || inputValue("frontLang");
        const topic_id = inputValue("setTopic");
        const level_id = inputValue("setLevel");
        const visibility = byId("publicToggle")?.checked ? "public" : "private";
        const cards = collectCardPayload();
        if (!name) {
            alert("Vui long nhap ten bo the.");
            titleInput?.focus();
            return;
        }
        if (!language_id || !topic_id || !level_id) {
            alert("Vui long chon ngon ngu, chu de va cap do.");
            return;
        }
        if (cards.length === 0) {
            alert("Vui long them it nhat mot the.");
            return;
        }
        const payload = { name, description, language_id, topic_id, level_id, tag_ids: [], visibility, cards };
        try {
            const response = await apiRequest(editingId ? `/api/flashcards/${editingId}` : "/api/flashcards", {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });
            const flashcardId = response.data.flashcard._id;
            alert(visibility === "public"
                ? "Bo the da luu va dang cho Admin duyet."
                : "Bo the rieng tu da duoc luu.");
            window.location.href = `detailFlashcard.html?id=${flashcardId}`;
        }
        catch (error) {
            alert(error.message);
        }
    });
}

const CARD_IMAGE_TYPES_V2 = ["image/jpeg", "image/png", "image/webp"];
const CARD_IMAGE_MAX_SIZE_V2 = 5 * 1024 * 1024;
let editCardIdsV2 = new Set();

function updateCardCount() {
    const count = queryAll(".card-editor-item").length;
    setText(byId("cardCount"), `(${count} the)`);
    setText(byId("saveBarCardCount"), `${count} the`);
    setDisplay(byId("emptyCardState"), count === 0 ? "flex" : "none");
}

function renumberCards() {
    queryAll(".card-editor-item").forEach((item, index) => {
        setText(item.querySelector(".card-num"), `The ${index + 1}`);
    });
}

function validateImageFileV2(file) {
    if (!file)
        return true;

    if (!CARD_IMAGE_TYPES_V2.includes(file.type)) {
        alert("Chi ho tro anh JPG, JPEG, PNG hoac WEBP.");
        return false;
    }

    if (file.size > CARD_IMAGE_MAX_SIZE_V2) {
        alert("Anh phai nho hon hoac bang 5MB.");
        return false;
    }

    return true;
}

function cardPreviewHtmlV2(src) {
    if (!src) {
        return `
            <div class="card-image-empty">
                <i class="fa-regular fa-image"></i>
                <span>Chua co anh</span>
            </div>
        `;
    }

    return `<img src="${escapeAttribute(getImageUrl(src))}" alt="Preview anh card" loading="lazy">`;
}

function setCardImagePreviewV2(item, side, src) {
    const preview = item.querySelector(`.${side}-image-preview`);
    if (!preview)
        return;

    preview.classList.toggle("is-empty", !src);
    preview.innerHTML = cardPreviewHtmlV2(src);
}

function handleImageInputChangeV2(item, side) {
    const input = item.querySelector(`.card-${side}-image-input`);
    const file = input?.files?.[0];
    if (!file)
        return;

    if (!validateImageFileV2(file)) {
        input.value = "";
        return;
    }

    setCardImagePreviewV2(item, side, URL.createObjectURL(file));
    item.dataset[side === "front" ? "removeFrontImage" : "removeBackImage"] = "false";
}

function removeCardImageV2(item, side) {
    const input = item.querySelector(`.card-${side}-image-input`);
    if (input)
        input.value = "";

    if (side === "front") {
        item.dataset.frontImg = "";
        item.dataset.removeFrontImage = "true";
    } else {
        item.dataset.backImg = "";
        item.dataset.removeBackImage = "true";
    }

    setCardImagePreviewV2(item, side, "");
}

function cardImagePickerHtmlV2(side, title, imagePath) {
    return `
        <div class="card-image-picker" data-side="${side}">
            <div class="card-image-picker-header">
                <span><i class="fa-regular fa-image"></i> ${title}</span>
                <div class="card-image-actions">
                    <label class="card-image-btn">
                        <i class="fa-solid fa-upload"></i>
                        <span>Chon anh</span>
                        <input type="file" class="card-${side}-image-input" accept="image/jpeg,image/png,image/webp">
                    </label>
                    <button type="button" class="card-image-remove" data-side="${side}" title="Xoa anh">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-image-preview ${side}-image-preview ${imagePath ? "" : "is-empty"}">
                ${cardPreviewHtmlV2(imagePath)}
            </div>
        </div>
    `;
}

function addCard(card = {}) {
    const list = byId("cardEditorList");
    if (!list)
        return;

    const item = document.createElement("div");
    item.className = "card-editor-item";
    item.dataset.cardId = card._id || card.id || "";
    item.dataset.frontImg = card.front_img || "";
    item.dataset.backImg = card.back_img || "";
    item.dataset.removeFrontImage = "false";
    item.dataset.removeBackImage = "false";

    item.innerHTML = `
        <div class="card-editor-item-header">
            <span class="card-num">The ${list.children.length + 1}</span>
            <button class="btn-remove-card" onclick="removeCard(this)" title="Xoa the">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="card-editor-inputs">
            <div class="card-input-field">
                <div class="card-field-header">
                    <label>Mat truoc (Thuat ngu)</label>
                    <button class="card-speech-btn" type="button" aria-label="Nghe phát âm" title="Nghe phát âm" data-speak-front>
                        <i class="fa-solid fa-volume-high"></i>
                    </button>
                </div>
                <input type="text" placeholder="Nhap thuat ngu..." class="card-front-input" value="${escapeAttribute(card.front || "")}">
            </div>
            <div class="card-input-field">
                <label>Mat sau (Dinh nghia)</label>
                <textarea placeholder="Nhap dinh nghia hoac ban dich..." rows="2" class="card-back-input">${escapeHtml(card.back || "")}</textarea>
            </div>
        </div>
        <div class="card-editor-images">
            ${cardImagePickerHtmlV2("front", "Anh mat truoc", card.front_img || "")}
            ${cardImagePickerHtmlV2("back", "Anh mat sau", card.back_img || "")}
        </div>
    `;

    list.appendChild(item);
    item.querySelector(".card-front-image-input")?.addEventListener("change", () => handleImageInputChangeV2(item, "front"));
    item.querySelector(".card-back-image-input")?.addEventListener("change", () => handleImageInputChangeV2(item, "back"));
    item.querySelectorAll(".card-image-remove").forEach((button) => {
        button.addEventListener("click", () => removeCardImageV2(item, button.dataset.side));
    });
    item.querySelector("[data-speak-front]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        speakText(item.querySelector(".card-front-input")?.value || "", getCreateSetFrontSpeechLanguageV2());
    });

    updateCardCount();
    item.querySelector(".card-front-input")?.focus();
    renumberCards();
}

function removeCard(btn) {
    btn.closest(".card-editor-item")?.remove();
    renumberCards();
    updateCardCount();
}

function collectCardItemsV2() {
    return Array.from(queryAll(".card-editor-item"))
        .map((item, index) => ({
            item,
            id: item.dataset.cardId || "",
            front: item.querySelector(".card-front-input")?.value.trim() || "",
            back: item.querySelector(".card-back-input")?.value.trim() || "",
            color: "#ffffff",
            position: index,
            frontImg: item.dataset.frontImg || "",
            backImg: item.dataset.backImg || "",
            frontFile: item.querySelector(".card-front-image-input")?.files?.[0] || null,
            backFile: item.querySelector(".card-back-image-input")?.files?.[0] || null,
            removeFrontImage: item.dataset.removeFrontImage === "true",
            removeBackImage: item.dataset.removeBackImage === "true",
        }))
        .filter((card) => card.front || card.back || card.frontFile || card.backFile || card.id);
}

function validateCardsV2(cards) {
    if (cards.length === 0) {
        alert("Vui long them it nhat mot the.");
        return false;
    }

    const invalidTextCard = cards.find((card) => !card.front || !card.back);
    if (invalidTextCard) {
        alert("Moi the can co ca mat truoc va mat sau.");
        invalidTextCard.item.querySelector(!invalidTextCard.front ? ".card-front-input" : ".card-back-input")?.focus();
        return false;
    }

    return cards.every((card) => validateImageFileV2(card.frontFile) && validateImageFileV2(card.backFile));
}

function buildCardFormDataV2(card, includeRemoveFlags = false) {
    const formData = new FormData();
    formData.append("front", card.front);
    formData.append("back", card.back);
    formData.append("color", card.color);
    formData.append("position", String(card.position));

    if (card.frontFile)
        formData.append("front_image", card.frontFile);
    else if (card.frontImg && !card.removeFrontImage)
        formData.append("front_img", card.frontImg);

    if (card.backFile)
        formData.append("back_image", card.backFile);
    else if (card.backImg && !card.removeBackImage)
        formData.append("back_img", card.backImg);

    if (includeRemoveFlags) {
        if (card.removeFrontImage && !card.frontFile)
            formData.append("remove_front_image", "true");
        if (card.removeBackImage && !card.backFile)
            formData.append("remove_back_image", "true");
    }

    return formData;
}

async function saveCardsForNewFlashcardV2(flashcardId, cards) {
    for (const card of cards) {
        await apiRequest(`/api/flashcards/${flashcardId}/cards`, {
            method: "POST",
            body: buildCardFormDataV2(card),
        });
    }
}

async function saveCardsForExistingFlashcardV2(flashcardId, cards) {
    const currentIds = new Set(cards.map((card) => card.id).filter(Boolean));
    const removedIds = Array.from(editCardIdsV2).filter((id) => !currentIds.has(id));

    for (const cardId of removedIds) {
        await apiRequest(`/api/cards/${cardId}`, { method: "DELETE" });
    }

    for (const card of cards) {
        if (card.id) {
            await apiRequest(`/api/cards/${card.id}`, {
                method: "PUT",
                body: buildCardFormDataV2(card, true),
            });
            continue;
        }

        await apiRequest(`/api/flashcards/${flashcardId}/cards`, {
            method: "POST",
            body: buildCardFormDataV2(card),
        });
    }
}

async function loadTagOptionsV2(selectedTagId = "") {
    const select = byId("setTag");
    if (!select)
        return [];

    const response = await apiRequest("/api/tags");
    const tags = response.data?.tags || [];
    const currentValue = selectedTagId || select.value;

    select.innerHTML = '<option value="">Khong co tag</option>' + tags
        .map((tag) => `<option value="${escapeAttribute(tag._id)}">${escapeHtml(tag.name || "Tag")}</option>`)
        .join("");

    if (currentValue)
        select.value = currentValue;

    return tags;
}

function getFirstFlashcardTagIdV2(flashcard) {
    const tags = Array.isArray(flashcard?.tag_ids) ? flashcard.tag_ids : [];
    return getRefId(tags[0]);
}

function getDefaultLookupIdV2(key) {
    const items = lookupData?.[key] || [];
    return (items.find((item) => item.status === "active") || items[0] || {})._id || "";
}

function getCreateSetFrontSpeechLanguageV2() {
    const selected = inputValue("frontLang") || inputValue("setMainLang");
    const language = (lookupData?.languages || []).find((item) => item._id === selected || item.code === selected);
    return language?.code || selected || "en";
}

async function loadEditFlashcard(id) {
    const response = await apiRequest(`/api/flashcards/${id}`);
    const flashcard = response.data.flashcard;
    const cards = response.data.cards || [];

    byId("setTitle").value = flashcard.name || "";
    byId("setDesc").value = flashcard.description || "";
    byId("setMainLang").value = getRefId(flashcard.language_id);
    byId("frontLang").value = getRefId(flashcard.language_id);
    byId("setTopic").value = getRefId(flashcard.topic_id);
    byId("setLevel").value = getRefId(flashcard.level_id);
    byId("setTag").value = getFirstFlashcardTagIdV2(flashcard);

    const publicToggle = byId("publicToggle");
    publicToggle.checked = flashcard.visibility === "public";
    publicToggle.dispatchEvent(new Event("change"));

    const list = byId("cardEditorList");
    if (list)
        list.innerHTML = "";

    editCardIdsV2 = new Set(cards.map((card) => card._id));
    cards.forEach((card) => addCard(card));
    if (cards.length === 0)
        addCard();

    updateCardCount();
}

function flashcardPayloadFromFormV2() {
    const tagId = inputValue("setTag");
    const visibility = byId("publicToggle")?.checked ? "public" : "private";
    const isPrivate = visibility === "private";

    return {
        name: inputValue("setTitle").trim(),
        description: inputValue("setDesc").trim(),
        language_id: inputValue("setMainLang") || inputValue("frontLang"),
        topic_id: inputValue("setTopic") || (isPrivate ? getDefaultLookupIdV2("topics") : ""),
        level_id: inputValue("setLevel") || (isPrivate ? getDefaultLookupIdV2("levels") : ""),
        tag_ids: tagId ? [tagId] : [],
        visibility,
    };
}

let excelPreviewCardsV2 = [];
let excelPreviewImportKeyV2 = "";
const excelImportedKeysV2 = new Set();
let assistantPreviewCardsV2 = [];
let assistantPreviewKeyV2 = "";

function safeHtmlV2(value) {
    return escapeHtml(String(value ?? ""));
}

function normalizeIncomingCardV2(card = {}, index = 0) {
    return {
        front: String(card.front || "").trim(),
        front_img: String(card.front_img || "").trim(),
        back: String(card.back || "").trim(),
        back_img: String(card.back_img || "").trim(),
        color: String(card.color || "#ffffff").trim() || "#ffffff",
        position: Number.isFinite(Number(card.position)) ? Number(card.position) : index,
    };
}

function cardKeyV2(card) {
    return [
        String(card.front || "").trim().toLowerCase(),
        String(card.back || "").trim().toLowerCase(),
        String(card.front_img || "").trim(),
        String(card.back_img || "").trim(),
    ].join("||");
}

function batchKeyV2(cards) {
    return cards.map((card) => cardKeyV2(card)).join("##");
}

function cardKeyFromItemV2(item) {
    return cardKeyV2({
        front: item.querySelector(".card-front-input")?.value || "",
        back: item.querySelector(".card-back-input")?.value || "",
        front_img: item.dataset.frontImg || "",
        back_img: item.dataset.backImg || "",
    });
}

function isBlankEditorCardV2(item) {
    const front = item.querySelector(".card-front-input")?.value.trim() || "";
    const back = item.querySelector(".card-back-input")?.value.trim() || "";
    const frontFile = item.querySelector(".card-front-image-input")?.files?.[0];
    const backFile = item.querySelector(".card-back-image-input")?.files?.[0];
    return !item.dataset.cardId && !front && !back && !item.dataset.frontImg && !item.dataset.backImg && !frontFile && !backFile;
}

function removeSingleBlankPlaceholderCardV2() {
    const items = Array.from(queryAll(".card-editor-item"));
    if (items.length === 1 && isBlankEditorCardV2(items[0])) {
        items[0].remove();
        updateCardCount();
    }
}

function addCardsToEditorV2(cards, options = {}) {
    const normalizedCards = cards
        .map((card, index) => normalizeIncomingCardV2(card, index))
        .filter((card) => card.front && card.back);

    if (!normalizedCards.length) return { added: 0, skipped: 0 };

    removeSingleBlankPlaceholderCardV2();

    const dedupe = options.dedupe !== false;
    const existingKeys = new Set(Array.from(queryAll(".card-editor-item")).map(cardKeyFromItemV2));
    let added = 0;
    let skipped = 0;

    normalizedCards.forEach((card) => {
        const key = cardKeyV2(card);
        if (dedupe && existingKeys.has(key)) {
            skipped += 1;
            return;
        }

        addCard(card);
        existingKeys.add(key);
        added += 1;
    });

    updateCardCount();
    renumberCards();
    return { added, skipped };
}

function selectedOptionTextV2(id) {
    const select = byId(id);
    return select?.selectedOptions?.[0]?.textContent.trim() || inputValue(id);
}

function renderExcelPreviewV2(data = {}) {
    excelPreviewCardsV2 = (data.cards || []).map((card, index) => normalizeIncomingCardV2(card, index));
    excelPreviewImportKeyV2 = batchKeyV2(excelPreviewCardsV2);

    const summary = byId("excelPreviewSummary");
    const rows = byId("excelPreviewRows");
    const errors = byId("excelPreviewErrors");
    const applyButton = byId("btnApplyExcelImport");
    const isAlreadyImported = excelPreviewImportKeyV2 && excelImportedKeysV2.has(excelPreviewImportKeyV2);

    setText(summary, `Doc ${data.rows_count || 0} dong, ${excelPreviewCardsV2.length} card hop le, ${data.error_count || 0} loi.`);

    if (rows) {
        rows.innerHTML = excelPreviewCardsV2.length
            ? excelPreviewCardsV2.map((card, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${safeHtmlV2(card.front)}</td>
                    <td>${safeHtmlV2(card.back)}</td>
                    <td><span class="preview-status-ok">Hop le</span></td>
                </tr>
            `).join("")
            : '<tr><td colspan="4">Khong co card hop le.</td></tr>';
    }

    if (errors) {
        const errorItems = data.errors || [];
        errors.classList.toggle("show", errorItems.length > 0);
        errors.innerHTML = errorItems
            .map((item) => `<div>Dong ${safeHtmlV2(item.row)}: ${safeHtmlV2(item.message)}</div>`)
            .join("");
    }

    if (applyButton) {
        applyButton.disabled = !excelPreviewCardsV2.length || isAlreadyImported;
        applyButton.innerHTML = isAlreadyImported
            ? '<i class="fa-solid fa-check"></i> Da nhap vao bo'
            : '<i class="fa-solid fa-file-import"></i> Nhap vao bo';
    }

    showModal(byId("excelPreviewModal"));
}

async function handleExcelFileSelectedV2(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
        alert("Chi ho tro file .xlsx hoac .xls.");
        input.value = "";
        return;
    }

    const button = byId("btnImportExcel");
    const originalHtml = button?.innerHTML;
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dang doc...';
    }

    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiRequest("/api/import/excel", {
            method: "POST",
            body: formData,
        });
        renderExcelPreviewV2(response.data || {});
    } catch (error) {
        alert(error.message);
    } finally {
        input.value = "";
        if (button) {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }
}

function applyExcelImportV2() {
    if (!excelPreviewCardsV2.length) return;
    if (excelPreviewImportKeyV2 && excelImportedKeysV2.has(excelPreviewImportKeyV2)) {
        alert("File nay da duoc nhap vao bo.");
        return;
    }

    const result = addCardsToEditorV2(excelPreviewCardsV2);
    if (excelPreviewImportKeyV2) excelImportedKeysV2.add(excelPreviewImportKeyV2);
    hideModal(byId("excelPreviewModal"));
    alert(`Da them ${result.added} card tu Excel.${result.skipped ? ` Bo qua ${result.skipped} card trung.` : ""}`);
}

function appendAssistantMessageV2(role, text) {
    const log = byId("assistantChatLog");
    if (!log) return null;

    const item = document.createElement("div");
    item.className = `assistant-message ${role}`;
    item.textContent = text;
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
    return item;
}

function renderAssistantCardsPreviewV2(cards = []) {
    assistantPreviewCardsV2 = cards.map((card, index) => normalizeIncomingCardV2(card, index));
    assistantPreviewKeyV2 = batchKeyV2(assistantPreviewCardsV2);

    const preview = byId("assistantCardsPreview");
    const addButton = byId("btnAddAssistantCards");

    if (!preview) return;

    preview.classList.toggle("show", assistantPreviewCardsV2.length > 0);
    preview.innerHTML = assistantPreviewCardsV2.length
        ? `
            <div class="assistant-preview-title">Preview ${assistantPreviewCardsV2.length} card</div>
            ${assistantPreviewCardsV2.map((card, index) => `
                <label class="assistant-card-option">
                    <input type="checkbox" class="assistant-card-checkbox" data-index="${index}" checked>
                    <span>
                        <span class="assistant-card-front">${safeHtmlV2(card.front)}</span>
                        <span class="assistant-card-back">${safeHtmlV2(card.back)}</span>
                    </span>
                </label>
            `).join("")}
        `
        : "";

    if (addButton) {
        addButton.disabled = !assistantPreviewCardsV2.length;
        addButton.innerHTML = '<i class="fa-solid fa-plus"></i> Them vao bo';
    }
}

function selectedAssistantCardsV2() {
    return Array.from(queryAll("#assistantCardsPreview .assistant-card-checkbox:checked"))
        .map((checkbox) => assistantPreviewCardsV2[Number(checkbox.dataset.index)])
        .filter(Boolean);
}

async function sendAssistantMessageV2() {
    const input = byId("assistantMessage");
    const message = input?.value.trim() || "";
    if (!message) {
        alert("Vui long nhap yeu cau cho tro ly.");
        input?.focus();
        return;
    }

    const button = byId("btnSendAssistant");
    const originalHtml = button?.innerHTML;
    appendAssistantMessageV2("user", message);
    const pendingMessage = appendAssistantMessageV2("assistant", "Dang tao card...");
    renderAssistantCardsPreviewV2([]);

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dang gui...';
    }

    try {
        const response = await apiRequest("/api/assistant/vocabulary", {
            method: "POST",
            body: JSON.stringify({
                message,
                source_language: selectedOptionTextV2("frontLang"),
                target_language: selectedOptionTextV2("backLang"),
            }),
        });

        const data = response.data || {};
        if (pendingMessage) pendingMessage.textContent = data.message || "Da tao card goi y.";
        renderAssistantCardsPreviewV2(data.cards || []);
        input.value = "";
    } catch (error) {
        if (pendingMessage) pendingMessage.textContent = error.message;
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }
}

function applyAssistantCardsV2() {
    const selectedCards = selectedAssistantCardsV2();
    if (!selectedCards.length) {
        alert("Vui long chon it nhat mot card.");
        return;
    }

    const result = addCardsToEditorV2(selectedCards);
    renderAssistantCardsPreviewV2(assistantPreviewCardsV2);
    appendAssistantMessageV2("assistant", `Da them ${result.added} card vao bo.${result.skipped ? ` Bo qua ${result.skipped} card trung.` : ""}`);
}

function openVocabularyAssistantV2() {
    const drawer = byId("vocabularyAssistantDrawer");
    const backdrop = byId("assistantBackdrop");
    drawer?.classList.add("show");
    drawer?.setAttribute("aria-hidden", "false");
    backdrop?.classList.add("show");

    if (!byId("assistantChatLog")?.children.length) {
        appendAssistantMessageV2("assistant", "Nhap yeu cau nhu: Tra tu apple, Tao 10 tu tieng Anh chu de lap trinh.");
    }

    byId("assistantMessage")?.focus();
}

function closeVocabularyAssistantV2() {
    const drawer = byId("vocabularyAssistantDrawer");
    const backdrop = byId("assistantBackdrop");
    drawer?.classList.remove("show");
    drawer?.setAttribute("aria-hidden", "true");
    backdrop?.classList.remove("show");
}

function initCreateSetEnhancementsV2() {
    const importButton = byId("btnImportExcel");
    if (importButton?.dataset.initialized === "true") return;
    if (importButton) importButton.dataset.initialized = "true";

    on(importButton, "click", () => byId("excelImportInput")?.click());
    on(byId("excelImportInput"), "change", handleExcelFileSelectedV2);
    on(byId("btnCloseExcelPreview"), "click", () => hideModal(byId("excelPreviewModal")));
    on(byId("btnCancelExcelImport"), "click", () => hideModal(byId("excelPreviewModal")));
    on(byId("btnApplyExcelImport"), "click", applyExcelImportV2);

    on(byId("btnOpenVocabularyAssistant"), "click", openVocabularyAssistantV2);
    on(byId("btnCloseVocabularyAssistant"), "click", closeVocabularyAssistantV2);
    on(byId("assistantBackdrop"), "click", closeVocabularyAssistantV2);
    on(byId("btnSendAssistant"), "click", sendAssistantMessageV2);
    on(byId("btnAddAssistantCards"), "click", applyAssistantCardsV2);
    on(byId("assistantMessage"), "keydown", (event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void sendAssistantMessageV2();
        }
    });
}

async function initCreateSetPage() {
    if (!byId("cardEditorList"))
        return;

    if (!checkAuth()) {
        alert("Vui long dang nhap de tao bo the.");
        window.location.href = "home.html";
        return;
    }

    await loadLookupData();
    renderLookupOptions();
    try {
        await loadTagOptionsV2();
    } catch (error) {
        console.warn("Could not load tags", error);
    }

    const editingId = getFlashcardIdFromUrl();
    on(byId("btnAddCard"), "click", () => addCard());
    on(byId("publicToggle"), "change", (event) => {
        const checkbox = event.currentTarget;
        const isPublic = checkbox.checked;
        const badge = byId("statusBadge");
        byId("publicOptions")?.classList.toggle("show", isPublic);
        if (!badge)
            return;
        badge.textContent = isPublic ? "Cho duyet" : "Rieng tu";
        badge.className = isPublic ? "status-badge-inline pending" : "status-badge-inline private";
    });
    initCreateSetEnhancementsV2();

    if (editingId) {
        try {
            await loadEditFlashcard(editingId);
        } catch (error) {
            alert(error.message);
            window.location.href = "account.html";
            return;
        }
    } else {
        editCardIdsV2 = new Set();
        updateCardCount();
        addCard();
    }

    on(byId("btnSaveSet"), "click", async (event) => {
        const button = event.currentTarget;
        const originalHtml = button.innerHTML;
        const payload = flashcardPayloadFromFormV2();
        const cards = collectCardItemsV2();

        if (!payload.name) {
            alert("Vui long nhap ten bo the.");
            byId("setTitle")?.focus();
            return;
        }
        if (!payload.language_id) {
            alert("Vui long chon ngon ngu.");
            return;
        }
        if (payload.visibility === "public" && (!inputValue("setTopic") || !inputValue("setLevel"))) {
            alert("Vui long chon chu de va cap do de cong khai bo the.");
            return;
        }
        if (!payload.topic_id || !payload.level_id) {
            alert("Chua co du lieu chu de hoac cap do mac dinh. Hay tao it nhat mot chu de va mot cap do trong Admin.");
            return;
        }
        if (!validateCardsV2(cards))
            return;

        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dang luu...';

        let createdFlashcardId = null;
        try {
            const response = await apiRequest(editingId ? `/api/flashcards/${editingId}` : "/api/flashcards", {
                method: editingId ? "PUT" : "POST",
                body: JSON.stringify(payload),
            });

            const flashcardId = response.data.flashcard._id;
            if (!editingId)
                createdFlashcardId = flashcardId;

            if (editingId) {
                await saveCardsForExistingFlashcardV2(flashcardId, cards);
            } else {
                await saveCardsForNewFlashcardV2(flashcardId, cards);
            }

            alert(payload.visibility === "public"
                ? "Bo the da luu va dang cho Admin duyet."
                : "Bo the rieng tu da duoc luu.");
            window.location.href = `detailFlashcard.html?id=${flashcardId}`;
        } catch (error) {
            if (createdFlashcardId) {
                try {
                    await apiRequest(`/api/flashcards/${createdFlashcardId}`, { method: "DELETE" });
                } catch (rollbackError) {
                    console.warn("Could not rollback flashcard after card upload failed", rollbackError);
                }
            }
            alert(error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    });
}
