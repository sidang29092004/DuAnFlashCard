function updateCardCount(): void {
    const count = queryAll(".card-editor-item").length;
    setText(byId("cardCount"), `(${count} thẻ)`);
    setText(byId("saveBarCardCount"), `${count} thẻ`);
    setDisplay(byId("emptyCardState"), count === 0 ? "flex" : "none");
}

function renumberCards(): void {
    queryAll<HTMLElement>(".card-editor-item").forEach((item, index) => {
        setText(item.querySelector<HTMLElement>(".card-num"), `Thẻ ${index + 1}`);
    });
}

function addCard(): void {
    const list = byId("cardEditorList");
    if (!list) return;

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
    item.querySelector<HTMLInputElement>(".card-front-input")?.focus();
    renumberCards();
}

function removeCard(btn: HTMLElement): void {
    btn.closest(".card-editor-item")?.remove();
    renumberCards();
    updateCardCount();
}

function initCreateSetPage(): void {
    if (!byId("cardEditorList")) return;

    on(byId("btnAddCard"), "click", addCard);

    on(byId("publicToggle"), "change", (event) => {
        const checkbox = event.currentTarget as HTMLInputElement;
        const isPublic = checkbox.checked;
        const badge = byId("statusBadge");

        byId("publicOptions")?.classList.toggle("show", isPublic);

        if (!badge) return;

        badge.textContent = isPublic ? "Chờ duyệt" : "Riêng tư";
        badge.className = isPublic ? "status-badge-inline pending" : "status-badge-inline private";
    });

    on(byId("btnSaveSet"), "click", () => {
        const titleInput = byId<HTMLInputElement>("setTitle");
        const title = titleInput?.value.trim() ?? "";

        if (!title) {
            alert("Vui lòng nhập tên bộ thẻ!");
            titleInput?.focus();
            return;
        }

        const isPublic = byId<HTMLInputElement>("publicToggle")?.checked ?? false;

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
