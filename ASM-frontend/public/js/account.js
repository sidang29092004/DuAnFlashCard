"use strict";
function confirmDelete(btn) {
    if (confirm("Ban co chac chan muon xoa bo the nay khong?")) {
        btn.closest(".set-card")?.remove();
    }
}
function getFlashcardStudySummary(db, user, flashcard) {
    const cards = getFlashcardCards(db, flashcard.id_Flashcard);
    const cardIds = new Set(cards.map((card) => card.id_card));
    const learned = db.study_progress.filter((progress) => {
        if (progress.id_user !== user.id_user || !cardIds.has(progress.id_card))
            return false;
        return progress.correct_count > 0 || progress.last_result === "good" || progress.last_result === "easy";
    }).length;
    const total = cards.length;
    return {
        learned,
        total,
        percent: total === 0 ? 0 : Math.round((learned / total) * 100),
    };
}
function renderAccountFlashcardCard(db, user, flashcard) {
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
function renderAccountFlashcards(db) {
    const grid = document.querySelector(".dashboard-grid");
    if (!grid)
        return;
    const user = getCurrentUser(db);
    if (!user) {
        grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Chua co nguoi dung trong db.json.</p></div>`;
        return;
    }
    const flashcards = db.Flashcard.filter((flashcard) => flashcard.id_user === user.id_user);
    const title = document.querySelector(".dashboard-header h2");
    if (title)
        title.textContent = `Bo the cua ${user.name}`;
    if (flashcards.length === 0) {
        grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Nguoi dung nay chua co bo the nao trong db.json.</p></div>`;
        return;
    }
    grid.innerHTML = flashcards.map((flashcard) => renderAccountFlashcardCard(db, user, flashcard)).join("");
    const totalCards = flashcards.reduce((total, flashcard) => total + getFlashcardCardCount(db, flashcard.id_Flashcard), 0);
    setText(document.querySelector(".btn-study-all .count"), totalCards);
    setText(document.querySelector(".btn-review .count"), totalCards);
}
function syncAccountSidebarAuthButton() {
    const user = typeof getStoredUser === "function" ? getStoredUser() : null;
    const title = user?.name ? `Dang xuat ${user.name}` : "Dang xuat";
    queryAll(".btn-sidebar-login").forEach((button) => {
        button.classList.add("is-logout");
        button.setAttribute("title", title);
        button.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> &#272;&#259;ng xu&#7845;t';
    });
}
async function initAccountPage() {
    if (!window.location.pathname.includes("account.html"))
        return;
    if (!byId("settingsModal"))
        return;
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
        renderAccountFlashcards(appDatabase);
    }
    const closeSettingsModal = () => hideModal(settingsModal);
    const closeCreateModal = () => hideModal(createCategoryModal);
    const closeSelectModal = () => hideModal(selectSetModal);
    const closeEditCategoryModal = () => hideModal(editCategoryModal);
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
    queryAll(".btn-open-select-set").forEach((btn) => {
        on(btn, "click", () => showModal(selectSetModal));
    });
    on(byId("closeSelectSetModalBtn"), "click", closeSelectModal);
    on(byId("cancelSelectSetBtn"), "click", closeSelectModal);
    queryAll(".btn-open-edit-category").forEach((btn) => {
        on(btn, "click", () => showModal(editCategoryModal));
    });
    on(byId("closeEditCategoryModalBtn"), "click", closeEditCategoryModal);
    on(byId("cancelEditCategoryBtn"), "click", closeEditCategoryModal);
    on(byId("openManageTagsModalBtn"), "click", (event) => {
        event.preventDefault();
        openManageTagsModal(manageTagsModal);
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
        if (categoryModal && event.target === categoryModal)
            hideModal(categoryModal);
        if (createCategoryModal && event.target === createCategoryModal)
            hideModal(createCategoryModal);
        if (selectSetModal && event.target === selectSetModal)
            hideModal(selectSetModal);
        if (editCategoryModal && event.target === editCategoryModal)
            hideModal(editCategoryModal);
        if (manageTagsModal && event.target === manageTagsModal)
            hideModal(manageTagsModal);
        if (settingsModal && event.target === settingsModal)
            hideModal(settingsModal);
    });
    on(filterMenu, "click", (event) => {
        event.stopPropagation();
    });
}

async function confirmDelete(btn, flashcardId) {
    if (!flashcardId)
        return;
    if (!confirm("Ban co chac chan muon xoa bo the nay khong?"))
        return;
    try {
        await apiRequest(`/api/flashcards/${flashcardId}`, { method: "DELETE" });
        btn.closest(".set-card")?.remove();
    }
    catch (error) {
        alert(error.message);
    }
}

function renderAccountFlashcardCard(flashcard) {
    const product = buildFlashcardProduct(flashcard);
    const summary = flashcard.progress || { learned: 0, total: flashcard.cards_count || 0, percent: 0 };
    const statusClass = getFlashcardStatusClass(flashcard);
    return `
        <div class="set-card" style="cursor:pointer;" onclick="window.location.href='detailFlashcard.html?id=${flashcard._id}'">
            <div class="set-card-header">
                <div>
                    <span class="tag-english">${escapeHtml(product.frontLanguageName || "Ngôn ngữ")}</span>
                    <h3>${escapeHtml(flashcard.name)}</h3>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span class="set-status-badge ${statusClass}">${getFlashcardStatusLabel(flashcard)}</span>
                    <button class="btn-delete-set" onclick="event.stopPropagation(); confirmDelete(this, '${flashcard._id}')" title="Xoa">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
            <p class="set-card-desc">${escapeHtml(flashcard.description || "Khong co mo ta")}</p>
            <div class="progress-section">
                <div class="progress-labels"><span>Da hoc</span><span>${summary.learned}/${summary.total}</span></div>
                <div class="progress-bar"><div class="progress-fill" style="width:${summary.percent}%;"></div></div>
            </div>
            <div class="set-card-footer">
                <div><i class="fa-solid fa-clone"></i> ${summary.total} the</div>
                <div style="display:flex;gap:8px;">
                    <button class="cat-btn" onclick="event.stopPropagation(); window.location.href='create-set.html?id=${flashcard._id}'" style="padding:5px 12px;font-size:0.8rem;">
                        <i class="fa-solid fa-pen"></i> Sua
                    </button>
                    <button class="blue-btn" onclick="event.stopPropagation(); window.location.href='study.html?id=${flashcard._id}'" style="padding:5px 12px;font-size:0.8rem;border-radius:20px;width:auto;">
                        <i class="fa-solid fa-graduation-cap"></i> Hoc
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function renderAccountFlashcards() {
    const grid = document.querySelector(".dashboard-grid");
    if (!grid)
        return;
    grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Dang tai du lieu...</p></div>`;
    try {
        const response = await apiRequest("/api/flashcards/my");
        const flashcards = response.data.flashcards || [];
        const user = getStoredUser();
        const title = document.querySelector(".dashboard-header h2");
        if (title && user)
            title.textContent = `Bo the cua ${user.name}`;
        if (flashcards.length === 0) {
            grid.innerHTML = `<div class="set-card"><p class="set-card-desc">Ban chua co bo the nao.</p></div>`;
            return;
        }
        grid.innerHTML = flashcards.map(renderAccountFlashcardCard).join("");
        const totalCards = flashcards.reduce((total, flashcard) => total + (flashcard.cards_count || 0), 0);
        setText(document.querySelector(".btn-study-all .count"), totalCards);
        setText(document.querySelector(".btn-review .count"), totalCards);
    }
    catch (error) {
        grid.innerHTML = `<div class="set-card"><p class="set-card-desc">${escapeHtml(error.message)}</p></div>`;
    }
}

let managedTagsCache = [];

function renderManagedTags(tags = managedTagsCache) {
    const list = byId("tagList");
    if (!list)
        return;

    if (tags.length === 0) {
        list.innerHTML = `
            <div style="background-color:var(--search-bg); padding:15px; border-radius:12px; color:var(--text-muted);">
                Chua co tag nao.
            </div>
        `;
        return;
    }

    list.innerHTML = tags.map((tag) => `
        <div class="managed-tag-row" data-tag-id="${escapeAttribute(tag._id)}" style="display:flex; gap:15px; align-items:center; background-color:var(--search-bg); padding:15px; border-radius:12px;">
            <input type="text" class="form-input managed-tag-input" value="${escapeAttribute(tag.name || "")}" style="flex-grow:1; border-radius:8px;">
            <div style="width:32px; height:32px; background-color:#6366f1; border-radius:4px;"></div>
            <button class="cat-btn btn-save-tag" type="button"><i class="fa-solid fa-floppy-disk"></i> Save</button>
            <button class="cat-btn delete btn-delete-tag" type="button"><i class="fa-solid fa-trash-can"></i> Delete</button>
        </div>
    `).join("");
}

async function loadManagedTags() {
    const list = byId("tagList");
    if (list) {
        list.innerHTML = `
            <div style="background-color:var(--search-bg); padding:15px; border-radius:12px; color:var(--text-muted);">
                Dang tai tag...
            </div>
        `;
    }

    const response = await apiRequest("/api/tags");
    managedTagsCache = response.data?.tags || [];
    renderManagedTags();
    return managedTagsCache;
}

async function addManagedTag() {
    const input = byId("newTagNameInput");
    const button = byId("btnAddTag");
    const name = input?.value.trim() || "";

    if (!name) {
        alert("Vui long nhap ten tag.");
        input?.focus();
        return;
    }

    const originalHtml = button?.innerHTML || "";
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dang them...';
    }

    try {
        await apiRequest("/api/tags", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
        if (input)
            input.value = "";
        await loadManagedTags();
    }
    catch (error) {
        alert(error.message);
    }
    finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalHtml;
        }
    }
}

async function updateManagedTag(row) {
    const tagId = row.dataset.tagId;
    const input = row.querySelector(".managed-tag-input");
    const name = input?.value.trim() || "";

    if (!tagId || !name) {
        alert("Ten tag khong duoc de trong.");
        input?.focus();
        return;
    }

    try {
        await apiRequest(`/api/tags/${tagId}`, {
            method: "PUT",
            body: JSON.stringify({ name }),
        });
        await loadManagedTags();
    }
    catch (error) {
        alert(error.message);
    }
}

async function deleteManagedTag(row) {
    const tagId = row.dataset.tagId;
    if (!tagId)
        return;
    if (!confirm("Xoa tag nay? Tag se duoc go khoi cac bo the dang dung."))
        return;

    try {
        await apiRequest(`/api/tags/${tagId}`, { method: "DELETE" });
        await loadManagedTags();
    }
    catch (error) {
        alert(error.message);
    }
}

function initManageTagsModal() {
    const modal = byId("manageTagsModal");
    if (!modal || modal.dataset.tagManagerReady === "true")
        return;

    modal.dataset.tagManagerReady = "true";

    on(byId("btnAddTag"), "click", addManagedTag);
    on(byId("newTagNameInput"), "keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            void addManagedTag();
        }
    });

    on(byId("tagList"), "click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest("button");
        const row = target?.closest(".managed-tag-row");
        if (!button || !row)
            return;

        if (button.classList.contains("btn-save-tag")) {
            void updateManagedTag(row);
        }

        if (button.classList.contains("btn-delete-tag")) {
            void deleteManagedTag(row);
        }
    });
}

function openManageTagsModal(modal) {
    initManageTagsModal();
    showModal(modal);
    void loadManagedTags().catch((error) => {
        const list = byId("tagList");
        if (list) {
            list.innerHTML = `
                <div style="background-color:var(--search-bg); padding:15px; border-radius:12px; color:#ef4444;">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    });
}

function syncAccountSidebarAuthButton() {
    const user = typeof getStoredUser === "function" ? getStoredUser() : null;
    const title = user?.name ? `Dang xuat ${user.name}` : "Dang xuat";
    queryAll(".btn-sidebar-login").forEach((button) => {
        button.classList.add("is-logout");
        button.setAttribute("title", title);
        button.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> &#272;&#259;ng xu&#7845;t';
    });
}
async function initAccountPage() {
    if (!window.location.pathname.includes("account.html"))
        return;
    if (!byId("settingsModal"))
        return;
    if (!checkAuth()) {
        window.location.href = "home.html";
        return;
    }
    if (getStoredUser()?.role === "admin") {
        window.location.href = "admin.html";
        return;
    }
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
    await renderAccountFlashcards();
    queryAll(".btn-login, .btn-sidebar-login").forEach((button) => {
        on(button, "click", () => {
            clearAuthSession();
            window.location.href = "home.html";
        });
    });
    const user = getStoredUser();
    const profileInputs = settingsModal?.querySelectorAll("input");
    if (user && profileInputs?.length) {
        profileInputs[0].value = user.name || "";
        profileInputs[1].value = user.email || "";
    }
    const closeSettingsModal = () => hideModal(settingsModal);
    const closeCreateModal = () => hideModal(createCategoryModal);
    const closeSelectModal = () => hideModal(selectSetModal);
    const closeEditCategoryModal = () => hideModal(editCategoryModal);
    on(byId("openSettingsModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(settingsModal);
    });
    on(byId("closeSettingsModalBtn"), "click", closeSettingsModal);
    on(byId("cancelSettingsBtn"), "click", closeSettingsModal);
    const settingsSaveButton = Array.from(settingsModal?.querySelectorAll(".blue-btn") || []).pop();
    on(settingsSaveButton, "click", async () => {
        const passwordInputs = settingsModal.querySelectorAll('input[type="password"]');
        const current_password = passwordInputs[0]?.value || "";
        const new_password = passwordInputs[1]?.value || "";
        const confirmPassword = passwordInputs[2]?.value || "";
        if (!current_password && !new_password && !confirmPassword) {
            hideModal(settingsModal);
            return;
        }
        if (!current_password || !new_password || new_password !== confirmPassword) {
            alert("Vui long kiem tra lai mat khau.");
            return;
        }
        try {
            await apiRequest("/api/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({ current_password, new_password }),
            });
            alert("Da doi mat khau.");
            passwordInputs.forEach((input) => {
                input.value = "";
            });
            hideModal(settingsModal);
        }
        catch (error) {
            alert(error.message);
        }
    });
    on(byId("openCategoryModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(categoryModal);
    });
    on(byId("closeCategoryModalBtn"), "click", () => hideModal(categoryModal));
    on(byId("openCreateCategoryModalBtn"), "click", () => showModal(createCategoryModal));
    on(byId("closeCreateCategoryModalBtn"), "click", closeCreateModal);
    on(byId("cancelCreateCategoryBtn"), "click", closeCreateModal);
    queryAll(".btn-open-select-set").forEach((btn) => {
        on(btn, "click", () => showModal(selectSetModal));
    });
    on(byId("closeSelectSetModalBtn"), "click", closeSelectModal);
    on(byId("cancelSelectSetBtn"), "click", closeSelectModal);
    queryAll(".btn-open-edit-category").forEach((btn) => {
        on(btn, "click", () => showModal(editCategoryModal));
    });
    on(byId("closeEditCategoryModalBtn"), "click", closeEditCategoryModal);
    on(byId("cancelEditCategoryBtn"), "click", closeEditCategoryModal);
    on(byId("openManageTagsModalBtn"), "click", (event) => {
        event.preventDefault();
        openManageTagsModal(manageTagsModal);
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
        if (categoryModal && event.target === categoryModal)
            hideModal(categoryModal);
        if (createCategoryModal && event.target === createCategoryModal)
            hideModal(createCategoryModal);
        if (selectSetModal && event.target === selectSetModal)
            hideModal(selectSetModal);
        if (editCategoryModal && event.target === editCategoryModal)
            hideModal(editCategoryModal);
        if (manageTagsModal && event.target === manageTagsModal)
            hideModal(manageTagsModal);
        if (settingsModal && event.target === settingsModal)
            hideModal(settingsModal);
    });
    on(filterMenu, "click", (event) => {
        event.stopPropagation();
    });
}
