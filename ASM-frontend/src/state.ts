// ===== PHAN DA SUA 5: du lieu tinh da chuyen sang db.json =====
// Cac bien nay se duoc nap bang fetchDatabase() thay vi viet cung trong TypeScript.
let currentTerms: FlashcardTerm[] = [];
let currentStudyCards: FlashcardTerm[] = [];
let publicFlashcardProducts: SanPhamFlashcard[] = [];
let currentFlashcardProduct: SanPhamFlashcard | null = null;
let currentFlashcardRecord: FlashcardRecord | null = null;
let appDatabase: AppDatabase | null = null;

// ===== PHAN DA SUA 9: STATE PHAN TRANG CHO TRANG HOME =====
// Moi trang hien thi 6 bo the. Khi tim kiem/loc, bien current page se quay ve trang 1.
const HOME_PAGE_SIZE = 8;
let homeCurrentPage = 1;
let homeFilteredProducts: SanPhamFlashcard[] = [];

let detailCurrentCard = 0;
let studyCurrentIndex = 0;
let studyIsFlipped = false;
const studyRatings: Record<StudyRating, number> = { again: 0, hard: 0, good: 0, easy: 0 };
let currentRejectRow: HTMLTableRowElement | null = null;
let editingTopicRow: HTMLTableRowElement | null = null;
let databasePromise: Promise<AppDatabase> | null = null;
