// ===== PHAN DA SUA 4: CLASS SanPhamFlashcard gom du lieu va hanh vi hien thi =====
// Class nay bien du lieu san pham thanh HTML card, giu giao dien cu nhung code co cau truc hon.
class SanPhamFlashcard implements FlashcardProductData {
    id: number;
    title: string;
    description: string;
    cardCount: number;
    topic: ProductTopic;
    level: ProductLevel;
    frontLanguage: ProductLanguageCode;
    backLanguage: ProductLanguageCode;
    status: ProductStatus;
    detailUrl: string;
    studyUrl: string;

    constructor(data: FlashcardProductData) {
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
    }

    get cardInfo(): ProductCardInfo {
        return {
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

    get levelLabel(): string {
        const labels: Record<ProductLevel, string> = {
            "co-ban": "Cơ bản",
            "trung-cap": "Trung Cấp",
            "nang-cao": "Nâng Cao",
        };

        return labels[this.level];
    }

    get levelClass(): string {
        if (this.level === "nang-cao") return "nang-cao";
        return "trung-cap";
    }

    get languagePair(): string {
        return `${this.languageName(this.frontLanguage)} -> ${this.languageName(this.backLanguage)}`;
    }

    toHomeCardHtml(): string {
        const info: ProductCardInfo = this.cardInfo;

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
                        <button class="btn-save-card cat-btn" onclick="event.stopPropagation(); toggleSave(this)" title="Luu bo the">
                            <i class="fa-regular fa-bookmark"></i> Luu
                        </button>
                        <button class="blue-btn btn-detail-card" onclick="event.stopPropagation(); window.location.href='${info.detailUrl}'">Chi tiet</button>
                    </div>
                </div>
            </div>
        `;
    }

    private languageName(code: ProductLanguageCode): string {
        const languages: Record<ProductLanguageCode, string> = {
            vi: "Tiếng Việt",
            en: "English",
            de: "Deutsch",
            fr: "Francais",
            ja: "Nihongo",
        };

        return languages[code];
    }
}
