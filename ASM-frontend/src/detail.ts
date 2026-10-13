function renderTermList(): void {
    const list = byId("termList");
    if (!list) return;

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

function updateCardDisplay(): void {
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

function copyToClipboard(text: string): Promise<void> {
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

function shareToSocial(platform: string): void {
    alert(`Chia sẻ lên ${platform} - Tính năng này cần kết nối API`);
}

function currentShareUrl(): string {
    if (!currentFlashcardProduct) return window.location.href;
    return `${window.location.origin}${window.location.pathname}?id=${currentFlashcardProduct.id}`;
}

function renderCurrentFlashcardDetail(): void {
    if (!currentFlashcardProduct || !currentFlashcardRecord || !appDatabase) return;

    const product = currentFlashcardProduct;
    const author = findById(appDatabase.User, "id_user", currentFlashcardRecord.id_user);
    const language = findById(appDatabase.Language, "id_language", currentFlashcardRecord.id_language);
    const meta = document.querySelector<HTMLElement>(".set-meta");

    document.title = `${product.title} | Flashcard Language`;
    setText(document.querySelector<HTMLElement>(".set-title"), product.title);
    setText(document.querySelector<HTMLElement>(".set-breadcrumb span:last-child"), product.title);
    setText(document.querySelector<HTMLElement>(".term-list-header h3"), `Thuat ngu trong bo the nay (${currentTerms.length})`);
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

    queryAll<HTMLAnchorElement>(".mode-btn").forEach((link) => {
        link.href = product.studyUrl;
    });

    queryAll<HTMLElement>("[onclick]").forEach((element) => {
        const handler = element.getAttribute("onclick");
        if (handler?.includes("study.html")) {
            element.setAttribute("onclick", `window.location.href='${product.studyUrl}'`);
        }
    });
}

function renderCurrentStudyHeader(): void {
    if (!currentFlashcardProduct) return;

    const product = currentFlashcardProduct;
    const logo = document.querySelector<HTMLAnchorElement>("header .logo");

    document.title = `Hoc ${product.title} | Flashcard Language`;

    if (logo) {
        logo.href = product.detailUrl;
        logo.innerHTML = `
            <i class="fa-solid fa-arrow-left" style="font-size:1rem;"></i>
            ${escapeHtml(product.title)}
        `;
    }

    queryAll<HTMLElement>("[onclick]").forEach((element) => {
        const handler = element.getAttribute("onclick");
        if (handler?.includes("detailFlashcard.html")) {
            element.setAttribute("onclick", `window.location.href='${product.detailUrl}'`);
        }
    });
}

async function initDetailPage(): Promise<void> {
    if (!byId("termList")) return;

    if (!(await loadAppData())) return;
    renderTermList();
    renderCurrentFlashcardDetail();
    updateCardDisplay();

    on(byId("prevBtn"), "click", () => {
        if (detailCurrentCard <= 0) return;
        detailCurrentCard--;
        updateCardDisplay();
    });

    on(byId("nextBtn"), "click", () => {
        if (detailCurrentCard >= currentTerms.length - 1) return;
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
        const button = event.currentTarget as HTMLElement;
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
        if (shareModal && event.target === shareModal) hideModal(shareModal);
    });

    on(byId("copyLinkBtn"), "click", () => {
        const link = byId("shareLink")?.textContent ?? "";
        const copyButton = byId("copyLinkBtn");

        copyToClipboard(link).then(() => {
            if (!copyButton) return;

            copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Sao chép';
            }, 2000);
        });
    });
}
