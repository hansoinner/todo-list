/* =========================================================
   PROGRESSIVE WEB APP
========================================================= */

(function () {
    const state = {
        deferredPrompt: null,
        registration: null,
        refreshing: false
    };

    function showToast(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message);
        }
    }

    function createPwaControls() {
        const header = document.querySelector(".app-header");
        if (!header || document.querySelector(".pwa-controls")) return;

        const controls = document.createElement("div");
        controls.className = "pwa-controls";
        controls.innerHTML = `
            <button type="button" class="pwa-install-button" id="pwa-install-button" hidden>
                Install App
            </button>
            <span class="offline-status" id="offline-status" role="status" aria-live="polite" hidden>
                Offline mode
            </span>
        `;

        header.appendChild(controls);
    }

    function createUpdateBanner() {
        if (document.querySelector(".update-banner")) return;

        const banner = document.createElement("aside");
        banner.className = "update-banner";
        banner.setAttribute("role", "status");
        banner.innerHTML = `
            <div>
                <strong>Update available</strong>
                <span>A newer version of Todo List is ready.</span>
            </div>
            <button type="button" id="pwa-update-button">Update</button>
        `;

        document.body.appendChild(banner);

        document.getElementById("pwa-update-button").addEventListener("click", function () {
            if (!state.registration || !state.registration.waiting) return;

            state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
        });
    }

    function showUpdateBanner() {
        createUpdateBanner();
        requestAnimationFrame(function () {
            document.querySelector(".update-banner")?.classList.add("is-visible");
        });
    }

    function updateOnlineStatus() {
        const status = document.getElementById("offline-status");
        if (!status) return;

        const offline = !navigator.onLine;
        status.hidden = !offline;
        status.textContent = offline ? "Offline mode" : "Back online";

        if (!offline) {
            window.setTimeout(function () {
                status.hidden = true;
            }, 2200);
        }
    }

    function setupInstallPrompt() {
        const installButton = document.getElementById("pwa-install-button");
        if (!installButton) return;

        window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault();
            state.deferredPrompt = event;
            installButton.hidden = false;
        });

        installButton.addEventListener("click", async function () {
            if (!state.deferredPrompt) return;

            state.deferredPrompt.prompt();
            const result = await state.deferredPrompt.userChoice;

            if (result.outcome === "accepted") {
                showToast("Todo List installed");
            }

            state.deferredPrompt = null;
            installButton.hidden = true;
        });

        window.addEventListener("appinstalled", function () {
            state.deferredPrompt = null;
            installButton.hidden = true;
            showToast("Todo List installed");
        });
    }

    function setupServiceWorker() {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.register("./service-worker.js")
            .then(function (registration) {
                state.registration = registration;
                console.info("Todo List service worker registered:", registration.scope);

                if (registration.waiting) {
                    showUpdateBanner();
                }

                registration.addEventListener("updatefound", function () {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", function () {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            showUpdateBanner();
                        }
                    });
                });
            })
            .catch(function (error) {
                console.error("Todo List service worker registration failed:", error);
            });

        navigator.serviceWorker.addEventListener("controllerchange", function () {
            if (state.refreshing) return;
            state.refreshing = true;
            window.location.reload();
        });
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    window.addEventListener("load", function () {
        createPwaControls();
        setupInstallPrompt();
        updateOnlineStatus();
        setupServiceWorker();
    });
})();
