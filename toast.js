/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */

(function () {
    const TOAST_EVENT = "todo:toast";
    let toastContainer = null;
    let toastId = 0;

    function createContainer() {
        if (toastContainer) return toastContainer;

        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        toastContainer.setAttribute("aria-atomic", "true");
        document.body.appendChild(toastContainer);

        return toastContainer;
    }

    function showToast(message, type = "success") {
        if (!message) return;

        const container = createContainer();
        const toast = document.createElement("div");
        const id = `toast-${++toastId}`;

        toast.className = `toast toast-${type}`;
        toast.id = id;
        toast.setAttribute("role", "status");

        const text = document.createElement("span");
        text.className = "toast-message";
        text.textContent = message;

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "toast-close";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Dismiss notification");

        toast.append(text, closeButton);
        container.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add("is-visible");
        });

        let dismissed = false;

        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            toast.classList.remove("is-visible");
            toast.classList.add("is-hiding");
            toast.addEventListener("transitionend", function () {
                toast.remove();
            }, { once: true });
        }

        closeButton.addEventListener("click", dismiss);
        window.setTimeout(dismiss, 2800);
    }

    window.addEventListener(TOAST_EVENT, function (event) {
        const detail = event.detail || {};
        showToast(detail.message, detail.type || "success");
    });

    window.showTodoToast = showToast;
})();
