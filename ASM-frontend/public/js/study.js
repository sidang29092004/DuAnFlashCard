"use strict";
function updateStudyProgress() {
    if (currentStudyCards.length === 0) {
        setText(byId("progressLabel"), "0 / 0");
        setText(byId("progressPercent"), "0%");
        const emptyProgressFill = byId("progressFill");
        if (emptyProgressFill)
            emptyProgressFill.style.width = "0%";
        return;
    }
    const pct = Math.round((studyCurrentIndex / currentStudyCards.length) * 100);
    setText(byId("progressLabel"), `${studyCurrentIndex} / ${currentStudyCards.length}`);
    setText(byId("progressPercent"), `${pct}%`);
    const progressFill = byId("progressFill");
    if (progressFill)
        progressFill.style.width = `${pct}%`;
}
function loadStudyCard(index) {
    const card = currentStudyCards[index];
    if (!card)
        return;
    setText(byId("cardFrontText"), card.front);
    setText(byId("cardBackText"), card.back);
    setText(byId("cardSubText"), card.sub ?? "");
    studyIsFlipped = false;
    byId("studyCard")?.classList.remove("flipped");
    setDisplay(byId("btnShowAnswer"), "block");
    byId("ratingSection")?.classList.remove("show");
}
function flipCard() {
    if (studyIsFlipped)
        return;
    studyIsFlipped = true;
    byId("studyCard")?.classList.add("flipped");
    setDisplay(byId("btnShowAnswer"), "none");
    byId("ratingSection")?.classList.add("show");
}
function showFinishScreen() {
    setDisplay(byId("studyMain"), "none");
    byId("finishScreen")?.classList.add("show");
    setText(byId("statAgain"), studyRatings.again);
    setText(byId("statHard"), studyRatings.hard);
    setText(byId("statGood"), studyRatings.good);
    setText(byId("statEasy"), studyRatings.easy);
    updateStudyProgress();
}
function rateCard(rating) {
    if (studyCurrentIndex >= currentStudyCards.length)
        return;
    studyRatings[rating]++;
    studyCurrentIndex++;
    updateStudyProgress();
    if (studyCurrentIndex >= currentStudyCards.length) {
        showFinishScreen();
        return;
    }
    loadStudyCard(studyCurrentIndex);
}
function restartStudy() {
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
async function initStudyPage() {
    if (!byId("studyCard"))
        return;
    if (!(await loadAppData()))
        return;
    renderCurrentStudyHeader();
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault();
            if (!studyIsFlipped)
                flipCard();
        }
        if (event.code === "Digit1")
            rateCard("again");
        if (event.code === "Digit2")
            rateCard("hard");
        if (event.code === "Digit3")
            rateCard("good");
        if (event.code === "Digit4")
            rateCard("easy");
    });
    loadStudyCard(0);
    updateStudyProgress();
}

function setStudySideImageV2(textId, imageId, imagePath) {
    const textEl = byId(textId);
    if (!textEl)
        return;

    let imageEl = byId(imageId);
    if (!imageEl) {
        imageEl = document.createElement("img");
        imageEl.id = imageId;
        imageEl.className = "study-card-image";
        imageEl.alt = "Anh minh hoa";
        imageEl.loading = "lazy";
        textEl.insertAdjacentElement("afterend", imageEl);
    }

    if (imagePath) {
        imageEl.src = getImageUrl(imagePath);
        imageEl.style.display = "block";
    } else {
        imageEl.removeAttribute("src");
        imageEl.style.display = "none";
    }
}

function getStudySpeechLanguageV2() {
    return currentFlashcardRecord?.language_id?.code || currentFlashcardProduct?.frontLanguage || "en";
}

function speakCurrentStudyFrontV2(event) {
    event?.stopPropagation();
    const card = currentStudyCards[studyCurrentIndex];
    speakText(card?.front || "", getStudySpeechLanguageV2());
}

function isStudyInteractiveTargetV2(event) {
    return Boolean(event.target?.closest?.("button,a,input,textarea,select"));
}

function loadStudyCard(index) {
    const card = currentStudyCards[index];
    if (!card) {
        showFinishScreen();
        return;
    }
    setText(byId("cardFrontText"), card.front);
    setText(byId("cardBackText"), card.back);
    setStudySideImageV2("cardFrontText", "cardFrontImage", card.front_img);
    setStudySideImageV2("cardBackText", "cardBackImage", card.back_img);
    setText(byId("cardSubText"), "");
    studyIsFlipped = false;
    byId("studyCard")?.classList.remove("flipped");
    setDisplay(byId("btnShowAnswer"), "block");
    byId("ratingSection")?.classList.remove("show");
}

function loadStudyCard(index) {
    const card = currentStudyCards[index];
    if (!card) {
        showFinishScreen();
        return;
    }
    setText(byId("cardFrontText"), card.front);
    setText(byId("cardBackText"), card.back);
    setStudySideImageV2("cardFrontText", "cardFrontImage", card.front_img);
    setStudySideImageV2("cardBackText", "cardBackImage", card.back_img);
    setText(byId("cardSubText"), card.sub ?? "");
    studyIsFlipped = false;
    byId("studyCard")?.classList.remove("flipped");
    setDisplay(byId("btnShowAnswer"), "block");
    byId("ratingSection")?.classList.remove("show");
}

async function rateCard(rating) {
    if (studyCurrentIndex >= currentStudyCards.length)
        return;
    const currentCard = currentStudyCards[studyCurrentIndex];
    try {
        await apiRequest("/api/study/review", {
            method: "POST",
            body: JSON.stringify({ card_id: currentCard.id, rating }),
        });
        studyRatings[rating]++;
        studyCurrentIndex++;
        updateStudyProgress();
        if (studyCurrentIndex >= currentStudyCards.length) {
            showFinishScreen();
            return;
        }
        loadStudyCard(studyCurrentIndex);
    }
    catch (error) {
        alert(error.message);
    }
}

function restartStudy() {
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

async function initStudyPage() {
    if (!byId("studyCard"))
        return;
    if (!checkAuth()) {
        alert("Vui long dang nhap de hoc bo the.");
        window.location.href = "home.html";
        return;
    }
    if (!(await loadAppData()))
        return;
    renderCurrentStudyHeader();
    on(byId("btnStudySpeak"), "click", speakCurrentStudyFrontV2);
    on(document, "keydown", (event) => {
        if (event.code === "Space") {
            if (isStudyInteractiveTargetV2(event))
                return;
            event.preventDefault();
            if (!studyIsFlipped)
                flipCard();
        }
        if (event.code === "Digit1")
            void rateCard("again");
        if (event.code === "Digit2")
            void rateCard("hard");
        if (event.code === "Digit3")
            void rateCard("good");
        if (event.code === "Digit4")
            void rateCard("easy");
    });
    if (currentStudyCards.length === 0) {
        showFinishScreen();
        return;
    }
    loadStudyCard(0);
    updateStudyProgress();
}
