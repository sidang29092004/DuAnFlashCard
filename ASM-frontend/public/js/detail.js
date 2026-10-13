"use strict";
function renderTermList() {
    const list = byId("termList");
    if (!list)
        return;
    if (currentTerms.length === 0) {
        list.innerHTML = `
            <div class="term-item">
                <div class="term-word">Chua co du lieu thuat ngu trong db.json</div>
            </div>
        `;
        return;
    }
    list.innerHTML = currentTerms.map((term, index) => `
        <div class="term-item">
            <span class="term-num">${index + 1}</span>
            <div class="term-word">${escapeHtml(term.front)}</div>
            <div class="term-def">${escapeHtml(term.back)}</div>
            <div class="term-actions">
                <i class="fa-solid fa-volume-high" title="Phát âm"></i>
                <i class="fa-regular fa-star" title="Đánh dấu"></i>
            </div>
        </div>
    `).join("");
}
function updateCardDisplay() {
    const term = currentTerms[detailCurrentCard];
    if (!term) {
        setText(byId("frontText"), "Chua co the");
        setText(byId("backText"), "Hay them card vao bang Card trong db.json");
        setText(byId("cardCounter"), "0 / 0");
        return;
    }
    setText(byId("frontText"), term.front);
    setText(byId("backText"), term.back);
    setText(byId("cardCounter"), `${detailCurrentCard + 1} / ${currentTerms.length}`);
    byId("flashcardMain")?.classList.remove("is-flipped");
}
function copyToClipboard(text) {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    return Promise.resolve();
}
function shareToSocial(platform) {
    alert(`Chia sẻ lên ${platform} - Tính năng này cần kết nối API`);
}
function currentShareUrl() {
    if (!currentFlashcardProduct)
        return window.location.href;
    return `${window.location.origin}${window.location.pathname}?id=${currentFlashcardProduct.id}`;
}
function renderCurrentFlashcardDetail() {
    if (!currentFlashcardProduct || !currentFlashcardRecord || !appDatabase)
        return;
    const product = currentFlashcardProduct;
    const author = findById(appDatabase.User, "id_user", currentFlashcardRecord.id_user);
    const language = findById(appDatabase.Language, "id_language", currentFlashcardRecord.id_language);
    const meta = document.querySelector(".set-meta");
    document.title = `${product.title} | Flashcard Language`;
    setText(document.querySelector(".set-title"), product.title);
    setText(document.querySelector(".set-breadcrumb span:last-child"), product.title);
    setText(document.querySelector(".term-list-header h3"), `Thuat ngu trong bo the nay (${currentTerms.length})`);
    setText(byId("shareLink"), currentShareUrl());
    if (meta) {
        meta.innerHTML = `
            <div class="author-info">
                <div class="author-avatar"><i class="fa-solid fa-user"></i></div>
                <span>Tao boi <strong>${escapeHtml(author?.name ?? "Nguoi dung")}</strong></span>
            </div>
            <span>|</span>
            <span><i class="fa-solid fa-clone"></i> ${currentTerms.length} thuat ngu</span>
            <span>|</span>
            <span class="badge" style="background-color:#e0f2fe;color:#0284c7;">${escapeHtml(language?.name ?? product.frontLanguage)}</span>
            <span class="badge ${product.levelClass}">${product.levelLabel}</span>
            <span class="set-status approved"><i class="fa-solid fa-circle-check"></i> Cong khai</span>
        `;
    }
    queryAll(".mode-btn").forEach((link) => {
        link.href = product.studyUrl;
    });
    queryAll("[onclick]").forEach((element) => {
        const handler = element.getAttribute("onclick");
        if (handler?.includes("study.html")) {
            element.setAttribute("onclick", `window.location.href='${product.studyUrl}'`);
        }
    });
}
function renderCurrentStudyHeader() {
    if (!currentFlashcardProduct)
        return;
    const product = currentFlashcardProduct;
    const logo = document.querySelector("header .logo");
    document.title = `Hoc ${product.title} | Flashcard Language`;
    if (logo) {
        logo.href = product.detailUrl;
        logo.innerHTML = `
            <i class="fa-solid fa-arrow-left" style="font-size:1rem;"></i>
            ${escapeHtml(product.title)}
        `;
    }
    queryAll("[onclick]").forEach((element) => {
        const handler = element.getAttribute("onclick");
        if (handler?.includes("detailFlashcard.html")) {
            element.setAttribute("onclick", `window.location.href='${product.detailUrl}'`);
        }
    });
}
async function initDetailPage() {
    if (!byId("termList"))
        return;
    if (!(await loadAppData()))
        return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();
    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0)
            return;
        detailCurrentCard--;
        updateCardDisplay();
    });
    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1)
            return;
        detailCurrentCard++;
        updateCardDisplay();
    });
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            byId("flashcardMain")?.classList.toggle("is-flipped");
        }
        if (event.code === "ArrowLeft" && detailCurrentCard > 0) {
            detailCurrentCard--;
            updateCardDisplay();
        }
        if (event.code === "ArrowRight" && detailCurrentCard < currentTerms.length - 1) {
            detailCurrentCard++;
            updateCardDisplay();
        }
    });
    on(byId("btnSaveSet"), "click", (event) => {
        const button = event.currentTarget;
        const icon = button.querySelector("i");
        if (icon?.classList.contains("fa-regular")) {
            button.innerHTML = '<i class="fa-solid fa-bookmark"></i> Đã lưu';
            return;
        }
        button.innerHTML = '<i class="fa-regular fa-bookmark"></i> Lưu';
    });
    const shareModal = byId("shareModal");
    on(byId("btnShareSet"), "click", () => showModal(shareModal));
    on(byId("closeShareModalBtn"), "click", () => hideModal(shareModal));
    on(window, "click", (event) => {
        if (shareModal && event.target === shareModal)
            hideModal(shareModal);
    });
    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");
        copyToClipboard(link).then(() => {
            if (!copyButton)
                return;
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chép';
            }, 2000);
        });
    });
}

function shareToSocial(platform) {
    const url = encodeURIComponent(currentShareUrl());
    const text = encodeURIComponent(currentFlashcardProduct?.title || "Flashcard Language");
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    };
    const target = shareUrls[platform];
    if (target) {
        window.open(target, "_blank", "noopener,noreferrer,width=720,height=520");
    }
}

function renderTermList() {
    const list = byId("termList");
    if (!list)
        return;
    if (currentTerms.length === 0) {
        list.innerHTML = `
            <div class="term-item">
                <div class="term-word">Chua co the trong bo nay</div>
            </div>
        `;
        return;
    }
    list.innerHTML = currentTerms.map((term, index) => `
        <div class="term-item" data-index="${index}">
            <span class="term-num">${index + 1}</span>
            <div class="term-word">${renderTermSideV2(term.front, term.front_img)}</div>
            <div class="term-def">${renderTermSideV2(term.back, term.back_img)}</div>
            <div class="term-actions">
                <button class="term-icon-btn" type="button" data-speak="${index}" aria-label="Nghe phát âm" title="Nghe phát âm"><i class="fa-solid fa-volume-high"></i></button>
                <button class="term-icon-btn ${detailStarredV2.has(term.id) ? "starred" : ""}" type="button" data-star="${index}" title="Danh dau">
                    <i class="${detailStarredV2.has(term.id) ? "fa-solid" : "fa-regular"} fa-star"></i>
                </button>
            </div>
        </div>
    `).join("");

    list.querySelectorAll("[data-speak]").forEach((button) => {
        button.addEventListener("click", (event) => { event.stopPropagation(); speakTermV2(Number(button.dataset.speak)); });
    });
    list.querySelectorAll("[data-star]").forEach((button) => {
        button.addEventListener("click", () => toggleTermStarV2(Number(button.dataset.star)));
    });
}

function updateCardDisplay() {
    const term = currentTerms[detailCurrentCard];
    if (!term) {
        setText(byId("frontText"), "Chua co the");
        setText(byId("backText"), "Bo flashcard nay chua co card.");
        setSideImageV2("frontText", "frontImage", "");
        setSideImageV2("backText", "backImage", "");
        setText(byId("cardCounter"), "0 / 0");
        return;
    }
    setText(byId("frontText"), term.front);
    setText(byId("backText"), term.back);
    setSideImageV2("frontText", "frontImage", term.front_img);
    setSideImageV2("backText", "backImage", term.back_img);
    setText(byId("cardCounter"), `${detailCurrentCard + 1} / ${currentTerms.length}`);
    byId("flashcardMain")?.classList.remove("is-flipped");
}

async function initDetailPage() {
    if (!byId("termList"))
        return;
    if (!(await loadAppData()))
        return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();
    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0)
            return;
        detailCurrentCard--;
        updateCardDisplay();
    });
    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1)
            return;
        detailCurrentCard++;
        updateCardDisplay();
    });
    on(byId("expandBtn"), "click", toggleDetailFullscreenV2);
    on(document.querySelector(".term-list-header .control-btn"), "click", sortTermsV2);
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            byId("flashcardMain")?.classList.toggle("is-flipped");
        }
        if (event.code === "ArrowLeft" && detailCurrentCard > 0) {
            detailCurrentCard--;
            updateCardDisplay();
        }
        if (event.code === "ArrowRight" && detailCurrentCard < currentTerms.length - 1) {
            detailCurrentCard++;
            updateCardDisplay();
        }
    });
    on(byId("btnSaveSet"), "click", (event) => {
        void apiToggleSave(event.currentTarget, currentFlashcardProduct?.id);
    });
    const shareModal = byId("shareModal");
    on(byId("btnShareSet"), "click", () => showModal(shareModal));
    on(byId("closeShareModalBtn"), "click", () => hideModal(shareModal));
    on(window, "click", (event) => {
        if (shareModal && event.target === shareModal)
            hideModal(shareModal);
    });
    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");
        copyToClipboard(link).then(() => {
            if (!copyButton)
                return;
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Da sao chep';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chep';
            }, 2000);
        });
    });
}

let detailSortAscV2 = true;
const detailStarredV2 = new Set();

function cardSideImageHtmlV2(imagePath, className = "card-side-image") {
    if (!imagePath)
        return "";
    return `<img class="${className}" src="${escapeAttribute(getImageUrl(imagePath))}" alt="Anh minh hoa" loading="lazy">`;
}

function renderTermSideV2(text, imagePath) {
    return `
        <div class="term-side">
            <div>${escapeHtml(text || "")}</div>
            ${cardSideImageHtmlV2(imagePath, "term-side-image")}
        </div>
    `;
}

function renderTermList() {
    const list = byId("termList");
    if (!list)
        return;
    if (currentTerms.length === 0) {
        list.innerHTML = `
            <div class="term-item">
                <div class="term-word">Chua co the trong bo nay</div>
            </div>
        `;
        return;
    }
    list.innerHTML = currentTerms.map((term, index) => `
        <div class="term-item" data-index="${index}">
            <span class="term-num">${index + 1}</span>
            <div class="term-word">${renderTermSideV2(term.front, term.front_img)}</div>
            <div class="term-def">${renderTermSideV2(term.back, term.back_img)}</div>
            <div class="term-actions">
                <button class="term-icon-btn" type="button" data-speak="${index}" aria-label="Nghe phát âm" title="Nghe phát âm"><i class="fa-solid fa-volume-high"></i></button>
                <button class="term-icon-btn ${detailStarredV2.has(term.id) ? "starred" : ""}" type="button" data-star="${index}" title="Danh dau">
                    <i class="${detailStarredV2.has(term.id) ? "fa-solid" : "fa-regular"} fa-star"></i>
                </button>
            </div>
        </div>
    `).join("");

    list.querySelectorAll("[data-speak]").forEach((button) => {
        button.addEventListener("click", (event) => { event.stopPropagation(); speakTermV2(Number(button.dataset.speak)); });
    });
    list.querySelectorAll("[data-star]").forEach((button) => {
        button.addEventListener("click", () => toggleTermStarV2(Number(button.dataset.star)));
    });
}

function setSideImageV2(textId, imageId, imagePath) {
    const textEl = byId(textId);
    if (!textEl)
        return;

    let imageEl = byId(imageId);
    if (!imageEl) {
        imageEl = document.createElement("img");
        imageEl.id = imageId;
        imageEl.className = "flashcard-side-image";
        imageEl.alt = "Anh minh hoa";
        imageEl.loading = "lazy";
        textEl.insertAdjacentElement("afterend", imageEl);
    }

    if (imagePath) {
        imageEl.src = getImageUrl(imagePath);
        imageEl.style.display = "block";
    } else {
        imageEl.removeAttribute("src");
        imageEl.style.display = "none";
    }
}

function updateCardDisplay() {
    const term = currentTerms[detailCurrentCard];
    if (!term) {
        setText(byId("frontText"), "Chua co the");
        setText(byId("backText"), "Bo flashcard nay chua co card.");
        setSideImageV2("frontText", "frontImage", "");
        setSideImageV2("backText", "backImage", "");
        setText(byId("cardCounter"), "0 / 0");
        return;
    }
    setText(byId("frontText"), term.front);
    setText(byId("backText"), term.back);
    setSideImageV2("frontText", "frontImage", term.front_img);
    setSideImageV2("backText", "backImage", term.back_img);
    setText(byId("cardCounter"), `${detailCurrentCard + 1} / ${currentTerms.length}`);
    byId("flashcardMain")?.classList.remove("is-flipped");
}

function shareToSocial(platform) {
    const url = encodeURIComponent(currentShareUrl());
    const text = encodeURIComponent(currentFlashcardProduct?.title || "Flashcard Language");
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    };
    const target = shareUrls[platform];
    if (target) {
        window.open(target, "_blank", "noopener,noreferrer,width=720,height=520");
    }
}

function getDetailSpeechLanguageV2() {
    return currentFlashcardRecord?.language_id?.code || currentFlashcardProduct?.frontLanguage || "en";
}

function speakTermV2(index) {
    const term = currentTerms[index];
    if (!term)
        return;
    speakText(term.front || "", getDetailSpeechLanguageV2());
}

function toggleTermStarV2(index) {
    const term = currentTerms[index];
    if (!term)
        return;
    if (detailStarredV2.has(term.id)) {
        detailStarredV2.delete(term.id);
    } else {
        detailStarredV2.add(term.id);
    }
    renderTermList();
}

function sortTermsV2() {
    currentTerms.sort((a, b) => {
        const result = String(a.front || "").localeCompare(String(b.front || ""), "vi", { sensitivity: "base" });
        return detailSortAscV2 ? result : -result;
    });
    detailSortAscV2 = !detailSortAscV2;
    detailCurrentCard = 0;
    renderTermList();
    updateCardDisplay();
}

function toggleDetailFullscreenV2() {
    const viewer = byId("flashcardMain");
    if (!viewer)
        return;
    if (!document.fullscreenElement) {
        viewer.requestFullscreen?.();
        return;
    }
    document.exitFullscreen?.();
}

async function initDetailPage() {
    if (!byId("termList"))
        return;
    if (!(await loadAppData()))
        return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();
    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0)
            return;
        detailCurrentCard--;
        updateCardDisplay();
    });
    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1)
            return;
        detailCurrentCard++;
        updateCardDisplay();
    });
    on(byId("expandBtn"), "click", toggleDetailFullscreenV2);
    on(document.querySelector(".term-list-header .control-btn"), "click", sortTermsV2);
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            byId("flashcardMain")?.classList.toggle("is-flipped");
        }
        if (event.code === "ArrowLeft" && detailCurrentCard > 0) {
            detailCurrentCard--;
            updateCardDisplay();
        }
        if (event.code === "ArrowRight" && detailCurrentCard < currentTerms.length - 1) {
            detailCurrentCard++;
            updateCardDisplay();
        }
    });
    on(byId("btnSaveSet"), "click", (event) => {
        void apiToggleSave(event.currentTarget, currentFlashcardProduct?.id);
    });
    const shareModal = byId("shareModal");
    on(byId("btnShareSet"), "click", () => showModal(shareModal));
    on(byId("closeShareModalBtn"), "click", () => hideModal(shareModal));
    on(window, "click", (event) => {
        if (shareModal && event.target === shareModal)
            hideModal(shareModal);
    });
    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");
        copyToClipboard(link).then(() => {
            if (!copyButton)
                return;
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Da sao chep';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chep';
            }, 2000);
        });
    });
}

function renderTermList() {
    const list = byId("termList");
    if (!list)
        return;
    if (currentTerms.length === 0) {
        list.innerHTML = `
            <div class="term-item">
                <div class="term-word">Chua co the trong bo nay</div>
            </div>
        `;
        return;
    }
    list.innerHTML = currentTerms.map((term, index) => `
        <div class="term-item">
            <span class="term-num">${index + 1}</span>
            <div class="term-word">${escapeHtml(term.front || "")}</div>
            <div class="term-def">${escapeHtml(term.back || "")}</div>
            <div class="term-actions">
                <i class="fa-solid fa-volume-high" title="Phat am"></i>
                <i class="fa-regular fa-star" title="Danh dau"></i>
            </div>
        </div>
    `).join("");
}

function updateCardDisplay() {
    const term = currentTerms[detailCurrentCard];
    if (!term) {
        setText(byId("frontText"), "Chua co the");
        setText(byId("backText"), "Bo flashcard nay chua co card.");
        setText(byId("cardCounter"), "0 / 0");
        return;
    }
    setText(byId("frontText"), term.front);
    setText(byId("backText"), term.back);
    setText(byId("cardCounter"), `${detailCurrentCard + 1} / ${currentTerms.length}`);
    byId("flashcardMain")?.classList.remove("is-flipped");
}

function renderCurrentFlashcardDetail() {
    if (!currentFlashcardProduct || !currentFlashcardRecord)
        return;
    const product = currentFlashcardProduct;
    const meta = document.querySelector(".set-meta");
    document.title = `${product.title} | Flashcard Language`;
    setText(document.querySelector(".set-title"), product.title);
    setText(document.querySelector(".set-breadcrumb span:last-child"), product.title);
    setText(document.querySelector(".term-list-header h3"), `Thuat ngu trong bo the nay (${currentTerms.length})`);
    setText(byId("shareLink"), currentShareUrl());
    if (meta) {
        meta.innerHTML = `
            <div class="author-info">
                <div class="author-avatar"><i class="fa-solid fa-user"></i></div>
                <span>Tao boi <strong>${escapeHtml(product.creatorName || "Nguoi dung")}</strong></span>
            </div>
            <span>|</span>
            <span><i class="fa-solid fa-clone"></i> ${currentTerms.length} thuat ngu</span>
            <span>|</span>
            <span class="badge" style="background-color:#e0f2fe;color:#0284c7;">${escapeHtml(product.frontLanguageName || "Ngôn ngữ")}</span>
            <span class="badge ${product.levelClass}">${escapeHtml(product.levelLabel)}</span>
            <span class="set-status ${product.status}"><i class="fa-solid fa-circle-check"></i> ${getFlashcardStatusLabel(currentFlashcardRecord)}</span>
        `;
    }
    queryAll(".mode-btn").forEach((link) => {
        link.href = product.studyUrl;
    });
    queryAll("[onclick]").forEach((element) => {
        const handler = element.getAttribute("onclick");
        if (handler?.includes("study.html")) {
            element.setAttribute("onclick", `window.location.href='${product.studyUrl}'`);
        }
        if (handler?.includes("create-set.html")) {
            element.setAttribute("onclick", `window.location.href='create-set.html?id=${product.id}'`);
        }
    });
    const saveButton = byId("btnSaveSet");
    if (saveButton) {
        saveButton.classList.toggle("saved", Boolean(currentFlashcardRecord.is_saved));
        saveButton.innerHTML = currentFlashcardRecord.is_saved
            ? '<i class="fa-solid fa-bookmark"></i> Da luu'
            : '<i class="fa-regular fa-bookmark"></i> Luu';
    }
}

async function initDetailPage() {
    if (!byId("termList"))
        return;
    if (!(await loadAppData()))
        return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();
    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0)
            return;
        detailCurrentCard--;
        updateCardDisplay();
    });
    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1)
            return;
        detailCurrentCard++;
        updateCardDisplay();
    });
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            byId("flashcardMain")?.classList.toggle("is-flipped");
        }
        if (event.code === "ArrowLeft" && detailCurrentCard > 0) {
            detailCurrentCard--;
            updateCardDisplay();
        }
        if (event.code === "ArrowRight" && detailCurrentCard < currentTerms.length - 1) {
            detailCurrentCard++;
            updateCardDisplay();
        }
    });
    on(byId("btnSaveSet"), "click", (event) => {
        void apiToggleSave(event.currentTarget, currentFlashcardProduct?.id);
    });
    const shareModal = byId("shareModal");
    on(byId("btnShareSet"), "click", () => showModal(shareModal));
    on(byId("closeShareModalBtn"), "click", () => hideModal(shareModal));
    on(window, "click", (event) => {
        if (shareModal && event.target === shareModal)
            hideModal(shareModal);
    });
    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");
        copyToClipboard(link).then(() => {
            if (!copyButton)
                return;
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Da sao chep';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chep';
            }, 2000);
        });
    });
}

function shareToSocial(platform) {
    const url = encodeURIComponent(currentShareUrl());
    const text = encodeURIComponent(currentFlashcardProduct?.title || "Flashcard Language");
    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    };
    const target = shareUrls[platform];
    if (target) {
        window.open(target, "_blank", "noopener,noreferrer,width=720,height=520");
    }
}

function renderTermList() {
    const list = byId("termList");
    if (!list)
        return;
    if (currentTerms.length === 0) {
        list.innerHTML = `
            <div class="term-item">
                <div class="term-word">Chua co the trong bo nay</div>
            </div>
        `;
        return;
    }
    list.innerHTML = currentTerms.map((term, index) => `
        <div class="term-item" data-index="${index}">
            <span class="term-num">${index + 1}</span>
            <div class="term-word">${renderTermSideV2(term.front, term.front_img)}</div>
            <div class="term-def">${renderTermSideV2(term.back, term.back_img)}</div>
            <div class="term-actions">
                <button class="term-icon-btn" type="button" data-speak="${index}" aria-label="Nghe phát âm" title="Nghe phát âm"><i class="fa-solid fa-volume-high"></i></button>
                <button class="term-icon-btn ${detailStarredV2.has(term.id) ? "starred" : ""}" type="button" data-star="${index}" title="Danh dau">
                    <i class="${detailStarredV2.has(term.id) ? "fa-solid" : "fa-regular"} fa-star"></i>
                </button>
            </div>
        </div>
    `).join("");

    list.querySelectorAll("[data-speak]").forEach((button) => {
        button.addEventListener("click", (event) => { event.stopPropagation(); speakTermV2(Number(button.dataset.speak)); });
    });
    list.querySelectorAll("[data-star]").forEach((button) => {
        button.addEventListener("click", () => toggleTermStarV2(Number(button.dataset.star)));
    });
}

function updateCardDisplay() {
    const term = currentTerms[detailCurrentCard];
    if (!term) {
        setText(byId("frontText"), "Chua co the");
        setText(byId("backText"), "Bo flashcard nay chua co card.");
        setSideImageV2("frontText", "frontImage", "");
        setSideImageV2("backText", "backImage", "");
        setText(byId("cardCounter"), "0 / 0");
        return;
    }
    setText(byId("frontText"), term.front);
    setText(byId("backText"), term.back);
    setSideImageV2("frontText", "frontImage", term.front_img);
    setSideImageV2("backText", "backImage", term.back_img);
    setText(byId("cardCounter"), `${detailCurrentCard + 1} / ${currentTerms.length}`);
    byId("flashcardMain")?.classList.remove("is-flipped");
}

async function initDetailPage() {
    if (!byId("termList"))
        return;
    if (!(await loadAppData()))
        return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();
    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0)
            return;
        detailCurrentCard--;
        updateCardDisplay();
    });
    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1)
            return;
        detailCurrentCard++;
        updateCardDisplay();
    });
    on(byId("expandBtn"), "click", toggleDetailFullscreenV2);
    on(document.querySelector(".term-list-header .control-btn"), "click", sortTermsV2);
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            byId("flashcardMain")?.classList.toggle("is-flipped");
        }
        if (event.code === "ArrowLeft" && detailCurrentCard > 0) {
            detailCurrentCard--;
            updateCardDisplay();
        }
        if (event.code === "ArrowRight" && detailCurrentCard < currentTerms.length - 1) {
            detailCurrentCard++;
            updateCardDisplay();
        }
    });
    on(byId("btnSaveSet"), "click", (event) => {
        void apiToggleSave(event.currentTarget, currentFlashcardProduct?.id);
    });
    const shareModal = byId("shareModal");
    on(byId("btnShareSet"), "click", () => showModal(shareModal));
    on(byId("closeShareModalBtn"), "click", () => hideModal(shareModal));
    on(window, "click", (event) => {
        if (shareModal && event.target === shareModal)
            hideModal(shareModal);
    });
    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");
        copyToClipboard(link).then(() => {
            if (!copyButton)
                return;
            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Da sao chep';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chep';
            }, 2000);
        });
    });
}
