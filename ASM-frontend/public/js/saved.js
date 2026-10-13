"use strict";
let savedFlashcardsCache = [];
let savedSortMode = "alpha";

function getSavedFlashcard(savedItem) {
    return savedItem?.flashcard || savedItem?.flashcard_id || savedItem || null;
}

function getSavedFlashcardName(savedItem) {
    return getSavedFlashcard(savedItem)?.name || "";
}

function getSavedDateValue(savedItem) {
    const flashcard = getSavedFlashcard(savedItem);
    const raw = savedItem?.updated_at || savedItem?.created_at || flashcard?.updated_at || flashcard?.created_at || flashcard?.createdAt || "";
    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function getSavedSearchText(savedItem) {
    const flashcard = getSavedFlashcard(savedItem);
    if (!flashcard)
        return "";
    const product = buildFlashcardProduct(flashcard);
    return [
        flashcard.name,
        flashcard.description,
        product.title,
        product.description,
        product.levelLabel,
        product.languagePair,
        product.frontLanguageName,
        product.backLanguageName,
        flashcard.topic_id?.name,
        flashcard.language_id?.name,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function getSortedSavedItems(items) {
    const collator = new Intl.Collator("vi", { sensitivity: "base" });
    return [...items].sort((a, b) => {
        if (savedSortMode === "newest" || savedSortMode === "recent") {
            return getSavedDateValue(b) - getSavedDateValue(a);
        }
        if (savedSortMode === "oldest") {
            return getSavedDateValue(a) - getSavedDateValue(b);
        }
        return collator.compare(getSavedFlashcardName(a), getSavedFlashcardName(b));
    });
}

function getVisibleSavedItems() {
    const searchInput = document.querySelector(".search-box-dashboard input");
    const keyword = searchInput?.value.trim().toLowerCase() || "";
    const checkedFilters = Array.from(queryAll("#filterMenu input[type='checkbox']:checked")).map((input) => input.value.toLowerCase());

    const filtered = savedFlashcardsCache.filter((item) => {
        const haystack = getSavedSearchText(item);
        const matchesKeyword = !keyword || haystack.includes(keyword);
        const matchesFilters = checkedFilters.length === 0 || checkedFilters.some((value) => haystack.includes(value));
        return matchesKeyword && matchesFilters;
    });

    return getSortedSavedItems(filtered);
}

function updateSavedActionCounts(items = savedFlashcardsCache) {
    const totalCards = items.reduce((total, item) => {
        const flashcard = getSavedFlashcard(item);
        const product = flashcard ? buildFlashcardProduct(flashcard) : null;
        return total + (product?.cardCount || flashcard?.cards_count || 0);
    }, 0);

    setText(document.querySelector(".btn-study-all .count"), totalCards);
    setText(document.querySelector(".btn-review .count"), totalCards);
}

function renderSavedCard(savedItem) {
    const flashcard = getSavedFlashcard(savedItem);
    if (!flashcard)
        return "";
    const product = buildFlashcardProduct(flashcard);
    return `
        <div class="card" onclick="window.location.href='detailFlashcard.html?id=${flashcard._id}'">
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(product.title)}</h3>
                <span class="badge ${product.levelClass}">${escapeHtml(product.levelLabel)}</span>
            </div>
            <div class="card-divider"></div>
            <p class="card-desc">${escapeHtml(product.description || "Khong co mo ta")}</p>
            <div class="card-footer" style="flex-direction:column;gap:10px;">
                <div style="display:flex;gap:15px;flex-wrap:wrap;">
                    <div class="footer-item"><i class="fa-regular fa-clone"></i> ${product.cardCount} the</div>
                    <div class="footer-item"><i class="fa-solid fa-language"></i> ${product.languagePair}</div>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--border-color);padding-top:10px;">
                    <button class="cat-btn" onclick="event.stopPropagation(); unsaveSavedCard(this, '${flashcard._id}')" style="padding:6px 14px;border-radius:20px;font-size:0.85rem;color:#ef4444;border-color:#fca5a5;background:#fef2f2;">
                        <i class="fa-solid fa-bookmark-slash"></i> Bo luu
                    </button>
                    <button class="blue-btn" onclick="event.stopPropagation(); window.location.href='study.html?id=${flashcard._id}'" style="padding:6px 14px;border-radius:20px;font-size:0.85rem;width:auto;">
                        <i class="fa-solid fa-graduation-cap"></i> Hoc ngay
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderSavedFlashcards(items = getVisibleSavedItems()) {
    const grid = document.querySelector(".cards-grid");
    if (!grid)
        return;
    updateSavedActionCounts(items);
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="card" style="cursor:default;">
                <div class="card-header"><h3 class="card-title">Chua co bo the da luu</h3></div>
                <div class="card-divider"></div>
                <p class="card-desc">Hay quay lai trang kham pha va luu bo the ban quan tam.</p>
            </div>
        `;
        return;
    }
    grid.innerHTML = items.map(renderSavedCard).join("");
}

function applySavedFilters() {
    renderSavedFlashcards(getVisibleSavedItems());
}

async function loadSavedFlashcards() {
    const grid = document.querySelector(".cards-grid");
    if (grid)
        grid.innerHTML = `<div class="card"><p class="card-desc">Dang tai du lieu...</p></div>`;
    try {
        const response = await apiRequest("/api/saved");
        savedFlashcardsCache = response.data.saved_flashcards || [];
        applySavedFilters();
    }
    catch (error) {
        if (grid)
            grid.innerHTML = `<div class="card"><p class="card-desc">${escapeHtml(error.message)}</p></div>`;
        updateSavedActionCounts([]);
    }
}

async function unsaveSavedCard(btn, flashcardId) {
    if (!confirm("Bo luu bo the nay?"))
        return;
    try {
        await apiRequest(`/api/saved/${flashcardId}`, { method: "DELETE" });
        savedFlashcardsCache = savedFlashcardsCache.filter((item) => getSavedFlashcard(item)?._id !== flashcardId);
        applySavedFilters();
    }
    catch (error) {
        alert(error.message);
    }
}

function openFirstSavedStudy() {
    const first = getSavedFlashcard(getVisibleSavedItems()[0]);
    if (!first?._id) {
        alert("Chua co bo the da luu de hoc.");
        return;
    }
    window.location.href = `study.html?id=${first._id}`;
}

function selectSavedSort(sortMode) {
    savedSortMode = sortMode || "alpha";
    queryAll("#sortMenu .sort-item").forEach((item) => {
        const selected = item.dataset.sort === savedSortMode;
        item.classList.toggle("selected", selected);
        const icon = item.querySelector("i.fa-check");
        if (selected && !icon) {
            item.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-check"></i> ');
        }
        if (!selected && icon) {
            icon.remove();
        }
    });
    applySavedFilters();
}

function initSavedWorkspaceActions() {
    if (typeof syncAccountSidebarAuthButton === "function") {
        syncAccountSidebarAuthButton();
    }

    queryAll(".btn-sidebar-login").forEach((button) => {
        on(button, "click", () => {
            clearAuthSession();
            window.location.href = "home.html";
        });
    });

    const categoryModal = byId("categoryModal");
    const createCategoryModal = byId("createCategoryModal");
    const selectSetModal = byId("selectSetModal");
    const editCategoryModal = byId("editCategoryModal");
    const manageTagsModal = byId("manageTagsModal");
    const settingsModal = byId("settingsModal");
    const filterBtn = byId("filterBtn");
    const filterMenu = byId("filterMenu");
    const sortBtn = byId("sortBtn");
    const sortMenu = byId("sortMenu");

    const closeSettingsModal = () => hideModal(settingsModal);
    const closeCreateModal = () => hideModal(createCategoryModal);
    const closeSelectModal = () => hideModal(selectSetModal);
    const closeEditCategoryModal = () => hideModal(editCategoryModal);

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

    on(byId("openSettingsModalBtn"), "click", (event) => {
        event.preventDefault();
        showModal(settingsModal);
    });
    on(byId("closeSettingsModalBtn"), "click", closeSettingsModal);
    on(byId("cancelSettingsBtn"), "click", closeSettingsModal);

    const user = getStoredUser();
    const profileInputs = settingsModal?.querySelectorAll("input");
    if (user && profileInputs?.length) {
        profileInputs[0].value = user.name || "";
        profileInputs[1].value = user.email || "";
    }

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
    on(filterMenu, "click", (event) => event.stopPropagation());
    on(sortMenu, "click", (event) => event.stopPropagation());

    queryAll("#filterMenu input[type='checkbox']").forEach((input) => {
        on(input, "change", applySavedFilters);
    });
    on(document.querySelector(".btn-clear-filter"), "click", () => {
        queryAll("#filterMenu input[type='checkbox']").forEach((input) => {
            input.checked = false;
        });
        applySavedFilters();
    });
    on(document.querySelector(".manage-cats-link"), "click", (event) => {
        event.preventDefault();
        filterMenu?.classList.remove("show");
        filterBtn?.classList.remove("active");
        showModal(categoryModal);
    });
    queryAll("#sortMenu .sort-item").forEach((item) => {
        on(item, "click", () => {
            selectSavedSort(item.dataset.sort || "alpha");
            sortMenu?.classList.remove("show");
            sortBtn?.classList.remove("active");
        });
    });

    on(document.querySelector(".btn-study-all"), "click", openFirstSavedStudy);
    on(document.querySelector(".btn-review"), "click", openFirstSavedStudy);

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
}

function initSavedPage() {
    if (!document.querySelector(".cards-grid") || !window.location.pathname.includes("saved.html"))
        return;
    if (!checkAuth()) {
        window.location.href = "home.html";
        return;
    }
    if (getStoredUser()?.role === "admin") {
        window.location.href = "admin.html";
        return;
    }
    initSavedWorkspaceActions();
    void loadSavedFlashcards();
    const searchInput = document.querySelector(".search-box-dashboard input");
    on(searchInput, "input", applySavedFilters);
}
