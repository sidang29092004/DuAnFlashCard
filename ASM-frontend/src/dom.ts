function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

function queryAll<T extends Element = Element>(selector: string): NodeListOf<T> {
    return document.querySelectorAll(selector) as NodeListOf<T>;
}

function on<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Document | Window | null,
    eventName: K,
    handler: (event: HTMLElementEventMap[K]) => void,
): void {
    element?.addEventListener(eventName, handler as EventListener);
}

function setDisplay(element: HTMLElement | null, value: string): void {
    if (element) element.style.display = value;
}

function setText(element: HTMLElement | null, value: string | number): void {
    if (element) element.textContent = String(value);
}

function inputValue(id: string): string {
    return byId<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(id)?.value ?? "";
}

function hideModal(modal: HTMLElement | null): void {
    setDisplay(modal, "none");
}

function showModal(modal: HTMLElement | null): void {
    setDisplay(modal, "flex");
}

function rowFromButton(btn: HTMLElement): HTMLTableRowElement | null {
    return btn.closest("tr") as HTMLTableRowElement | null;
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
