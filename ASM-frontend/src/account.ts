function confirmDelete(btn: HTMLElement): void {
    if (confirm("Ban co chac chan muon xoa bo the nay khong?")) {
        btn.closest(".set-card")?.remove();
    }
}

function getFlashcardStudySummary(db: AppDatabase, user: UserRecord, flashcard: FlashcardRecord): {
    learned: number;
    total: number;
    percent: number;
} {
    const cards = getFlashcardCards(db, flashcard.id_Flashcard);
    const cardIds = new Set(cards.map((card) => card.id_card));
    const learned = db.study_progress.filter((progress) => {
        if (progress.id_user !== user.id_user || !cardIds.has(progress.id_card)) return false;
        return progress.correct_count > 0 || progress.last_result === "good" || progress.last_result === "easy";
    }).length;
    const total = cards.length;

    return {
        learned,
        total,
        percent: total === 0 ? 0 : Math.round((learned / total) * 100),
    };
}

function renderAccountFlashcardCard(db: AppDatabase, user: UserRecord, flashcard: FlashcardRecord): string {
    const summary = getFlashcardStudySummary(db, user, flashcard);
    const statusClass = getFlashcardStatusClass(flashcard);
    const language = getLanguageName(db, flashcard.id_language);

    return `
        <div class="set-card" style="cursor:pointer;" onclick="window.location.href='detailFlashcard.html?id=${flashcard.id_Flashcard}'">
            <div class="set-card-header">
                <div>
                    <span class="tag-english">${escapeHtml(language)}</span>
                    <h3>${escapeHtml(flashcard.name)}</h3>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span class="set-status-badge ${statusClass}">${getFlashcardStatusLabel(flashcard)}</span>
                    <button class="btn-delete-set" onclick="event.stopPropagation(); confirmDelete(this)" title="Xoa">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <p class="set-card-desc">${escapeHtml(flashcard.Description || "Khong co mo ta")}</p>
            <div class="progress-section">
                <div class="progress-labels"><span>Da thuoc</span><span>${summary.learned}/${summary.total}</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:${summary.percent}%;"></div></div>
            </div>
            <div class="set-card-footer">
                <div><i class="fa-solid fa-clone"></i> ${summary.total} the</div>
                <div style="display:flex;gap:8px;">
                    <button class="cat-btn" onclick="event.stopPropagation(); window.location.href='create-set.html'" style="padding:5px 12px;font-size:0.8rem;">
                        <i class="fa-solid fa-pen"></i> Sua
                    </button>
                    <button class="blue-btn" onclick="event.stopPropagation(); window.location.href='study.html?id=${flashcard.id_Flashcard}'" style="padding:5px 12px;font-size:0.8rem;border-radius:20px;width:auto;">
                        <i class="fa-solid fa-graduation-cap"></i> Hoc
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderAccountFlashcards(db: AppDatabase): void {
    const grid = document.querySelector<HTMLElement>(".dashboard-grid");
    if (!grid) return;

    const user = getCurrentUser(db);
    if (!user) {
        grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Chua co nguoi dung trong db.json.</p></div>`;
        return;
    }

    const flashcards = db.Flashcard.filter((flashcard) => flashcard.id_user === user.id_user);
    const title = document.querySelector<HTMLElement>(".dashboard-header h2");
    if (title) title.textContent = `Bo the cua ${user.name}`;

    if (flashcards.length === 0) {
        grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Nguoi dung nay chua co bo the nao trong db.json.</p></div>`;
        return;
    }

    grid.innerHTML = flashcards.map((flashcard) => renderAccountFlashcardCard(db, user, flashcard)).join("");

    const totalCards = flashcards.reduce((total, flashcard) => total + getFlashcardCardCount(db, flashcard.id_Flashcard), 0);
    setText(document.querySelector<HTMLElement>(".btn-study-all .count"), totalCards);
    setText(document.querySelector<HTMLElement>(".btn-review .count"), totalCards);
}

function syncAccountSidebarAuthButton(): void {
    const user = typeof getStoredUser === "function" ? getStoredUser() : null;
    const title = user?.name ? `Dang xuat ${user.name}` : "Dang xuat";

    queryAll<HTMLElement>(".btn-sidebar-login").forEach((button) => {
        button.classList.add("is-logout");
        button.setAttribute("title", title);
        button.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> &#272;&#259;ng xu&#7845;t';
    });
}
async function initAccountPage(): Promise<void> {
    if (!window.location.pathname.includes("account.html")) return;
    if (!byId("settingsModal")) return;

    syncAccountSidebarAuthButton();

    const settingsModal = byId("settingsModal");
    const categoryModal = byId("categoryModal");
    const createCategoryModal = byId("createCategoryModal");
    const selectSetModal = byId("selectSetModal");
    const editCategoryModal = byId("editCategoryModal");
    const manageTagsModal = byId("manageTagsModal");
    const filterBtn = byId("filterBtn");
    const filterMenu = byId("filterMenu");
    const sortBtn = byId("sortBtn");
    const sortMenu = byId("sortMenu");

    if (await loadAppData()) {
        renderAccountFlashcards(appDatabase as AppDatabase);
    }

    const closeSettingsModal = (): void => hideModal(settingsModal);
    const closeCreateModal = (): void => hideModal(createCategoryModal);
    const closeSelectModal = (): void => hideModal(selectSetModal);
    const closeEditCategoryModal = (): void => hideModal(editCategoryModal);

    on(byId("openSettingsModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(settingsModal);
    });

    on(byId("closeSettingsModalBtn"), "click", closeSettingsModal);
    on(byId("cancelSettingsBtn"), "click", closeSettingsModal);

    on(byId("openCategoryModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(categoryModal);
    });

    on(byId("closeCategoryModalBtn"), "click", () => hideModal(categoryModal));

    on(byId("openCreateCategoryModalBtn"), "click", () => showModal(createCategoryModal));
    on(byId("closeCreateCategoryModalBtn"), "click", closeCreateModal);
    on(byId("cancelCreateCategoryBtn"), "click", closeCreateModal);

    queryAll<HTMLElement>(".btn-open-select-set").forEach((btn) => {
        on(btn, "click", () => showModal(selectSetModal));
    });

    on(byId("closeSelectSetModalBtn"), "click", closeSelectModal);
    on(byId("cancelSelectSetBtn"), "click", closeSelectModal);

    queryAll<HTMLElement>(".btn-open-edit-category").forEach((btn) => {
        on(btn, "click", () => showModal(editCategoryModal));
    });

    on(byId("closeEditCategoryModalBtn"), "click", closeEditCategoryModal);
    on(byId("cancelEditCategoryBtn"), "click", closeEditCategoryModal);

    on(byId("openManageTagsModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(manageTagsModal);
    });

    on(byId("closeManageTagsModalBtn"), "click", () => hideModal(manageTagsModal));

    on(filterBtn, "click", (event) => {
        event.stopPropagation();
        filterMenu?.classList.toggle("show");
        filterBtn?.classList.toggle("active");
        sortMenu?.classList.remove("show");
        sortBtn?.classList.remove("active");
    });

    on(sortBtn, "click", (event) => {
        event.stopPropagation();
        sortMenu?.classList.toggle("show");
        sortBtn?.classList.toggle("active");
        filterMenu?.classList.remove("show");
        filterBtn?.classList.remove("active");
    });

    on(window, "click", (event) => {
        const target = event.target instanceof Node ? event.target : null;

        if (target && filterMenu && filterBtn && !filterMenu.contains(target) && !filterBtn.contains(target)) {
            filterMenu.classList.remove("show");
            filterBtn.classList.remove("active");
        }

        if (target && sortMenu && sortBtn && !sortMenu.contains(target) && !sortBtn.contains(target)) {
            sortMenu.classList.remove("show");
            sortBtn.classList.remove("active");
        }

        if (categoryModal && event.target === categoryModal) hideModal(categoryModal);
        if (createCategoryModal && event.target === createCategoryModal) hideModal(createCategoryModal);
        if (selectSetModal && event.target === selectSetModal) hideModal(selectSetModal);
        if (editCategoryModal && event.target === editCategoryModal) hideModal(editCategoryModal);
        if (manageTagsModal && event.target === manageTagsModal) hideModal(manageTagsModal);
        if (settingsModal && event.target === settingsModal) hideModal(settingsModal);
    });

    on(filterMenu, "click", (event) => {
        event.stopPropagation();
    });
}
