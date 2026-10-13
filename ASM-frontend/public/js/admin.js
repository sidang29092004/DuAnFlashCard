"use strict";
function adminEmptyRow(message, colspan) {
    return `
        <tr>
            <td colspan="${colspan}" style="text-align:center;color:var(--text-muted);padding:30px;">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
}
function adminStatusBadge(status) {
    const isActive = status === "active";
    return `<span class="status-badge ${isActive ? "success" : "danger"}">${isActive ? "Hien thi" : "Da an"}</span>`;
}
function renderAdminStats(db) {
    const statValues = queryAll("#section-stats .stat-value");
    const publicCount = db.Flashcard.filter((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public").length;
    const pendingCount = db.Flashcard.filter((flashcard) => flashcard.approval_status === "pending" && flashcard.visibility === "public").length;
    setText(statValues[0] ?? null, db.User.length);
    setText(statValues[1] ?? null, db.Flashcard.length);
    setText(statValues[2] ?? null, publicCount);
    setText(statValues[3] ?? null, pendingCount);
    setText(byId("pendingBadge"), pendingCount);
    setText(document.querySelector("#section-flashcards .admin-tabs .badge-new"), pendingCount);
}
function renderAdminRecentActivity(db) {
    const body = document.querySelector("#section-stats .admin-table tbody");
    if (!body)
        return;
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
function adminFlashcardActionButtons(flashcard, mode) {
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
function renderAdminPendingRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the cho duyet trong db.json.", 8);
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
function renderAdminApprovedRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the cong khai trong db.json.", 6);
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
function renderAdminRejectedRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the bi tu choi trong db.json.", 5);
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
function renderAdminHiddenRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Chua co bo the nao bi an.", 1);
    return flashcards
        .map((flashcard, index) => `
            <tr>
                <td>${index + 1}. ${escapeHtml(flashcard.name)} - ${escapeHtml(getUserEmail(db, flashcard.id_user))}</td>
            </tr>
        `)
        .join("");
}
function renderAdminFlashcards(db) {
    const pending = db.Flashcard.filter((flashcard) => flashcard.approval_status === "pending" && flashcard.visibility === "public");
    const approved = db.Flashcard.filter((flashcard) => flashcard.approval_status === "approved" && flashcard.visibility === "public");
    const rejected = db.Flashcard.filter((flashcard) => flashcard.approval_status === "rejected" && flashcard.visibility === "public");
    const hidden = db.Flashcard.filter((flashcard) => flashcard.visibility === "private");
    const pendingBody = document.querySelector("#tab-pending tbody");
    const approvedBody = document.querySelector("#tab-approved tbody");
    const rejectedBody = document.querySelector("#tab-rejected tbody");
    const hiddenBody = document.querySelector("#tab-hidden tbody");
    if (pendingBody)
        pendingBody.innerHTML = renderAdminPendingRows(db, pending);
    if (approvedBody)
        approvedBody.innerHTML = renderAdminApprovedRows(db, approved);
    if (rejectedBody)
        rejectedBody.innerHTML = renderAdminRejectedRows(db, rejected);
    if (hiddenBody)
        hiddenBody.innerHTML = renderAdminHiddenRows(db, hidden);
}
function renderAdminUsers(db) {
    const body = document.querySelector("#section-users tbody");
    if (!body)
        return;
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
function renderAdminTopics(db) {
    const body = byId("topicTableBody");
    if (!body)
        return;
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
function renderAdminLookupTables(db) {
    const bodies = queryAll("#section-filters .admin-table tbody");
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
function renderAdminFlashcardDetail(db, flashcardId) {
    const flashcard = db.Flashcard.find((item) => item.id_Flashcard === flashcardId);
    const body = byId("flashcardDetailModal")?.querySelector(".modal-body");
    if (!flashcard || !body)
        return;
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
function renderAdminData(db) {
    renderAdminStats(db);
    renderAdminRecentActivity(db);
    renderAdminFlashcards(db);
    renderAdminUsers(db);
    renderAdminTopics(db);
    renderAdminLookupTables(db);
}
function showSection(name, el) {
    queryAll(".admin-section").forEach((section) => section.classList.add("hidden"));
    queryAll(".sidebar-menu li").forEach((item) => item.classList.remove("active"));
    byId(`section-${name}`)?.classList.remove("hidden");
    el?.classList.add("active");
}
function switchTab(tabName, el) {
    queryAll(".admin-tab-content").forEach((tab) => tab.classList.add("hidden"));
    queryAll(".admin-tab").forEach((tab) => tab.classList.remove("active"));
    byId(`tab-${tabName}`)?.classList.remove("hidden");
    el.classList.add("active");
}
function viewDetail(flashcardId) {
    if (flashcardId && appDatabase) {
        renderAdminFlashcardDetail(appDatabase, flashcardId);
    }
    showModal(byId("flashcardDetailModal"));
}
function approveSet(btn) {
    if (!confirm("Duyet cong khai bo the nay?"))
        return;
    rowFromButton(btn)?.remove();
    alert("Da duyet thanh cong! Bo the se xuat hien cong khai.");
}
function rejectSet(btn) {
    currentRejectRow = rowFromButton(btn);
    showModal(byId("rejectModal"));
}
function confirmReject() {
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
function hideSet(btn) {
    if (!confirm("An bo the nay khoi trang cong khai?"))
        return;
    rowFromButton(btn)?.remove();
    alert("Bo the da bi an.");
}
function approveFromModal() {
    hideModal(byId("flashcardDetailModal"));
    alert("Da duyet thanh cong!");
}
function rejectFromModal() {
    hideModal(byId("flashcardDetailModal"));
    showModal(byId("rejectModal"));
}
function viewUserDetail() {
    alert("Xem thong tin nguoi dung - Can ket noi API de hien thi day du");
}
function toggleUserStatus(btn) {
    const row = rowFromButton(btn);
    const statusCell = row?.querySelector(".status-badge");
    if (!row || !statusCell)
        return;
    const isLocked = statusCell.classList.contains("danger");
    if (isLocked) {
        if (!confirm("Mo khoa tai khoan nay?"))
            return;
        statusCell.textContent = "Hoat dong";
        statusCell.className = "status-badge success";
        btn.title = "Khoa tai khoan";
        btn.innerHTML = '<i class="fa-solid fa-ban"></i>';
        btn.className = "btn-action delete";
        return;
    }
    if (!confirm("Khoa tai khoan nay?"))
        return;
    statusCell.textContent = "Bi khoa";
    statusCell.className = "status-badge danger";
    btn.title = "Mo khoa";
    btn.innerHTML = '<i class="fa-solid fa-unlock"></i>';
    btn.className = "btn-action approve";
}
function openAddTopicModal() {
    editingTopicRow = null;
    setText(byId("topicModalTitle"), "Them chu de");
    const topicInput = byId("topicNameInput");
    if (topicInput)
        topicInput.value = "";
    showModal(byId("addTopicModal"));
}
function editTopic(btn, name) {
    editingTopicRow = rowFromButton(btn);
    setText(byId("topicModalTitle"), "Sua chu de");
    const topicInput = byId("topicNameInput");
    if (topicInput)
        topicInput.value = name;
    showModal(byId("addTopicModal"));
}
function saveTopic() {
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
    const tbody = byId("topicTableBody");
    if (!tbody)
        return;
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
function updateVisibilityButton(btn, isHidden) {
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
function toggleStatusVisibility(btn) {
    const row = rowFromButton(btn);
    const statusCell = row?.querySelector(".status-badge");
    if (!row || !statusCell)
        return;
    const isCurrentlyHidden = statusCell.classList.contains("danger");
    statusCell.textContent = isCurrentlyHidden ? "Hien thi" : "Da an";
    statusCell.className = isCurrentlyHidden ? "status-badge success" : "status-badge danger";
    updateVisibilityButton(btn, isCurrentlyHidden);
}
async function toggleLookupStatus(btn, type, id, status) {
    if (!type || !id || !status) {
        toggleStatusVisibility(btn);
        return;
    }

    const nextStatus = status === "active" ? "inactive" : "active";
    try {
        await apiRequest(`/api/${type}/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus }),
        });
        await loadAdminData();
    }
    catch (error) {
        alert(error.message);
    }
}
function toggleTopicStatus(btn) {
    const row = rowFromButton(btn);
    void toggleLookupStatus(btn, "topics", row?.dataset.id, row?.dataset.status);
}
function toggleHide(btn, type, id, status) {
    void toggleLookupStatus(btn, type, id, status);
}
function openAddLevelModal() {
    alert("Tinh nang them cap do can ket noi API.");
}
function openAddLangModal() {
    alert("Tinh nang them ngon ngu can ket noi API.");
}
async function initAdminPage() {
    if (!byId("flashcardDetailModal"))
        return;
    if (await loadAppData()) {
        renderAdminData(appDatabase);
    }
    on(window, "click", (event) => {
        ["flashcardDetailModal", "addTopicModal", "rejectModal"].forEach((id) => {
            const modal = byId(id);
            if (modal && event.target === modal)
                hideModal(modal);
        });
    });
}

function adminFlashcardActionButtons(flashcard, mode) {
    if (mode === "pending") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action approve" title="Duyet" onclick="approveSet(this, '${flashcard._id}')"><i class="fa-solid fa-check"></i></button>
            <button class="btn-action delete" title="Tu choi" onclick="rejectSet(this, '${flashcard._id}')"><i class="fa-solid fa-xmark"></i></button>
        `;
    }
    if (mode === "approved") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action" title="An bo the" onclick="hideSet(this, '${flashcard._id}')" style="background:#f1f5f9;color:#64748b;"><i class="fa-solid fa-eye-slash"></i></button>
        `;
    }
    return `<button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>`;
}

async function viewDetail(flashcardId) {
    if (flashcardId) {
        currentDetailFlashcardId = flashcardId;
        const response = await apiRequest(`/api/flashcards/${flashcardId}`);
        const flashcard = response.data.flashcard;
        const cards = response.data.cards || [];
        const body = byId("flashcardDetailModal")?.querySelector(".modal-body");
        if (body) {
            const cardRows = cards.length === 0
                ? `<div style="padding:12px 15px;color:var(--text-muted);">Chua co the.</div>`
                : cards.map((card) => `
                    <div class="admin-card-row">
                        ${adminCardSideHtmlV2(card.front, card.front_img)}
                        ${adminCardSideHtmlV2(card.back, card.back_img)}
                    </div>
                `).join("");
            body.innerHTML = `
                <div style="background:var(--search-bg);border-radius:12px;padding:20px;">
                    <h3 style="margin-bottom:10px;">${escapeHtml(flashcard.name)}</h3>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                        <span class="badge ${normalizeLevelCode(flashcardLevelName(flashcard))}">${escapeHtml(flashcardLevelName(flashcard))}</span>
                        <span class="badge" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(flashcard.language_id?.name || "Ngon ngu")}</span>
                        <span style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-clone"></i> ${cards.length} the</span>
                    </div>
                    <p style="font-size:0.9rem;color:var(--text-muted);">Mo ta: ${escapeHtml(flashcard.description || "")}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">Tac gia: ${escapeHtml(flashcardOwnerEmail(flashcard))} | Ngay tao: ${formatDate(flashcard.created_at)}</p>
                </div>
                <div class="admin-card-preview-list">
                    <div class="admin-card-row admin-card-row-head">
                        <span>Mat truoc</span><span>Mat sau</span>
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
    }
    showModal(byId("flashcardDetailModal"));
}

async function hideSet(btn, flashcardId) {
    if (!flashcardId || !confirm("An bo the nay khoi trang cong khai?"))
        return;
    try {
        await apiRequest(`/api/admin/flashcards/${flashcardId}/hide`, { method: "PUT" });
        await loadAdminData();
        alert("Bo the da bi an.");
    } catch (error) {
        alert(error.message);
    }
}

async function viewUserDetail(userId) {
    if (!userId)
        return;
    try {
        const response = await apiRequest("/api/admin/users");
        const user = (response.data.users || []).find((item) => item._id === userId);
        if (!user)
            throw new Error("Khong tim thay user.");
        alert(`Ten: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nTrang thai: ${user.status}`);
    } catch (error) {
        alert(error.message);
    }
}

async function openAddLevelModal() {
    const name = prompt("Nhap ten cap do moi:");
    if (!name)
        return;
    try {
        await apiRequest("/api/levels", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), description: "", status: "active" }),
        });
        await loadAdminData();
    } catch (error) {
        alert(error.message);
    }
}

async function openAddLangModal() {
    const name = prompt("Nhap ten ngon ngu moi:");
    if (!name)
        return;
    const code = prompt("Nhap ma ngon ngu, vi du en, vi, ja:") || name.trim().slice(0, 2).toLowerCase();
    try {
        await apiRequest("/api/languages", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), code: code.trim().toLowerCase(), status: "active" }),
        });
        await loadAdminData();
    } catch (error) {
        alert(error.message);
    }
}

function adminCardSideHtmlV2(text, imagePath) {
    return `
        <div class="admin-card-side">
            <span>${escapeHtml(text || "")}</span>
            ${imagePath ? `<img src="${escapeAttribute(getImageUrl(imagePath))}" alt="Anh card" loading="lazy">` : ""}
        </div>
    `;
}

async function viewDetail(flashcardId) {
    if (flashcardId) {
        currentDetailFlashcardId = flashcardId;
        const response = await apiRequest(`/api/flashcards/${flashcardId}`);
        const flashcard = response.data.flashcard;
        const cards = response.data.cards || [];
        const body = byId("flashcardDetailModal")?.querySelector(".modal-body");
        if (body) {
            const cardRows = cards.length === 0
                ? `<div style="padding:12px 15px;color:var(--text-muted);">Chua co the.</div>`
                : cards.map((card) => `
                    <div class="admin-card-row">
                        ${adminCardSideHtmlV2(card.front, card.front_img)}
                        ${adminCardSideHtmlV2(card.back, card.back_img)}
                    </div>
                `).join("");
            body.innerHTML = `
                <div style="background:var(--search-bg);border-radius:12px;padding:20px;">
                    <h3 style="margin-bottom:10px;">${escapeHtml(flashcard.name)}</h3>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                        <span class="badge ${normalizeLevelCode(flashcardLevelName(flashcard))}">${escapeHtml(flashcardLevelName(flashcard))}</span>
                        <span class="badge" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(flashcard.language_id?.name || "Ngon ngu")}</span>
                        <span style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-clone"></i> ${cards.length} the</span>
                    </div>
                    <p style="font-size:0.9rem;color:var(--text-muted);">Mo ta: ${escapeHtml(flashcard.description || "")}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">Tac gia: ${escapeHtml(flashcardOwnerEmail(flashcard))} | Ngay tao: ${formatDate(flashcard.created_at)}</p>
                </div>
                <div class="admin-card-preview-list">
                    <div class="admin-card-row admin-card-row-head">
                        <span>Mat truoc</span><span>Mat sau</span>
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
    }
    showModal(byId("flashcardDetailModal"));
}

async function hideSet(btn, flashcardId) {
    const id = flashcardId || rowFromButton(btn)?.querySelector("[onclick*='viewDetail']")?.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
    if (!id || !confirm("An bo the nay khoi trang cong khai?"))
        return;
    try {
        await apiRequest(`/api/admin/flashcards/${id}/hide`, { method: "PUT" });
        await loadAdminData();
        alert("Bo the da bi an.");
    } catch (error) {
        alert(error.message);
    }
}

function adminFlashcardActionButtons(flashcard, mode) {
    if (mode === "pending") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action approve" title="Duyet" onclick="approveSet(this, '${flashcard._id}')"><i class="fa-solid fa-check"></i></button>
            <button class="btn-action delete" title="Tu choi" onclick="rejectSet(this, '${flashcard._id}')"><i class="fa-solid fa-xmark"></i></button>
        `;
    }
    if (mode === "approved") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action" title="An bo the" onclick="hideSet(this, '${flashcard._id}')" style="background:#f1f5f9;color:#64748b;"><i class="fa-solid fa-eye-slash"></i></button>
        `;
    }
    return `<button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>`;
}

async function viewUserDetail(userId) {
    if (!userId)
        return;
    try {
        const response = await apiRequest("/api/admin/users");
        const user = (response.data.users || []).find((item) => item._id === userId);
        if (!user)
            throw new Error("Khong tim thay user.");
        alert(`Ten: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nTrang thai: ${user.status}`);
    } catch (error) {
        alert(error.message);
    }
}

async function openAddLevelModal() {
    const name = prompt("Nhap ten cap do moi:");
    if (!name)
        return;
    try {
        await apiRequest("/api/levels", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), description: "", status: "active" }),
        });
        await loadAdminData();
    } catch (error) {
        alert(error.message);
    }
}

async function openAddLangModal() {
    const name = prompt("Nhap ten ngon ngu moi:");
    if (!name)
        return;
    const code = prompt("Nhap ma ngon ngu, vi du en, vi, ja:") || name.trim().slice(0, 2).toLowerCase();
    try {
        await apiRequest("/api/languages", {
            method: "POST",
            body: JSON.stringify({ name: name.trim(), code: code.trim().toLowerCase(), status: "active" }),
        });
        await loadAdminData();
    } catch (error) {
        alert(error.message);
    }
}

let currentRejectFlashcardId = null;
let currentDetailFlashcardId = null;

function adminStatusBadge(status) {
    const isActive = status === "active";
    return `<span class="status-badge ${isActive ? "success" : "danger"}">${isActive ? "Hien thi" : "Da an"}</span>`;
}

function adminFlashcardActionButtons(flashcard, mode) {
    if (mode === "pending") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action approve" title="Duyet" onclick="approveSet(this, '${flashcard._id}')"><i class="fa-solid fa-check"></i></button>
            <button class="btn-action delete" title="Tu choi" onclick="rejectSet(this, '${flashcard._id}')"><i class="fa-solid fa-xmark"></i></button>
        `;
    }
    if (mode === "approved") {
        return `
            <button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-action" title="An bo the" onclick="hideSet(this)" style="background:#f1f5f9;color:#64748b;"><i class="fa-solid fa-eye-slash"></i></button>
        `;
    }
    return `<button class="btn-action edit" title="Xem chi tiet" onclick="viewDetail('${flashcard._id}')"><i class="fa-solid fa-eye"></i></button>`;
}

function flashcardOwnerEmail(flashcard) {
    return flashcard.user_id?.email || "unknown@example.com";
}

function flashcardTopicName(flashcard) {
    return flashcard.topic_id?.name || "Khac";
}

function flashcardLevelName(flashcard) {
    return flashcard.level_id?.name || "Cấp độ";
}

function renderAdminPendingRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the cho duyet.", 8);
    return flashcards.map((flashcard, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(flashcard.name)}</strong></td>
            <td>${escapeHtml(flashcardOwnerEmail(flashcard))}</td>
            <td>${flashcard.cards_count || 0}</td>
            <td>${escapeHtml(flashcardTopicName(flashcard))}</td>
            <td><span class="badge ${normalizeLevelCode(flashcardLevelName(flashcard))}">${escapeHtml(flashcardLevelName(flashcard))}</span></td>
            <td>${formatDate(flashcard.created_at)}</td>
            <td class="action-btns">${adminFlashcardActionButtons(flashcard, "pending")}</td>
        </tr>
    `).join("");
}

function renderAdminApprovedRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the cong khai.", 6);
    return flashcards.map((flashcard, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(flashcard.name)}</td>
            <td>${escapeHtml(flashcardOwnerEmail(flashcard))}</td>
            <td>${flashcard.cards_count || 0}</td>
            <td><span class="status-badge success">Cong khai</span></td>
            <td class="action-btns">${adminFlashcardActionButtons(flashcard, "approved")}</td>
        </tr>
    `).join("");
}

function renderAdminRejectedRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Khong co bo the bi tu choi.", 5);
    return flashcards.map((flashcard, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(flashcard.name)}</td>
            <td>${escapeHtml(flashcardOwnerEmail(flashcard))}</td>
            <td>Bi tu choi boi admin</td>
            <td class="action-btns">${adminFlashcardActionButtons(flashcard, "rejected")}</td>
        </tr>
    `).join("");
}

function renderAdminHiddenRows(db, flashcards) {
    if (flashcards.length === 0)
        return adminEmptyRow("Chua co bo the rieng tu/an.", 1);
    return flashcards.map((flashcard, index) => `
        <tr><td>${index + 1}. ${escapeHtml(flashcard.name)} - ${escapeHtml(flashcardOwnerEmail(flashcard))}</td></tr>
    `).join("");
}

function renderAdminStatsFromApi(dashboard) {
    const statValues = queryAll("#section-stats .stat-value");
    const totals = dashboard.totals || {};
    setText(statValues[0] ?? null, totals.users || 0);
    setText(statValues[1] ?? null, totals.flashcards || 0);
    setText(statValues[2] ?? null, totals.public_flashcards || 0);
    setText(statValues[3] ?? null, totals.pending_flashcards || 0);
    setText(byId("pendingBadge"), totals.pending_flashcards || 0);
    setText(document.querySelector("#section-flashcards .admin-tabs .badge-new"), totals.pending_flashcards || 0);
}

function renderAdminRecentActivityFromApi(flashcards) {
    const body = document.querySelector("#section-stats .admin-table tbody");
    if (!body)
        return;
    body.innerHTML = (flashcards || []).map((flashcard) => {
        const statusClass = flashcard.approval_status === "approved" ? "success" : flashcard.approval_status === "pending" ? "warning" : "danger";
        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="avatar">${escapeHtml((flashcard.user_id?.name || "U").charAt(0).toUpperCase())}</div>
                        ${escapeHtml(flashcardOwnerEmail(flashcard))}
                    </div>
                </td>
                <td>Tao bo the "${escapeHtml(flashcard.name)}"</td>
                <td>${formatDate(flashcard.created_at)}</td>
                <td><span class="status-badge ${statusClass}">${getFlashcardStatusLabel(flashcard)}</span></td>
            </tr>
        `;
    }).join("");
}

function renderAdminUsersFromApi(users) {
    const body = document.querySelector("#section-users tbody");
    if (!body)
        return;
    body.innerHTML = users.map((user, index) => {
        const isAdmin = user.role === "admin";
        const locked = user.status === "locked";
        return `
            <tr>
                <td>${index + 1}</td>
                <td><div class="user-cell"><div class="avatar">${escapeHtml(user.name.charAt(0).toUpperCase())}</div> ${escapeHtml(user.name)}</div></td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="status-badge ${locked ? "danger" : isAdmin ? "warning" : "success"}">${locked ? "Bi khoa" : isAdmin ? "Admin" : "Hoat dong"}</span></td>
                <td class="action-btns">
                    <button class="btn-action edit" title="Xem thong tin" onclick="viewUserDetail('${user._id}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-action ${locked ? "approve" : "delete"}" title="${locked ? "Mo khoa" : "Khoa tai khoan"}" onclick="toggleUserStatus(this, '${user._id}', '${user.status}')">
                        <i class="fa-solid ${locked ? "fa-unlock" : "fa-ban"}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderAdminTopicsFromApi(topics) {
    const body = byId("topicTableBody");
    if (!body)
        return;
    body.innerHTML = topics.map((topic, index) => {
        const isActive = topic.status === "active";
        const editArg = escapeAttribute(JSON.stringify(topic.name));
        return `
            <tr data-id="${topic._id}" data-status="${topic.status}">
                <td>${index + 1}</td>
                <td>${escapeHtml(topic.name)}</td>
                <td>-</td>
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

function renderAdminLookupTablesFromApi(levels, languages) {
    const bodies = queryAll("#section-filters .admin-table tbody");
    const levelBody = bodies[0];
    const languageBody = bodies[1];
    if (levelBody) {
        levelBody.innerHTML = levels.map((level, index) => `
            <tr data-id="${level._id}" data-status="${level.status}">
                <td>${index + 1}</td>
                <td>${escapeHtml(level.name)}</td>
                <td>${adminStatusBadge(level.status)}</td>
                <td class="action-btns"><button class="btn-action ${level.status === "active" ? "" : "approve"}" title="${level.status === "active" ? "An" : "Hien lai"}" ${level.status === "active" ? 'style="background:#fef9c3;color:#ca8a04;"' : ""} onclick="toggleHide(this, 'levels', '${level._id}', '${level.status}')"><i class="fa-solid ${level.status === "active" ? "fa-eye-slash" : "fa-eye"}"></i></button></td>
            </tr>
        `).join("");
    }
    if (languageBody) {
        languageBody.innerHTML = languages.map((language, index) => `
            <tr data-id="${language._id}" data-status="${language.status}">
                <td>${index + 1}</td>
                <td>${escapeHtml(language.name)}</td>
                <td>${adminStatusBadge(language.status)}</td>
                <td class="action-btns"><button class="btn-action ${language.status === "active" ? "" : "approve"}" title="${language.status === "active" ? "An" : "Hien lai"}" ${language.status === "active" ? 'style="background:#fef9c3;color:#ca8a04;"' : ""} onclick="toggleHide(this, 'languages', '${language._id}', '${language.status}')"><i class="fa-solid ${language.status === "active" ? "fa-eye-slash" : "fa-eye"}"></i></button></td>
            </tr>
        `).join("");
    }
}

async function loadAdminData() {
    const [dashboard, pending, approved, rejected, hidden, users, topics, levels, languages] = await Promise.all([
        apiRequest("/api/admin/dashboard"),
        apiRequest("/api/admin/flashcards?status=pending"),
        apiRequest("/api/admin/flashcards?status=approved"),
        apiRequest("/api/admin/flashcards?status=rejected"),
        apiRequest("/api/admin/flashcards?status=hidden"),
        apiRequest("/api/admin/users"),
        apiRequest("/api/topics?all=true"),
        apiRequest("/api/levels?all=true"),
        apiRequest("/api/languages?all=true"),
    ]);
    renderAdminStatsFromApi(dashboard.data);
    renderAdminRecentActivityFromApi(dashboard.data.recent_flashcards || []);
    const pendingBody = document.querySelector("#tab-pending tbody");
    const approvedBody = document.querySelector("#tab-approved tbody");
    const rejectedBody = document.querySelector("#tab-rejected tbody");
    const hiddenBody = document.querySelector("#tab-hidden tbody");
    if (pendingBody)
        pendingBody.innerHTML = renderAdminPendingRows(null, pending.data.flashcards || []);
    if (approvedBody)
        approvedBody.innerHTML = renderAdminApprovedRows(null, approved.data.flashcards || []);
    if (rejectedBody)
        rejectedBody.innerHTML = renderAdminRejectedRows(null, rejected.data.flashcards || []);
    if (hiddenBody)
        hiddenBody.innerHTML = renderAdminHiddenRows(null, hidden.data.flashcards || []);
    renderAdminUsersFromApi(users.data.users || []);
    renderAdminTopicsFromApi(topics.data.items || []);
    renderAdminLookupTablesFromApi(levels.data.items || [], languages.data.items || []);
}

async function viewDetail(flashcardId) {
    if (flashcardId) {
        currentDetailFlashcardId = flashcardId;
        const response = await apiRequest(`/api/flashcards/${flashcardId}`);
        const flashcard = response.data.flashcard;
        const cards = response.data.cards || [];
        const body = byId("flashcardDetailModal")?.querySelector(".modal-body");
        if (body) {
            const cardRows = cards.length === 0
                ? `<div style="padding:12px 15px;color:var(--text-muted);">Chua co the.</div>`
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
                        <span class="badge ${normalizeLevelCode(flashcardLevelName(flashcard))}">${escapeHtml(flashcardLevelName(flashcard))}</span>
                        <span class="badge" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(flashcard.language_id?.name || "Ngôn ngữ")}</span>
                        <span style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-clone"></i> ${cards.length} the</span>
                    </div>
                    <p style="font-size:0.9rem;color:var(--text-muted);">Mo ta: ${escapeHtml(flashcard.description || "")}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">Tac gia: ${escapeHtml(flashcardOwnerEmail(flashcard))} | Ngay tao: ${formatDate(flashcard.created_at)}</p>
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
    }
    showModal(byId("flashcardDetailModal"));
}

async function approveSet(btn, flashcardId) {
    if (!flashcardId || !confirm("Duyet cong khai bo the nay?"))
        return;
    try {
        await apiRequest(`/api/admin/flashcards/${flashcardId}/approve`, { method: "PUT" });
        await loadAdminData();
        alert("Da duyet thanh cong.");
    }
    catch (error) {
        alert(error.message);
    }
}

function rejectSet(btn, flashcardId) {
    currentRejectRow = rowFromButton(btn);
    currentRejectFlashcardId = flashcardId;
    showModal(byId("rejectModal"));
}

async function confirmReject() {
    const reason = inputValue("rejectReason").trim();
    if (!reason) {
        alert("Vui long nhap ly do tu choi.");
        return;
    }
    try {
        await apiRequest(`/api/admin/flashcards/${currentRejectFlashcardId}/reject`, { method: "PUT" });
        currentRejectRow = null;
        currentRejectFlashcardId = null;
        hideModal(byId("rejectModal"));
        await loadAdminData();
        alert("Da tu choi bo the.");
    }
    catch (error) {
        alert(error.message);
    }
}

function hideSet(btn) {
    alert("Backend hien chua co API an bo the rieng cho admin. Co the tu choi bo the neu can go khoi public.");
}

async function approveFromModal() {
    if (!currentDetailFlashcardId)
        return;
    await approveSet(document.body, currentDetailFlashcardId);
    hideModal(byId("flashcardDetailModal"));
}

function rejectFromModal() {
    hideModal(byId("flashcardDetailModal"));
    currentRejectFlashcardId = currentDetailFlashcardId;
    showModal(byId("rejectModal"));
}

function viewUserDetail(userId) {
    alert(`User ID: ${userId}`);
}

async function toggleUserStatus(btn, userId, status) {
    const isLocked = status === "locked";
    if (!confirm(isLocked ? "Mo khoa tai khoan nay?" : "Khoa tai khoan nay?"))
        return;
    try {
        await apiRequest(`/api/admin/users/${userId}/${isLocked ? "unlock" : "lock"}`, { method: "PUT" });
        await loadAdminData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function saveTopic() {
    const name = inputValue("topicNameInput").trim();
    if (!name) {
        alert("Vui long nhap ten chu de.");
        return;
    }
    try {
        const rowId = editingTopicRow?.dataset.id;
        await apiRequest(rowId ? `/api/topics/${rowId}` : "/api/topics", {
            method: rowId ? "PUT" : "POST",
            body: JSON.stringify({ name, description: "", status: "active" }),
        });
        hideModal(byId("addTopicModal"));
        await loadAdminData();
    }
    catch (error) {
        alert(error.message);
    }
}

async function initAdminPage() {
    if (!byId("flashcardDetailModal"))
        return;
    if (!checkAuth()) {
        window.location.href = "home.html";
        return;
    }
    try {
        await loadAdminData();
    }
    catch (error) {
        alert(error.message);
        window.location.href = "home.html";
        return;
    }
    queryAll(".btn-login").forEach((button) => {
        on(button, "click", () => {
            clearAuthSession();
            window.location.href = "home.html";
        });
    });
    on(window, "click", (event) => {
        ["flashcardDetailModal", "addTopicModal", "rejectModal"].forEach((id) => {
            const modal = byId(id);
            if (modal && event.target === modal)
                hideModal(modal);
        });
    });
}

async function viewDetail(flashcardId) {
    if (flashcardId) {
        currentDetailFlashcardId = flashcardId;
        const response = await apiRequest(`/api/flashcards/${flashcardId}`);
        const flashcard = response.data.flashcard;
        const cards = response.data.cards || [];
        const body = byId("flashcardDetailModal")?.querySelector(".modal-body");
        if (body) {
            const cardRows = cards.length === 0
                ? `<div style="padding:12px 15px;color:var(--text-muted);">Chua co the.</div>`
                : cards.map((card) => `
                    <div class="admin-card-row">
                        ${adminCardSideHtmlV2(card.front, card.front_img)}
                        ${adminCardSideHtmlV2(card.back, card.back_img)}
                    </div>
                `).join("");
            body.innerHTML = `
                <div style="background:var(--search-bg);border-radius:12px;padding:20px;">
                    <h3 style="margin-bottom:10px;">${escapeHtml(flashcard.name)}</h3>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
                        <span class="badge ${normalizeLevelCode(flashcardLevelName(flashcard))}">${escapeHtml(flashcardLevelName(flashcard))}</span>
                        <span class="badge" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(flashcard.language_id?.name || "Ngon ngu")}</span>
                        <span style="font-size:0.85rem;color:var(--text-muted);"><i class="fa-solid fa-clone"></i> ${cards.length} the</span>
                    </div>
                    <p style="font-size:0.9rem;color:var(--text-muted);">Mo ta: ${escapeHtml(flashcard.description || "")}</p>
                    <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">Tac gia: ${escapeHtml(flashcardOwnerEmail(flashcard))} | Ngay tao: ${formatDate(flashcard.created_at)}</p>
                </div>
                <div class="admin-card-preview-list">
                    <div class="admin-card-row admin-card-row-head">
                        <span>Mat truoc</span><span>Mat sau</span>
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
    }
    showModal(byId("flashcardDetailModal"));
}

async function hideSet(btn, flashcardId) {
    if (!flashcardId || !confirm("An bo the nay khoi trang cong khai?"))
        return;
    try {
        await apiRequest(`/api/admin/flashcards/${flashcardId}/hide`, { method: "PUT" });
        await loadAdminData();
        alert("Bo the da bi an.");
    } catch (error) {
        alert(error.message);
    }
}

async function viewUserDetail(userId) {
    if (!userId)
        return;
    try {
        const response = await apiRequest("/api/admin/users");
        const user = (response.data.users || []).find((item) => item._id === userId);
        if (!user)
            throw new Error("Khong tim thay user.");
        alert(`Ten: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nTrang thai: ${user.status}`);
    } catch (error) {
        alert(error.message);
    }
}
