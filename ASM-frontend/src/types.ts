type StudyRating = "again" | "hard" | "good" | "easy";

interface FlashcardTerm {
    id?: number;
    front: string;
    front_img?: string;
    back: string;
    back_img?: string;
    sub?: string;
}

// ===== PHAN DA SUA 1: TYPE mo ta cac gia tri co dinh cua san pham =====
// "San pham" trong giao dien nay duoc hieu la mot bo flashcard cong khai.
type ProductLevel = "co-ban" | "trung-cap" | "nang-cao";
type ProductTopic = "ngon-ngu" | "khoa-hoc" | "cong-nghe" | "lich-su" | "toan-hoc";
type ProductLanguageCode = "vi" | "en" | "de" | "fr" | "ja";
type ProductStatus = "private" | "pending" | "approved" | "rejected";

// ===== PHAN DA SUA 2: INTERFACE mo ta day du thong tin san pham =====
// Interface giup TypeScript kiem tra moi bo flashcard co du cac truong can thiet.
interface FlashcardProductData {
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
}

interface UserRecord {
    id: number;
    id_user: number;
    name: string;
    email: string;
    password: string;
    role: string;
}

interface LanguageRecord {
    id: number;
    id_language: number;
    name: string;
    code: string;
    status: string;
}

interface LevelRecord {
    id: number;
    id_level: number;
    name: string;
    label: string;
    status: string;
}

interface TopicRecord {
    id: number;
    id_Topic: number;
    name: string;
    label: string;
    status: string;
}

interface TagnameRecord {
    id: number;
    id_Tagname: number;
    id_user: number;
    description: string;
    name: string;
}

interface FlashcardRecord {
    id: number;
    id_Flashcard: number;
    id_user: number;
    id_language: number;
    id_topic: number;
    id_level: number;
    Description: string;
    name: string;
    approval_status: ProductStatus;
    visibility: "public" | "private";
    created_at: string;
    updated_at: string;
}

interface CardRecord {
    id: number;
    id_card: number;
    id_flashcard: number;
    front: string;
    front_img: string;
    back: string;
    back_img: string;
    created_at: string;
    updated_at: string;
    color: string;
}

interface StudyProgressRecord {
    id: number;
    id_study_progress: number;
    id_user: number;
    id_card: number;
    next_review_at: string;
    last_review_at: string;
    incorrect_count: number;
    stability: number;
    difficulty: number;
    created_at: string;
    updated_at: string;
    status: string;
    last_result: StudyRating;
    correct_count: number;
}

interface StudyHistoryRecord {
    id: number;
    id_history: number;
    id_study_progress: number;
    result: string;
    rating: StudyRating;
    reviewed_at: string;
}

interface FlashcardSavedRecord {
    id: number;
    id_saved: number;
    id_flashcard: number;
    id_user: number;
    saved_at: string;
}

interface TagnameSavedRecord {
    id: number;
    id_tagname_saved: number;
    id_tagname: number;
    id_flashcard: number;
}

// ===== PHAN DA SUA 2.1: INTERFACE mo ta cau truc file db.json theo ERD =====
interface AppDatabase {
    User: UserRecord[];
    Language: LanguageRecord[];
    Level: LevelRecord[];
    Topic: TopicRecord[];
    tagname: TagnameRecord[];
    Flashcard: FlashcardRecord[];
    Card: CardRecord[];
    study_progress: StudyProgressRecord[];
    study_history: StudyHistoryRecord[];
    Flascard_saved: FlashcardSavedRecord[];
    tagname_saved: TagnameSavedRecord[];
}

// ===== PHAN DA SUA 3: TYPE mo ta du lieu rut gon dung rieng cho card san pham =====
// Type nay lay mot phan tu interface tren de hien thi danh sach ngoai trang chu.
type ProductCardInfo = Pick<
    FlashcardProductData,
    "title" | "description" | "cardCount" | "level" | "frontLanguage" | "backLanguage" | "detailUrl" | "studyUrl"
>;

interface Window {
    toggleSave: (btn: HTMLElement) => void;
    shareToSocial: (platform: string) => void;
    removeCard: (btn: HTMLElement) => void;
    flipCard: () => void;
    rateCard: (rating: StudyRating) => void;
    restartStudy: () => void;
    confirmDelete: (btn: HTMLElement) => void;
    showSection: (name: string, el?: HTMLElement) => void;
    switchTab: (tabName: string, el: HTMLElement) => void;
    viewDetail: (flashcardId?: number) => void;
    approveSet: (btn: HTMLElement) => void;
    rejectSet: (btn: HTMLElement) => void;
    confirmReject: () => void;
    hideSet: (btn: HTMLElement) => void;
    approveFromModal: () => void;
    rejectFromModal: () => void;
    viewUserDetail: () => void;
    toggleUserStatus: (btn: HTMLElement) => void;
    openAddTopicModal: () => void;
    editTopic: (btn: HTMLElement, name: string) => void;
    saveTopic: () => void;
    toggleTopicStatus: (btn: HTMLElement) => void;
    toggleHide: (btn: HTMLElement) => void;
    openAddLevelModal: () => void;
    openAddLangModal: () => void;
}
