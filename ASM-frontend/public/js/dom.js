"use strict";
function byId(id) {
    return document.getElementById(id);
}
function queryAll(selector) {
    return document.querySelectorAll(selector);
}
function on(element, eventName, handler) {
    element?.addEventListener(eventName, handler);
}
function setDisplay(element, value) {
    if (element)
        element.style.display = value;
}
function setText(element, value) {
    if (element)
        element.textContent = String(value);
}
function inputValue(id) {
    return byId(id)?.value ?? "";
}
function hideModal(modal) {
    setDisplay(modal, "none");
}
function showModal(modal) {
    setDisplay(modal, "flex");
}
function rowFromButton(btn) {
    return btn.closest("tr");
}
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function escapeAttribute(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
