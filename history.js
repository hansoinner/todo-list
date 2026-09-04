/* =========================================================
   UNDO / REDO HISTORY
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const HISTORY_KEY = "todos-history";
    const MAX_HISTORY = 30;

    let undoStack = [];
    let redoStack = [];
    let restoring = false;

    const undoButton = document.querySelector("#undo-button");
    const redoButton = document.querySelector("#redo-button");

    function readState() { return localStorage.getItem(STORAGE_KEY) || "[]"; }

    function normalizeState(value) {
        try { return JSON.stringify(JSON.parse(value || "[]")); }
        catch (error) { return "[]"; }
    }

    function persistHistory() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify({ undo: undoStack, redo: redoStack }));
    }

    function loadHistory() {
        try {
            const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
            if (!stored) return;
            undoStack = Array.isArray(stored.undo) ? stored.undo : [];
            redoStack = Array.isArray(stored.redo) ? stored.redo : [];
        } catch (error) {
            undoStack = [];
            redoStack = [];
        }
    }

    function updateButtons() {
        if (!undoButton || !redoButton) return;
        undoButton.disabled = undoStack.length === 0;
        redoButton.disabled = redoStack.length === 0;
        undoButton.setAttribute("aria-label", undoStack.length ? "Undo last change" : "Nothing to undo");
        redoButton.setAttribute("aria-label", redoStack.length ? "Redo last change" : "Nothing to redo");
    }

    const originalSetItem = Storage.prototype.setItem;

    Storage.prototype.setItem = function (key, value) {
        if (key === STORAGE_KEY && !restoring) {
            const previous = normalizeState(readState());
            const next = normalizeState(value);
            if (previous !== next) {
                undoStack.push(previous);
                if (undoStack.length > MAX_HISTORY) undoStack.shift();
                redoStack = [];
                persistHistory();
            }
        }
        originalSetItem.call(this, key, value);
        updateButtons();
    };

    function applyState(state, message) {
        restoring = true;
        originalSetItem.call(localStorage, STORAGE_KEY, state);
        restoring = false;
        persistHistory();
        updateButtons();
        window.dispatchEvent(new CustomEvent("todo:toast", { detail: { message, type: "info" } }));
        window.location.reload();
    }

    function undo() {
        if (!undoStack.length) return;
        const current = normalizeState(readState());
        const previous = undoStack.pop();
        redoStack.push(current);
        applyState(previous, "Changes undone");
    }

    function redo() {
        if (!redoStack.length) return;
        const current = normalizeState(readState());
        const next = redoStack.pop();
        undoStack.push(current);
        applyState(next, "Changes redone");
    }

    loadHistory();
    updateButtons();

    undoButton?.addEventListener("click", undo);
    redoButton?.addEventListener("click", redo);

    document.addEventListener("keydown", function (event) {
        const modifier = event.ctrlKey || event.metaKey;
        if (!modifier || event.altKey) return;
        const active = document.activeElement;
        const isTyping = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT" || active.isContentEditable);
        if (isTyping) return;

        if (event.key.toLowerCase() === "z" && !event.shiftKey) {
            event.preventDefault();
            undo();
        }
        if (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey)) {
            event.preventDefault();
            redo();
        }
    });
})();
