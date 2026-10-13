"use strict";
const API_URL = localStorage.getItem("API_URL") || "http://127.0.0.1:3001";

function getImageUrl(imagePath) {
    if (!imagePath)
        return "";

    const value = String(imagePath).trim();
    if (/^(blob:|data:|https?:\/\/)/i.test(value))
        return value;

    return `${API_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function getToken() {
    return localStorage.getItem("token");
}

function getStoredUser() {
    const raw = localStorage.getItem("user");
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch (error) {
        return null;
    }
}

function setAuthSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", user.email || "");
}

function clearAuthSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
}

function redirectToLoginIfProtected() {
    const protectedPages = ["account.html", "saved.html", "study.html", "create-set.html", "admin.html"];
    const currentPage = window.location.pathname.split("/").pop() || "";
    if (protectedPages.includes(currentPage)) {
        window.location.href = "home.html";
    }
}

async function apiRequest(url, options = {}) {
    const token = getToken();
    const headers = {
        ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();
            redirectToLoginIfProtected();
        }

        throw new Error(data.message || "API Error");
    }

    return data;
}

function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            query.set(key, String(value));
        }
    });

    const value = query.toString();
    return value ? `?${value}` : "";
}

async function apiToggleSave(btn, flashcardId) {
    if (!checkAuth()) {
        alert("Vui long dang nhap de luu bo the.");
        byId("openLoginBtn")?.click();
        return;
    }

    const targetId = flashcardId || currentFlashcardProduct?.id;
    if (!targetId)
        return;

    const isSaved = btn.classList.contains("saved");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;

    try {
        if (isSaved) {
            await apiRequest(`/api/saved/${targetId}`, { method: "DELETE" });
            btn.classList.remove("saved");
            btn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Luu';
            if (currentFlashcardRecord)
                currentFlashcardRecord.is_saved = false;
            return;
        }

        await apiRequest(`/api/saved/${targetId}`, { method: "POST" });
        btn.classList.add("saved");
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Da luu';
        if (currentFlashcardRecord)
            currentFlashcardRecord.is_saved = true;
    }
    catch (error) {
        btn.innerHTML = originalHtml;
        alert(error.message);
    }
    finally {
        btn.disabled = false;
    }
}
