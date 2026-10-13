"use strict";
function clampPage(page, totalPages) {
    return Math.min(Math.max(page, 1), totalPages);
}
function getVisiblePageNumbers(totalPages) {
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, homeCurrentPage - half);
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
function renderHomePagination(totalItems, totalPages) {
    const pagination = byId("homePagination");
    if (!pagination)
        return;
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
    queryAll("#homePagination .pagination-btn[data-page]").forEach((button) => {
        on(button, "click", () => {
            const nextPage = Number(button.dataset.page);
            if (Number.isNaN(nextPage))
                return;
            homeCurrentPage = clampPage(nextPage, totalPages);
            renderHomeProducts(homeFilteredProducts);
            byId("cardsGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}
function renderHomeProducts(products = publicFlashcardProducts) {
    const cardsGrid = byId("cardsGrid");
    if (!cardsGrid)
        return;
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
function filterHomeProducts() {
    const keyword = inputValue("searchInput").trim().toLowerCase();
    const topic = inputValue("filterTopic");
    const language = inputValue("filterLang");
    const level = inputValue("filterLevel");
    const filteredProducts = publicFlashcardProducts.filter((product) => {
        const matchesKeyword = !keyword ||
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
async function initHomePage() {
    const loginModal = byId("loginModal");
    const registerModal = byId("registerModal");
    const forgotPwdModal = byId("forgotPwdModal");
    if (!loginModal || !registerModal || !forgotPwdModal)
        return;
    const openModal = (modal) => {
        [loginModal, registerModal, forgotPwdModal].forEach(hideModal);
        showModal(modal);
    };
    updateHeaderState();
    const hasData = await loadAppData();
    if (hasData)
        renderHomeProducts();
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
        if (event.target === loginModal)
            hideModal(loginModal);
        if (event.target === registerModal)
            hideModal(registerModal);
        if (event.target === forgotPwdModal)
            hideModal(forgotPwdModal);
    });
    on(byId("doLoginBtn"), "click", () => {
        const email = inputValue("email");
        if (!email)
            return;
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
        if (!email)
            return;
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

let homeDebounceTimer = null;

function showHomeLoading(message = "Dang tai du lieu...") {
    const cardsGrid = byId("cardsGrid");
    if (!cardsGrid)
        return;
    cardsGrid.innerHTML = `
        <div class="card" style="cursor:default;">
            <div class="card-header"><h3 class="card-title">${message}</h3></div>
            <div class="card-divider"></div>
            <p class="card-desc">Vui long doi trong giay lat.</p>
        </div>
    `;
}

function renderHomePagination(totalItems = homePagination.total || 0, totalPages = homePagination.total_pages || 1) {
    const pagination = byId("homePagination");
    if (!pagination)
        return;
    if (totalItems === 0) {
        pagination.classList.add("hidden");
        pagination.innerHTML = "";
        return;
    }
    const page = homePagination.page || homeCurrentPage;
    const limit = homePagination.limit || HOME_PAGE_SIZE;
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalItems);
    const pageButtons = getVisiblePageNumbers(totalPages)
        .map((pageNumber) => `
            <button
                class="pagination-btn ${pageNumber === page ? "active" : ""}"
                data-page="${pageNumber}"
                aria-label="Den trang ${pageNumber}"
                ${pageNumber === page ? 'aria-current="page"' : ""}
            >
                ${pageNumber}
            </button>
        `)
        .join("");
    pagination.classList.remove("hidden");
    pagination.innerHTML = `
        <div class="pagination-summary">Hien thi ${startItem}-${endItem} / ${totalItems} bo the</div>
        <div class="pagination-actions">
            <button class="pagination-btn pagination-arrow" data-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Trang truoc">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            ${pageButtons}
            <button class="pagination-btn pagination-arrow" data-page="${page + 1}" ${page === totalPages ? "disabled" : ""} aria-label="Trang sau">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
    queryAll("#homePagination .pagination-btn[data-page]").forEach((button) => {
        on(button, "click", async () => {
            const nextPage = Number(button.dataset.page);
            if (Number.isNaN(nextPage))
                return;
            homeCurrentPage = clampPage(nextPage, totalPages);
            await refreshHomeProducts();
            byId("cardsGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function renderHomeProducts(products = publicFlashcardProducts) {
    const cardsGrid = byId("cardsGrid");
    if (!cardsGrid)
        return;
    homeFilteredProducts = products;
    if (products.length === 0) {
        cardsGrid.innerHTML = `
            <div class="card" style="cursor:default;">
                <div class="card-header">
                    <h3 class="card-title">Khong tim thay bo the phu hop</h3>
                </div>
                <div class="card-divider"></div>
                <p class="card-desc">Hay thu doi tu khoa hoac bo loc khac.</p>
            </div>
        `;
        renderHomePagination(0, 1);
        return;
    }
    cardsGrid.innerHTML = products.map((product) => product.toHomeCardHtml()).join("");
    renderHomePagination(homePagination.total, homePagination.total_pages);
}

async function refreshHomeProducts() {
    showHomeLoading();
    await loadPublicFlashcardsFromApi({
        page: homeCurrentPage,
        limit: HOME_PAGE_SIZE,
        search: inputValue("searchInput").trim(),
        language: inputValue("filterLang"),
        topic: inputValue("filterTopic"),
        level: inputValue("filterLevel"),
    });
    renderHomeProducts(publicFlashcardProducts);
}

async function filterHomeProducts() {
    homeCurrentPage = 1;
    await refreshHomeProducts();
}

async function initHomePage() {
    const loginModal = byId("loginModal");
    const registerModal = byId("registerModal");
    const forgotPwdModal = byId("forgotPwdModal");
    if (!loginModal || !registerModal || !forgotPwdModal)
        return;
    const openModal = (modal) => {
        [loginModal, registerModal, forgotPwdModal].forEach(hideModal);
        showModal(modal);
    };
    updateHeaderState();
    showHomeLoading();
    if (await loadAppData())
        renderHomeProducts();
    on(byId("searchInput"), "input", () => {
        clearTimeout(homeDebounceTimer);
        homeDebounceTimer = setTimeout(() => {
            void filterHomeProducts();
        }, 300);
    });
    on(byId("filterTopic"), "change", () => void filterHomeProducts());
    on(byId("filterLang"), "change", () => void filterHomeProducts());
    on(byId("filterLevel"), "change", () => void filterHomeProducts());
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
        if (event.target === loginModal)
            hideModal(loginModal);
        if (event.target === registerModal)
            hideModal(registerModal);
        if (event.target === forgotPwdModal)
            hideModal(forgotPwdModal);
    });
    on(byId("doLoginBtn"), "click", async () => {
        const email = inputValue("email").trim();
        const password = inputValue("password");
        if (!email || !password) {
            alert("Vui long nhap email va mat khau.");
            return;
        }
        try {
            const response = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            setAuthSession(response.data.token, response.data.user);
            currentUser = response.data.user;
            hideModal(loginModal);
            updateHeaderState();
            if (response.data.user?.role === "admin") {
                window.location.href = "admin.html";
                return;
            }
            await refreshHomeProducts();
        }
        catch (error) {
            alert(error.message);
        }
    });
    const registerButton = document.querySelector("#registerModal .btn-submit-login");
    on(registerButton, "click", async () => {
        const name = inputValue("reg-name").trim();
        const email = inputValue("reg-email").trim();
        const password = inputValue("reg-password");
        if (!name || !email || !password) {
            alert("Vui long nhap day du thong tin dang ky.");
            return;
        }
        try {
            const response = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password }),
            });
            setAuthSession(response.data.token, response.data.user);
            currentUser = response.data.user;
            hideModal(registerModal);
            updateHeaderState();
            await refreshHomeProducts();
        }
        catch (error) {
            alert(error.message);
        }
    });
    on(byId("logoutBtn"), "click", (event) => {
        event.preventDefault();
        clearAuthSession();
        currentUser = null;
        updateHeaderState();
        byId("userDropdown")?.classList.remove("show");
        void refreshHomeProducts();
    });
    on(byId("doForgotPwdBtn"), "click", () => {
        const email = inputValue("forgot-email");
        if (!email)
            return;
        hideModal(forgotPwdModal);
        alert(`Tinh nang quen mat khau cho ${email} se duoc bo sung sau.`);
    });
    on(byId("userMenuBtn"), "click", (event) => {
        event.stopPropagation();
        byId("userDropdown")?.classList.toggle("show");
    });
    on(document, "click", () => {
        byId("userDropdown")?.classList.remove("show");
    });
}
