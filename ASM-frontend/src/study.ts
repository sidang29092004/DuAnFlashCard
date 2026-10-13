function updateStudyProgress(): void {
    if (currentStudyCards.length === 0) {
        setText(byId("progressLabel"), "0 / 0");
        setText(byId("progressPercent"), "0%");

        const emptyProgressFill = byId("progressFill");
        if (emptyProgressFill) emptyProgressFill.style.width = "0%";
        return;
    }

    const pct = Math.round((studyCurrentIndex / currentStudyCards.length) * 100);
    setText(byId("progressLabel"), `${studyCurrentIndex} / ${currentStudyCards.length}`);
    setText(byId("progressPercent"), `${pct}%`);

    const progressFill = byId("progressFill");
    if (progressFill) progressFill.style.width = `${pct}%`;
}

function loadStudyCard(index: number): void {
    const card = currentStudyCards[index];
    if (!card) return;

    setText(byId("cardFrontText"), card.front);
    setText(byId("cardBackText"), card.back);
    setText(byId("cardSubText"), card.sub ?? "");

    studyIsFlipped = false;
    byId("studyCard")?.classList.remove("flipped");
    setDisplay(byId("btnShowAnswer"), "block");
    byId("ratingSection")?.classList.remove("show");
}

function flipCard(): void {
    if (studyIsFlipped) return;

    studyIsFlipped = true;
    byId("studyCard")?.classList.add("flipped");
    setDisplay(byId("btnShowAnswer"), "none");
    byId("ratingSection")?.classList.add("show");
}

function showFinishScreen(): void {
    setDisplay(byId("studyMain"), "none");
    byId("finishScreen")?.classList.add("show");
    setText(byId("statAgain"), studyRatings.again);
    setText(byId("statHard"), studyRatings.hard);
    setText(byId("statGood"), studyRatings.good);
    setText(byId("statEasy"), studyRatings.easy);
    updateStudyProgress();
}

function rateCard(rating: StudyRating): void {
    if (studyCurrentIndex >= currentStudyCards.length) return;

    studyRatings[rating]++;
    studyCurrentIndex++;
    updateStudyProgress();

    if (studyCurrentIndex >= currentStudyCards.length) {
        showFinishScreen();
        return;
    }

    loadStudyCard(studyCurrentIndex);
}

function restartStudy(): void {
    studyCurrentIndex = 0;
    studyRatings.again = 0;
    studyRatings.hard = 0;
    studyRatings.good = 0;
    studyRatings.easy = 0;

    byId("finishScreen")?.classList.remove("show");
    setDisplay(byId("studyMain"), "flex");
    loadStudyCard(0);
    updateStudyProgress();
}

async function initStudyPage(): Promise<void> {
    if (!byId("studyCard")) return;

    if (!(await loadAppData())) return;
    renderCurrentStudyHeader();
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            if (!studyIsFlipped) flipCard();
        }

        if (event.code === "Digit1") rateCard("again");
        if (event.code === "Digit2") rateCard("hard");
        if (event.code === "Digit3") rateCard("good");
        if (event.code === "Digit4") rateCard("easy");
    });

    loadStudyCard(0);
    updateStudyProgress();
}
