const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const MAX_ASSISTANT_CARDS = 50;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseAssistantJson(rawText) {
  const text = cleanText(rawText)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  } catch (error) {
    return null;
  }
}

function normalizeAssistantCards(cards) {
  if (!Array.isArray(cards)) return [];

  return cards
    .map((card) => ({
      front: cleanText(card?.front),
      back: cleanText(card?.back),
    }))
    .filter((card) => card.front && card.back)
    .slice(0, MAX_ASSISTANT_CARDS);
}

function geminiModelName() {
  return cleanText(process.env.GEMINI_MODEL || "gemini-3.5-flash-lite").replace(/^models\//, "");
}

function geminiTimeoutMs() {
  const value = Number(process.env.GEMINI_TIMEOUT_MS);
  if (!Number.isFinite(value) || value <= 0) return 8000;
  return Math.min(Math.max(value, 3000), 20000);
}

function extractGeminiText(responseData) {
  const chunks = [];

  (responseData.candidates || []).forEach((candidate) => {
    (candidate.content?.parts || []).forEach((part) => {
      if (part.text) chunks.push(part.text);
    });
  });

  return chunks.join("\n").trim();
}

function buildGeminiPrompt({ message, sourceLanguage, targetLanguage }) {
  return JSON.stringify({
    message,
    source_language: sourceLanguage,
    target_language: targetLanguage,
    max_cards: MAX_ASSISTANT_CARDS,
  });
}

async function requestGeminiVocabulary({ message, sourceLanguage, targetLanguage }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(503, "Gemini API key is not configured");
  }

  const model = geminiModelName();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), geminiTimeoutMs());

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are a vocabulary assistant for a flashcard app. Return only valid JSON: {\"message\":\"...\",\"cards\":[{\"front\":\"...\",\"back\":\"...\"}]}. Do not include markdown, images, or extra fields.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildGeminiPrompt({ message, sourceLanguage, targetLanguage }),
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1600,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      let details = "";
      try {
        const errorData = await response.json();
        details = cleanText(errorData?.error?.message);
      } catch (error) {
        details = "";
      }

      throw new ApiError(response.status === 429 ? 429 : 503, details || "Gemini request failed");
    }

    const data = await response.json();
    const parsed = parseAssistantJson(extractGeminiText(data));
    const cards = normalizeAssistantCards(parsed?.cards);

    if (!cards.length) {
      throw new ApiError(502, "Gemini response did not include valid cards");
    }

    return {
      message: cleanText(parsed.message) || "Da tao card bang Gemini.",
      cards,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError(504, "Gemini request timed out. Please try again.");
    }
    throw new ApiError(503, "Gemini request failed. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

const createVocabulary = asyncHandler(async (req, res) => {
  const message = cleanText(req.body.message);
  const sourceLanguage = cleanText(req.body.source_language);
  const targetLanguage = cleanText(req.body.target_language);

  if (!message) throw new ApiError(400, "message is required");

  const result = await requestGeminiVocabulary({ message, sourceLanguage, targetLanguage });
  const cards = normalizeAssistantCards(result.cards);

  if (!cards.length) throw new ApiError(422, "Could not create vocabulary cards");

  sendSuccess(res, {
    message: result.message,
    cards,
  }, "Create vocabulary cards successfully");
});

module.exports = {
  createVocabulary,
};
