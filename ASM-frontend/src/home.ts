function clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(page, 1), totalPages);
}

function getVisiblePageNumbers(totalPages: number): number[] {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, homeCurrentPage - half);
    const end = Math.min(totalPages, start + maxVisible - 1);

    start = Math.max(1, end - maxVisible + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function renderHomePagination(totalItems: number, totalPages: number): void {
    const pagination = byId("homePagination");
    if (!pagination) return;

    if (totalItems === 0) {
        pagination.classList.add("hidden");
        pagination.innerHTML = "";
        return;
    }

    const startItem = (homeCurrentPage - 1) * HOME_PAGE_SIZE + 1;
    const endItem = Math.min(homeCurrentPage * HOME_PAGE_SIZE, totalItems);
    const pageButtons = getVisiblePageNumbers(totalPages)
        .map((page) => `
            <button
                class="pagination-btn ${page === homeCurrentPage ? "active" : ""}"
                data-page="${page}"
                aria-label="Den trang ${page}"
                ${page === homeCurrentPage ? 'aria-current="page"' : ""}
            >
                ${page}
            </button>
        `)
        .join("");

    pagination.classList.remove("hidden");
    pagination.innerHTML = `
        <div class="pagination-summary">Hien thi ${startItem}-${endItem} / ${totalItems} bo the</div>
        <div class="pagination-actions">
            <button class="pagination-btn pagination-arrow" data-page="${homeCurrentPage - 1}" ${homeCurrentPage === 1 ? "disabled" : ""} aria-label="Trang truoc">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            ${pageButtons}
            <button class="pagination-btn pagination-arrow" data-page="${homeCurrentPage + 1}" ${homeCurrentPage === totalPages ? "disabled" : ""} aria-label="Trang sau">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;

    queryAll<HTMLButtonElement>("#homePagination .pagination-btn[data-page]").forEach((button) => {
        on(button, "click", () => {
            const nextPage = Number(button.dataset.page);
            if (Number.isNaN(nextPage)) return;

            homeCurrentPage = clampPage(nextPage, totalPages);
            renderHomeProducts(homeFilteredProducts);
            byId("cardsGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

// ===== PHAN DA SUA 6: RENDER san pham ra giao dien tu class =====
// Ham nay thay cho viec viet lap lai tung card san pham bang HTML tinh.
function renderHomeProducts(products: SanPhamFlashcard[] = publicFlashcardProducts): void {
    const cardsGrid = byId("cardsGrid");
    if (!cardsGrid) return;

    homeFilteredProducts = products;
    const totalPages = Math.max(1, Math.ceil(products.length / HOME_PAGE_SIZE));
    homeCurrentPage = clampPage(homeCurrentPage, totalPages);

    if (products.length === 0) {
        cardsGrid.innerHTML = `
            <div class="card" style="cursor:default;">
                <div class="card-header">
                    <h3 class="card-title">Khong tim thay san pham phu hop</h3>
                </div>
                <div class="card-divider"></div>
                <p class="card-desc">Hay thu doi tu khoa hoac bo loc khac.</p>
            </div>
        `;
        renderHomePagination(0, totalPages);
        return;
    }

    const startIndex = (homeCurrentPage - 1) * HOME_PAGE_SIZE;
    const pageProducts = products.slice(startIndex, startIndex + HOME_PAGE_SIZE);

    cardsGrid.innerHTML = pageProducts.map((product) => product.toHomeCardHtml()).join("");
    renderHomePagination(products.length, totalPages);
}

// ===== PHAN DA SUA 7: LOC san pham dua tren type/interface da khai bao =====
// Cac gia tri loc deu duoc ep theo type ProductTopic/ProductLevel/ProductLanguageCode.
function filterHomeProducts(): void {
    const keyword = inputValue("searchInput").trim().toLowerCase();
    const topic = inputValue("filterTopic") as ProductTopic | "";
    const language = inputValue("filterLang") as ProductLanguageCode | "";
    const level = inputValue("filterLevel") as ProductLevel | "";

    const filteredProducts = publicFlashcardProducts.filter((product) => {
        const matchesKeyword =
            !keyword ||
            product.title.toLowerCase().includes(keyword) ||
            product.description.toLowerCase().includes(keyword);
        const matchesTopic = !topic || product.topic === topic;
        const matchesLanguage = !language || product.frontLanguage === language || product.backLanguage === language;
        const matchesLevel = !level || product.level === level;

        return matchesKeyword && matchesTopic && matchesLanguage && matchesLevel;
    });

    homeCurrentPage = 1;
    renderHomeProducts(filteredProducts);
}

async function initHomePage(): Promise<void> {
    const loginModal = byId("loginModal");
    const registerModal = byId("registerModal");
    const forgotPwdModal = byId("forgotPwdModal");

    if (!loginModal || !registerModal || !forgotPwdModal) return;

    const openModal = (modal: HTMLElement): void => {
        [loginModal, registerModal, forgotPwdModal].forEach(hideModal);
        showModal(modal);
    };

    updateHeaderState();
    const hasData = await loadAppData();
    if (hasData) renderHomeProducts();

    on(byId("searchInput"), "input", filterHomeProducts);
    on(byId("filterTopic"), "change", filterHomeProducts);
    on(byId("filterLang"), "change", filterHomeProducts);
    on(byId("filterLevel"), "change", filterHomeProducts);

    on(byId("openLoginBtn"), "click", () => openModal(loginModal));
    on(byId("closeLoginModalBtn"), "click", () => hideModal(loginModal));
    on(byId("closeRegisterModalBtn"), "click", () => hideModal(registerModal));
    on(byId("closeForgotPwdBtn"), "click", () => hideModal(forgotPwdModal));

    on(byId("switchToRegisterBtn"), "click", (event) => {
        event.preventDefault();
        openModal(registerModal);
    });

    on(byId("switchToLoginBtn"), "click", (event) => {
        event.preventDefault();
        openModal(loginModal);
    });

    on(byId("openForgotPwdBtn"), "click", (event) => {
        event.preventDefault();
        openModal(forgotPwdModal);
    });

    on(byId("backToLoginBtn"), "click", (event) => {
        event.preventDefault();
        openModal(loginModal);
    });

    on(window, "click", (event) => {
        if (event.target === loginModal) hideModal(loginModal);
        if (event.target === registerModal) hideModal(registerModal);
        if (event.target === forgotPwdModal) hideModal(forgotPwdModal);
    });

    on(byId("doLoginBtn"), "click", () => {
        const email = inputValue("email");

        if (!email) return;

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        hideModal(loginModal);
        updateHeaderState();
    });

    on(byId("logoutBtn"), "click", (event) => {
        event.preventDefault();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("userEmail");
        updateHeaderState();
        byId("userDropdown")?.classList.remove("show");
    });

    on(byId("doForgotPwdBtn"), "click", () => {
        const email = inputValue("forgot-email");

        if (!email) return;

        hideModal(forgotPwdModal);
        alert(`Đã gửi link đặt lại mật khẩu đến ${email}\n(Giao diện tạm - cần kết nối API)`);
    });

    on(byId("userMenuBtn"), "click", (event) => {
        event.stopPropagation();
        byId("userDropdown")?.classList.toggle("show");
    });

    on(document, "click", () => {
        byId("userDropdown")?.classList.remove("show");
    });
}
