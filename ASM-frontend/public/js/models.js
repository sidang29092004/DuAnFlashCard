"use strict";
class SanPhamFlashcard {
    id;
    title;
    description;
    cardCount;
    topic;
    level;
    frontLanguage;
    backLanguage;
    status;
    detailUrl;
    studyUrl;
    topicId;
    languageId;
    levelId;
    creatorName;
    isSaved;
    levelLabelText;
    frontLanguageName;
    backLanguageName;
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.cardCount = data.cardCount;
        this.topic = data.topic;
        this.level = data.level;
        this.frontLanguage = data.frontLanguage;
        this.backLanguage = data.backLanguage;
        this.status = data.status;
        this.detailUrl = data.detailUrl;
        this.studyUrl = data.studyUrl;
        this.topicId = data.topicId || data.topic;
        this.languageId = data.languageId || data.frontLanguage;
        this.levelId = data.levelId || data.level;
        this.creatorName = data.creatorName || "";
        this.isSaved = Boolean(data.isSaved);
        this.levelLabelText = data.levelLabelText || "";
        this.frontLanguageName = data.frontLanguageName || "";
        this.backLanguageName = data.backLanguageName || "Tiếng Việt";
    }
    get cardInfo() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            cardCount: this.cardCount,
            level: this.level,
            frontLanguage: this.frontLanguage,
            backLanguage: this.backLanguage,
            detailUrl: this.detailUrl,
            studyUrl: this.studyUrl,
        };
    }
    get levelLabel() {
        const labels = {
            "co-ban": "Cơ bản",
            "trung-cap": "Trung Cấp",
            "nang-cao": "Nâng Cao",
        };
        return this.levelLabelText || labels[this.level] || "Cấp độ";
    }
    get levelClass() {
        if (this.level === "nang-cao")
            return "nang-cao";
        return "trung-cap";
    }
    get languagePair() {
        return `${this.frontLanguageName || this.languageName(this.frontLanguage)} -> ${this.backLanguageName || this.languageName(this.backLanguage)}`;
    }
    toHomeCardHtml() {
        const info = this.cardInfo;
        return `
            <div class="card" onclick="window.location.href='${info.detailUrl}'">
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(info.title)}</h3>
                    <span class="badge ${this.levelClass}">${this.levelLabel}</span>
                </div>
                <div class="card-divider"></div>
                <p class="card-desc">${escapeHtml(info.description)}</p>
                <div class="card-footer">
                    <div class="card-footer-info">
                        <div class="footer-item"><i class="fa-regular fa-clone"></i> ${info.cardCount} the</div>
                        <div class="footer-item"><i class="fa-solid fa-language"></i> ${this.languagePair}</div>
                    </div>
                    <div class="card-footer-actions">
                        <button class="btn-save-card cat-btn ${this.isSaved ? "saved" : ""}" onclick="event.stopPropagation(); toggleSave(this, '${info.id}')" title="Luu bo the">
                            <i class="${this.isSaved ? "fa-solid" : "fa-regular"} fa-bookmark"></i> ${this.isSaved ? "Da luu" : "Luu"}
                        </button>
                        <button class="blue-btn btn-detail-card" onclick="event.stopPropagation(); window.location.href='${info.detailUrl}'">Chi tiet</button>
                    </div>
                </div>
            </div>
        `;
    }
    languageName(code) {
        const languages = {
            vi: "Tiếng Việt",
            en: "English",
            de: "Deutsch",
            fr: "Francais",
            ja: "Nihongo",
        };
        return languages[code];
    }
}
