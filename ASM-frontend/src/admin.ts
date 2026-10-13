function adminEmptyRow(message: string, colspan: number): string {
    return `
        <tr>
            <td colspan="${colspan}" style="text-align:center;color:var(--text-muted);padding:30px;">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}

function adminStatusBadge(status: string): string {
    const isActive = status === "active";
    return `<span class="status-badge ${isActive ? "success" : "danger"}">${isActive ? "Hien thi" : "Da an"}</span>`;
}

function renderAdminStats(db: AppDatabase): void {
    const statValues = queryAll<HTMLElement>("#section-stats .stat-value");
    const publicCount = db.Flashcard.filter(
        (flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public",
    ).length;
    const pendingCount = db.Flashcard.filter(
        (flashcard) => flashcard.approval_status === "pending" && flashcard.visibility === "public",
    ).length;

    setText(statValues[0] ?? null, db.User.length);
    setText(statValues[1] ?? null, db.Flashcard.length);
    setText(statValues[2] ?? null, publicCount);
    setText(statValues[3] ?? null, pendingCount);
    setText(byId("pendingBadge"), pendingCount);
    setText(document.querySelector<HTMLElement>("#section-flashcards .admin-tabs .badge-new"), pendingCount);
}

function renderAdminRecentActivity(db: AppDatabase): void {
    const body = document.querySelector<HTMLTableSectionElement>("#section-stats .admin-table tbody");
    if (!body) return;

    const latestFlashcards = [...db.Flashcard]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    body.innerHTML = latestFlashcards
        .map((flashcard) => {
            const statusClass = flashcard.approval_status === "approved" ? "success" : flashcard.approval_status === "pending" ? "warning" : "danger";
            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="avatar">${escapeHtml(getUserName(db, flashcard.id_user).charAt(0).toUpperCase())}</div>
                            ${escapeHtml(getUserEmail(db, flashcard.id_user))}
                        </div>
                    </td>
                    <td>Tao bo the "${escapeHtml(flashcard.name)}"</td>
                    <td>${formatDate(flashcard.created_at)}</td>
                    <td><span class="status-badge ${statusClass}">${getFlashcardStatusLabel(flashcard)}</span></td>
                </tr>
            `;
        })
        .join("");
}

function adminFlashcardActionButtons(flashcard: FlashcardRecord, mode: ProductStatus | "hidden"): string {
    if (mode === "pending") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail(${flashcard.id_Flashcard})"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action approve" title="Duyet" onclick="approveSet(this)"><i class="fa-solid fa-check"></i></button>
            <button class="btn-action delete" title="Tu choi" onclick="rejectSet(this)"><i class="fa-solid fa-xmark"></i></button>
        `;
    }

    if (mode === "approved") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail(${flashcard.id_Flashcard})"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action" title="An bo the" onclick="hideSet(this)" style="background:#f1f5f9;color:#64748b;"><i class="fa-solid fa-eye-slash"></i></button>
        `;
    }

    return `<button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail(${flashcard.id_Flashcard})"><i class="fa-solid fa-eye"></i></button>`;
}

function renderAdminPendingRows(db: AppDatabase, flashcards: FlashcardRecord[]): string {
    if (flashcards.length === 0) return adminEmptyRow("Khong co bo the cho duyet trong db.json.", 8);

    return flashcards
        .map((flashcard, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(flashcard.name)}</strong></td>
                <td>${escapeHtml(getUserEmail(db, flashcard.id_user))}</td>
                <td>${getFlashcardCardCount(db, flashcard.id_Flashcard)}</td>
                <td>${escapeHtml(getTopicLabel(db, flashcard.id_topic))}</td>
                <td><span class="badge ${getLevelClass(db, flashcard.id_level)}">${escapeHtml(getLevelLabel(db, flashcard.id_level))}</span></td>
                <td>${formatDate(flashcard.created_at)}</td>
                <td class="action-btns">${adminFlashcardActionButtons(flashcard, "pending")}</td>
            </tr>
        `)
        .join("");
}

function renderAdminApprovedRows(db: AppDatabase, flashcards: FlashcardRecord[]): string {
    if (flashcards.length === 0) return adminEmptyRow("Khong co bo the cong khai trong db.json.", 6);

    return flashcards
        .map((flashcard, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(flashcard.name)}</td>
                <td>${escapeHtml(getUserEmail(db, flashcard.id_user))}</td>
                <td>${getFlashcardCardCount(db, flashcard.id_Flashcard)}</td>
                <td><span class="status-badge success">Cong khai</span></td>
                <td class="action-btns">${adminFlashcardActionButtons(flashcard, "approved")}</td>
            </tr>
        `)
        .join("");
}

function renderAdminRejectedRows(db: AppDatabase, flashcards: FlashcardRecord[]): string {
    if (flashcards.length === 0) return adminEmptyRow("Khong co bo the bi tu choi trong db.json.", 5);

    return flashcards
        .map((flashcard, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(flashcard.name)}</td>
                <td>${escapeHtml(getUserEmail(db, flashcard.id_user))}</td>
                <td>Chua co ly do trong db.json</td>
                <td class="action-btns">${adminFlashcardActionButtons(flashcard, "rejected")}</td>
            </tr>
        `)
        .join("");
}

function renderAdminHiddenRows(db: AppDatabase, flashcards: FlashcardRecord[]): string {
    if (flashcards.length === 0) return adminEmptyRow("Chua co bo the nao bi an.", 1);

    return flashcards
        .map((flashcard, index) => `
            <tr>
                <td>${index + 1}. ${escapeHtml(flashcard.name)} - ${escapeHtml(getUserEmail(db, flashcard.id_user))}</td>
            </tr>
        `)
        .join("");
}

function renderAdminFlashcards(db: AppDatabase): void {
    const pending = db.Flashcard.filter((flashcard) => flashcard.approval_status === "pending" && flashcard.visibility === "public");
    const approved = db.Flashcard.filter((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public");
    const rejected = db.Flashcard.filter((flashcard) => flashcard.approval_status === "rejected" && flashcard.visibility === "public");
    const hidden = db.Flashcard.filter((flashcard) => flashcard.visibility === "private");

    const pendingBody = document.querySelector<HTMLTableSectionElement>("#tab-pending tbody");
    const approvedBody = document.querySelector<HTMLTableSectionElement>("#tab-approved tbody");
    const rejectedBody = document.querySelector<HTMLTableSectionElement>("#tab-rejected tbody");
    const hiddenBody = document.querySelector<HTMLTableSectionElement>("#tab-hidden tbody");

    if (pendingBody) pendingBody.innerHTML = renderAdminPendingRows(db, pending);
    if (approvedBody) approvedBody.innerHTML = renderAdminApprovedRows(db, approved);
    if (rejectedBody) rejectedBody.innerHTML = renderAdminRejectedRows(db, rejected);
    if (hiddenBody) hiddenBody.innerHTML = renderAdminHiddenRows(db, hidden);
}

function renderAdminUsers(db: AppDatabase): void {
    const body = document.querySelector<HTMLTableSectionElement>("#section-users tbody");
    if (!body) return;

    body.innerHTML = db.User.map((user, index) => {
        const isAdmin = user.role === "admin";
        return `
            <tr>
                <td>${index + 1}</td>
                <td><div class="user-cell"><div class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div> ${escapeHtml(user.name)}</div></td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="status-badge ${isAdmin ? "warning" : "success"}">${isAdmin ? "Admin" : "Hoat dong"}</span></td>
                <td class="action-btns">
                    <button class="btn-action edit" title="Xem thong tin" onclick="viewUserDetail()"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-action delete" title="Khoa tai khoan" onclick="toggleUserStatus(this)"><i class="fa-solid fa-ban"></i></button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderAdminTopics(db: AppDatabase): void {
    const body = byId<HTMLTableSectionElement>("topicTableBody");
    if (!body) return;

    body.innerHTML = db.Topic.map((topic, index) => {
        const count = db.Flashcard.filter((flashcard) => flashcard.id_topic === topic.id_Topic).length;
        const isActive = topic.status === "active";
        const editArg = escapeAttribute(JSON.stringify(topic.label));

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(topic.label)}</td>
                <td>${count}</td>
                <td>${adminStatusBadge(topic.status)}</td>
                <td class="action-btns">
                    <button class="btn-action edit" onclick="editTopic(this, ${editArg})" title="Sua"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action ${isActive ? "" : "approve"}" onclick="toggleTopicStatus(this)" title="${isActive ? "An" : "Hien lai"}" ${isActive ? 'style="background:#fef9c3;color:#ca8a04;"' : ""}>
                        <i class="fa-solid ${isActive ? "fa-eye-slash" : "fa-eye"}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderAdminLookupTables(db: AppDatabase): void {
    const bodies = queryAll<HTMLTableSectionElement>("#section-filters .admin-table tbody");
    const levelBody = bodies[0];
    const languageBody = bodies[1];

    if (levelBody) {
        levelBody.innerHTML = db.Level.map((level, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(level.label)}</td>
                <td>${adminStatusBadge(level.status)}</td>
                <td class="action-btns">
                    <button class="btn-action" title="An" style="background:#fef9c3;color:#ca8a04;" onclick="toggleHide(this)"><i class="fa-solid fa-eye-slash"></i></button>
                </td>
            </tr>
        `).join("");
    }

    if (languageBody) {
        languageBody.innerHTML = db.Language.map((language, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(language.name)}</td>
                <td>${adminStatusBadge(language.status)}</td>
                <td class="action-btns">
                    <button class="btn-action" title="An" style="background:#fef9c3;color:#ca8a04;" onclick="toggleHide(this)"><i class="fa-solid fa-eye-slash"></i></button>
                </td>
            </tr>
        `).join("");
    }
}

function renderAdminFlashcardDetail(db: AppDatabase, flashcardId: number): void {
    const flashcard = db.Flashcard.find((item) => item.id_Flashcard === flashcardId);
    const body = byId("flashcardDetailModal")?.querySelector<HTMLElement>(".modal-body");
    if (!flashcard || !body) return;

    const cards = getFlashcardCards(db, flashcard.id_Flashcard);
    const cardRows = cards.length === 0
        ? `<div style="padding:12px 15px;color:var(--text-muted);">Chua co the trong db.json.</div>`
        : cards.map((card) => `
            <div style="padding:12px 15px;border-bottom:1px solid var(--border-color);display:grid;grid-template-columns:1fr 1fr;gap:20px;">
                <span>${escapeHtml(card.front)}</span>
                <span style="color:var(--text-muted);">${escapeHtml(card.back)}</span>
            </div>
        `).join("");

    body.innerHTML = `
        <div style="background:var(--search-bg);border-radius:12px;padding:20px;">
            <h3 style="margin-bottom:10px;">${escapeHtml(flashcard.name)}</h3>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                <span class="badge ${getLevelClass(db, flashcard.id_level)}">${escapeHtml(getLevelLabel(db, flashcard.id_level))}</span>
                <span class="badge" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(getLanguageName(db, flashcard.id_language))}</span>
                <span style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-clone"></i> ${cards.length} the</span>
            </div>
            <p style="font-size:0.9rem;color:var(--text-muted);">Mo ta: ${escapeHtml(flashcard.Description)}</p>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">Tac gia: ${escapeHtml(getUserEmail(db, flashcard.id_user))} | Ngay tao: ${formatDate(flashcard.created_at)}</p>
        </div>
        <div style="max-height:250px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;">
            <div style="padding:15px;border-bottom:1px solid var(--border-color);display:grid;grid-template-columns:1fr 1fr;gap:20px;background:var(--search-bg);font-weight:700;font-size:0.8rem;color:var(--text-muted);">
                <span>Mặt trước</span><span>Mặt sau</span>
            </div>
            ${cardRows}
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--border-color);padding-top:15px;">
            <button class="cat-btn" style="padding:10px 20px;color:#ef4444;border-color:#fca5a5;background:#fef2f2;" onclick="rejectFromModal()">
                <i class="fa-solid fa-xmark"></i> Tu choi
            </button>
            <button class="blue-btn" style="border-radius:20px;padding:10px 24px;width:auto;font-weight:700;" onclick="approveFromModal()">
                <i class="fa-solid fa-check"></i> Duyet cong khai
            </button>
        </div>
    `;
}

function renderAdminData(db: AppDatabase): void {
    renderAdminStats(db);
    renderAdminRecentActivity(db);
    renderAdminFlashcards(db);
    renderAdminUsers(db);
    renderAdminTopics(db);
    renderAdminLookupTables(db);
}

function showSection(name: string, el?: HTMLElement): void {
    queryAll<HTMLElement>(".admin-section").forEach((section) => section.classList.add("hidden"));
    queryAll<HTMLElement>(".sidebar-menu li").forEach((item) => item.classList.remove("active"));
    byId(`section-${name}`)?.classList.remove("hidden");
    el?.classList.add("active");
}

function switchTab(tabName: string, el: HTMLElement): void {
    queryAll<HTMLElement>(".admin-tab-content").forEach((tab) => tab.classList.add("hidden"));
    queryAll<HTMLElement>(".admin-tab").forEach((tab) => tab.classList.remove("active"));
    byId(`tab-${tabName}`)?.classList.remove("hidden");
    el.classList.add("active");
}

function viewDetail(flashcardId?: number): void {
    if (flashcardId && appDatabase) {
        renderAdminFlashcardDetail(appDatabase, flashcardId);
    }

    showModal(byId("flashcardDetailModal"));
}

function approveSet(btn: HTMLElement): void {
    if (!confirm("Duyet cong khai bo the nay?")) return;

    rowFromButton(btn)?.remove();
    alert("Da duyet thanh cong! Bo the se xuat hien cong khai.");
}

function rejectSet(btn: HTMLElement): void {
    currentRejectRow = rowFromButton(btn);
    showModal(byId("rejectModal"));
}

function confirmReject(): void {
    const reason = inputValue("rejectReason").trim();

    if (!reason) {
        alert("Vui long nhap ly do tu choi!");
        return;
    }

    currentRejectRow?.remove();
    currentRejectRow = null;
    hideModal(byId("rejectModal"));
    alert("Da tu choi bo the. Nguoi dung se nhan duoc thong bao.");
}

function hideSet(btn: HTMLElement): void {
    if (!confirm("An bo the nay khoi trang cong khai?")) return;

    rowFromButton(btn)?.remove();
    alert("Bo the da bi an.");
}

function approveFromModal(): void {
    hideModal(byId("flashcardDetailModal"));
    alert("Da duyet thanh cong!");
}

function rejectFromModal(): void {
    hideModal(byId("flashcardDetailModal"));
    showModal(byId("rejectModal"));
}

function viewUserDetail(): void {
    alert("Xem thong tin nguoi dung - Can ket noi API de hien thi day du");
}

function toggleUserStatus(btn: HTMLElement): void {
    const row = rowFromButton(btn);
    const statusCell = row?.querySelector<HTMLElement>(".status-badge");

    if (!row || !statusCell) return;

    const isLocked = statusCell.classList.contains("danger");

    if (isLocked) {
        if (!confirm("Mo khoa tai khoan nay?")) return;

        statusCell.textContent = "Hoat dong";
        statusCell.className = "status-badge success";
        btn.title = "Khoa tai khoan";
        btn.innerHTML = '<i class="fa-solid fa-ban"></i>';
        btn.className = "btn-action delete";
        return;
    }

    if (!confirm("Khoa tai khoan nay?")) return;

    statusCell.textContent = "Bi khoa";
    statusCell.className = "status-badge danger";
    btn.title = "Mo khoa";
    btn.innerHTML = '<i class="fa-solid fa-unlock"></i>';
    btn.className = "btn-action approve";
}

function openAddTopicModal(): void {
    editingTopicRow = null;
    setText(byId("topicModalTitle"), "Them chu de");

    const topicInput = byId<HTMLInputElement>("topicNameInput");
    if (topicInput) topicInput.value = "";

    showModal(byId("addTopicModal"));
}

function editTopic(btn: HTMLElement, name: string): void {
    editingTopicRow = rowFromButton(btn);
    setText(byId("topicModalTitle"), "Sua chu de");

    const topicInput = byId<HTMLInputElement>("topicNameInput");
    if (topicInput) topicInput.value = name;

    showModal(byId("addTopicModal"));
}

function saveTopic(): void {
    const name = inputValue("topicNameInput").trim();

    if (!name) {
        alert("Vui long nhap ten chu de!");
        return;
    }

    if (editingTopicRow) {
        editingTopicRow.cells[1].textContent = name;
        hideModal(byId("addTopicModal"));
        return;
    }

    const tbody = byId<HTMLTableSectionElement>("topicTableBody");
    if (!tbody) return;

    const rowCount = tbody.rows.length + 1;
    const tr = document.createElement("tr");
    const editArg = escapeAttribute(JSON.stringify(name));

    tr.innerHTML = `
        <td>${rowCount}</td>
        <td>${escapeHtml(name)}</td>
        <td>0</td>
        <td><span class="status-badge success">Hien thi</span></td>
        <td class="action-btns">
            <button class="btn-action edit" onclick="editTopic(this, ${editArg})" title="Sua"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-action" onclick="toggleTopicStatus(this)" title="An" style="background:#fef9c3;color:#ca8a04;"><i class="fa-solid fa-eye-slash"></i></button>
        </td>
    `;

    tbody.appendChild(tr);
    hideModal(byId("addTopicModal"));
}

function updateVisibilityButton(btn: HTMLElement, isHidden: boolean): void {
    btn.innerHTML = isHidden ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    btn.className = isHidden ? "btn-action" : "btn-action approve";

    if (isHidden) {
        btn.style.background = "#fef9c3";
        btn.style.color = "#ca8a04";
        btn.title = "An";
        return;
    }

    btn.style.background = "";
    btn.style.color = "";
    btn.title = "Hien lai";
}

function toggleStatusVisibility(btn: HTMLElement): void {
    const row = rowFromButton(btn);
    const statusCell = row?.querySelector<HTMLElement>(".status-badge");

    if (!row || !statusCell) return;

    const isCurrentlyHidden = statusCell.classList.contains("danger");
    statusCell.textContent = isCurrentlyHidden ? "Hien thi" : "Da an";
    statusCell.className = isCurrentlyHidden ? "status-badge success" : "status-badge danger";
    updateVisibilityButton(btn, isCurrentlyHidden);
}

function toggleTopicStatus(btn: HTMLElement): void {
    toggleStatusVisibility(btn);
}

function toggleHide(btn: HTMLElement): void {
    toggleStatusVisibility(btn);
}

function openAddLevelModal(): void {
    alert("Tinh nang them cap do can ket noi API.");
}

function openAddLangModal(): void {
    alert("Tinh nang them ngon ngu can ket noi API.");
}

async function initAdminPage(): Promise<void> {
    if (!byId("flashcardDetailModal")) return;

    if (await loadAppData()) {
        renderAdminData(appDatabase as AppDatabase);
    }

    on(window, "click", (event) => {
        ["flashcardDetailModal", "addTopicModal", "rejectModal"].forEach((id) => {
            const modal = byId(id);
            if (modal && event.target === modal) hideModal(modal);
        });
    });
}
