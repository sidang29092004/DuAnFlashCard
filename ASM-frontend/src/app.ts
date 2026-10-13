const APP_SCRIPT_FILES = [
    "dom.js",
    "models.js",
    "state.js",
    "data.js",
    "auth.js",
    "home.js",
    "detail.js",
    "create-set.js",
    "study.js",
    "account.js",
    "admin.js",
];

function appScriptBaseUrl(): string {
    const currentScript = document.currentScript as HTMLScriptElement | null;
    return currentScript?.src ? currentScript.src.replace(/app\.js(?:\?.*)?$/, "") : "../public/js/";
}

function loadAppScript(fileName: string, baseUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = new URL(fileName, baseUrl).toString();
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Khong tai duoc ${fileName}`));
        document.head.appendChild(script);
    });
}

function exposeWindowActions(): void {
    window.toggleSave = toggleSave;
    window.shareToSocial = shareToSocial;
    window.removeCard = removeCard;
    window.flipCard = flipCard;
    window.rateCard = rateCard;
    window.restartStudy = restartStudy;
    window.confirmDelete = confirmDelete;
    window.showSection = showSection;
    window.switchTab = switchTab;
    window.viewDetail = viewDetail;
    window.approveSet = approveSet;
    window.rejectSet = rejectSet;
    window.confirmReject = confirmReject;
    window.hideSet = hideSet;
    window.approveFromModal = approveFromModal;
    window.rejectFromModal = rejectFromModal;
    window.viewUserDetail = viewUserDetail;
    window.toggleUserStatus = toggleUserStatus;
    window.openAddTopicModal = openAddTopicModal;
    window.editTopic = editTopic;
    window.saveTopic = saveTopic;
    window.toggleTopicStatus = toggleTopicStatus;
    window.toggleHide = toggleHide;
    window.openAddLevelModal = openAddLevelModal;
    window.openAddLangModal = openAddLangModal;
}

function initCurrentPage(): void {
    initAuthHeader();
    initHomePage();
    initDetailPage();
    initCreateSetPage();
    initStudyPage();
    initAccountPage();
    initAdminPage();
}

async function bootApp(): Promise<void> {
    const baseUrl = appScriptBaseUrl();

    for (const fileName of APP_SCRIPT_FILES) {
        await loadAppScript(fileName, baseUrl);
    }

    exposeWindowActions();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCurrentPage, { once: true });
        return;
    }

    initCurrentPage();
}

void bootApp().catch((error) => {
    console.error("Khong khoi dong duoc ung dung", error);
});
