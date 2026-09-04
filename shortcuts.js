/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

(function () {
    function createModal() {
        if (document.querySelector("#shortcuts-modal")) return;

        const overlay = document.createElement("div");
        overlay.id = "shortcuts-modal";
        overlay.className = "shortcuts-modal";
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
                <div class="shortcuts-header">
                    <div>
                        <p class="section-eyebrow">Keyboard</p>
                        <h2 id="shortcuts-title">Keyboard shortcuts</h2>
                    </div>
                    <button type="button" class="shortcuts-close" aria-label="Close keyboard shortcuts">×</button>
                </div>
                <div class="shortcuts-list">
                    <div><span>Add a new task</span><kbd>N</kbd></div>
                    <div><span>Focus task search</span><kbd>/</kbd></div>
                    <div><span>Show shortcuts</span><kbd>?</kbd></div>
                    <div><span>Undo</span><kbd>⌘/Ctrl + Z</kbd></div>
                    <div><span>Redo</span><kbd>⌘/Ctrl + Y</kbd></div>
                    <div><span>Close dialog</span><kbd>Esc</kbd></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeButton = overlay.querySelector(".shortcuts-close");
        closeButton.addEventListener("click", closeModal);
        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) closeModal();
        });
    }

    function openModal() {
        createModal();
        const modal = document.querySelector("#shortcuts-modal");
        modal.hidden = false;
        document.body.classList.add("modal-open");
        modal.querySelector(".shortcuts-close").focus();
    }

    function closeModal() {
        const modal = document.querySelector("#shortcuts-modal");
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove("modal-open");
    }

    function isTypingTarget(element) {
        if (!element) return false;
        return element.matches("input, textarea, select, button, [contenteditable='true']");
    }

    document.addEventListener("keydown", function (event) {
        const key = event.key.toLowerCase();
        const modal = document.querySelector("#shortcuts-modal");

        if (key === "escape" && modal && !modal.hidden) {
            event.preventDefault();
            closeModal();
            return;
        }

        if (isTypingTarget(document.activeElement)) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        if (key === "?") {
            event.preventDefault();
            openModal();
            return;
        }

        if (key === "n") {
            event.preventDefault();
            document.querySelector("#todo-input")?.focus();
            return;
        }

        if (key === "/") {
            event.preventDefault();
            document.querySelector("#task-search-input")?.focus();
        }
    });

    createModal();
})();
