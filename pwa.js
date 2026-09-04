/* =========================================================
   PROGRESSIVE WEB APP
========================================================= */

(function () {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", function () {
        navigator.serviceWorker.register("./service-worker.js")
            .then(function (registration) {
                console.info("Todo List service worker registered:", registration.scope);
            })
            .catch(function (error) {
                console.error("Todo List service worker registration failed:", error);
            });
    });
})();
