declare function getToken(): string | null;
declare function getStoredUser(): { name?: string; email?: string } | null;
declare function clearAuthSession(): void;
declare function refreshHomeProducts(): Promise<void>;
declare let currentUser: { name?: string; email?: string } | null;
type HeaderUserInfo = {
    name: string;
    email: string;
    initial: string;
};

const AUTH_HEADER_PAGES = new Set(["", "home.html", "account.html", "saved.html", "detailFlashcard.html", "header.html"]);

function checkAuth(): boolean {
    return Boolean((typeof getToken === "function" && getToken()) || localStorage.getItem("isLoggedIn") === "true");
}

function getHeaderPageName(): string {
    return window.location.pathname.split("/").pop() || "";
}

function getHeaderUserInfo(): HeaderUserInfo {
    const storedUser = typeof getStoredUser === "function" ? getStoredUser() : null;
    const email = storedUser?.email || localStorage.getItem("userEmail") || "";
    const fallbackName = email ? email.split("@")[0] : "Nguoi dung";
    const name = storedUser?.name || fallbackName;
    const initial = (name || email || "U").trim().charAt(0).toUpperCase() || "U";

    return { name, email, initial };
}

function renderAuthHeaderMarkup(): string {
    const user = getHeaderUserInfo();

    return `
        <div id="headerGuest" class="header-auth-guest">
            <button class="btn-login" id="openLoginBtn" type="button">
                <i class="fa-solid fa-user"></i> &#272;&#259;ng nh&#7853;p
            </button>
        </div>
        <div id="headerUser" class="header-user-area" style="display:none;">
            <a href="account.html" class="header-nav-link"><i class="fa-solid fa-layer-group"></i> B&#7897; th&#7867; c&#7911;a t&#244;i</a>
            <a href="saved.html" class="header-nav-link"><i class="fa-regular fa-bookmark"></i> &#272;&#227; l&#432;u</a>
            <div class="user-menu-wrapper">
                <button class="user-avatar-btn" id="userMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false">
                    <span class="avatar user-avatar-initial" data-user-avatar>${escapeHtml(user.initial)}</span>
                    <span class="user-avatar-name" data-user-name>${escapeHtml(user.name)}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="user-dropdown" id="userDropdown" role="menu">
                    <div class="user-dropdown-profile">
                        <span class="avatar user-avatar-initial" data-user-avatar>${escapeHtml(user.initial)}</span>
                        <div>
                            <div class="user-dropdown-name" data-user-name>${escapeHtml(user.name)}</div>
                            <div class="user-dropdown-email" data-user-email>${escapeHtml(user.email || "Da dang nhap")}</div>
                        </div>
                    </div>
                    <a href="account.html" role="menuitem"><i class="fa-solid fa-layer-group"></i> B&#7897; th&#7867; c&#7911;a t&#244;i</a>
                    <a href="saved.html" role="menuitem"><i class="fa-regular fa-bookmark"></i> &#272;&#227; l&#432;u</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" id="logoutBtn" class="logout-link" data-logout role="menuitem">
                        <i class="fa-solid fa-right-from-bracket"></i> &#272;&#259;ng xu&#7845;t
                    </a>
                </div>
            </div>
        </div>
    `;
}

function ensureAuthHeaderMarkup(): void {
    const headerActions = document.querySelector<HTMLElement>("header .header-actions");
    if (!headerActions || !AUTH_HEADER_PAGES.has(getHeaderPageName())) return;

    if (byId("headerGuest") || byId("headerUser")) return;

    headerActions.innerHTML = renderAuthHeaderMarkup();
}

function updateHeaderUserInfo(): void {
    const user = getHeaderUserInfo();

    queryAll<HTMLElement>("[data-user-avatar], .user-avatar-btn .avatar").forEach((element) => {
        element.textContent = user.initial;
    });

    queryAll<HTMLElement>("[data-user-name], .user-avatar-name, .user-dropdown-name").forEach((element) => {
        element.textContent = user.name;
    });

    queryAll<HTMLElement>("[data-user-email], .user-dropdown-email").forEach((element) => {
        element.textContent = user.email || "Da dang nhap";
    });
}

function closeUserDropdown(): void {
    byId("userDropdown")?.classList.remove("show");
    byId("userMenuBtn")?.setAttribute("aria-expanded", "false");
}

function bindAuthHeaderEvents(): void {
    if (getHeaderPageName() === "home.html" || getHeaderPageName() === "") return;

    const loginButton = byId<HTMLButtonElement>("openLoginBtn");
    const menuButton = byId<HTMLButtonElement>("userMenuBtn");
    const logoutButton = byId<HTMLElement>("logoutBtn");

    if (loginButton && loginButton.dataset.authBound !== "true") {
        loginButton.dataset.authBound = "true";
        on(loginButton, "click", () => {
            window.location.href = "home.html";
        });
    }

    if (menuButton && menuButton.dataset.authBound !== "true") {
        menuButton.dataset.authBound = "true";
        on(menuButton, "click", (event) => {
            event.stopPropagation();
            const dropdown = byId("userDropdown");
            dropdown?.classList.toggle("show");
            menuButton.setAttribute("aria-expanded", String(dropdown?.classList.contains("show")));
        });
    }

    if (logoutButton && logoutButton.dataset.authBound !== "true") {
        logoutButton.dataset.authBound = "true";
        on(logoutButton, "click", (event) => {
            event.preventDefault();

            if (typeof clearAuthSession === "function") {
                clearAuthSession();
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("userEmail");
            }

            if (typeof currentUser !== "undefined") {
                currentUser = null;
            }

            closeUserDropdown();
            updateHeaderState();

            if (getHeaderPageName() === "home.html" || getHeaderPageName() === "") {
                if (typeof refreshHomeProducts === "function") void refreshHomeProducts();
                return;
            }

            window.location.href = "home.html";
        });
    }

    if (document.body.dataset.authHeaderBound !== "true") {
        document.body.dataset.authHeaderBound = "true";
        on(document, "click", closeUserDropdown);
    }
}

function initAuthHeader(): void {
    ensureAuthHeaderMarkup();
    updateHeaderState();
    bindAuthHeaderEvents();
}

function updateHeaderState(): void {
    ensureAuthHeaderMarkup();

    const loggedIn = checkAuth();
    setDisplay(byId("headerGuest"), loggedIn ? "none" : "block");
    setDisplay(byId("headerUser"), loggedIn ? "flex" : "none");

    if (loggedIn) updateHeaderUserInfo();
    bindAuthHeaderEvents();
}

function toggleSave(btn: HTMLElement): void {
    const isSaved = btn.classList.contains("saved");

    if (isSaved) {
        btn.classList.remove("saved");
        btn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Luu';
        return;
    }

    btn.classList.add("saved");
    btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> &#272;&#227; l&#432;u';
}