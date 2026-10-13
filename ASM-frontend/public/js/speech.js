"use strict";

const SPEECH_LANGUAGE_MAP = {
    en: "en-US",
    vi: "vi-VN",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
    de: "de-DE",
    fr: "fr-FR",
};

function getSpeechLanguage(languageCode) {
    const value = String(languageCode || "").trim();
    if (!value)
        return "en-US";

    const normalized = value.replace("_", "-").toLowerCase();
    const baseCode = normalized.split("-")[0];
    return SPEECH_LANGUAGE_MAP[baseCode] || value;
}

function speakText(text, language) {
    const value = String(text || "").trim();
    if (!value)
        return false;

    if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
        alert("Tr\u00ecnh duy\u1ec7t c\u1ee7a b\u1ea1n kh\u00f4ng h\u1ed7 tr\u1ee3 ch\u1ee9c n\u0103ng ph\u00e1t \u00e2m.");
        return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = getSpeechLanguage(language);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
    return true;
}