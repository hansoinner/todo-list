/* =========================================================
   LIGHT / DARK MODE
========================================================= */

(function () {
    const THEME_KEY = "todo-theme";
    const root = document.documentElement;

    function getPreferredTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "dark" || saved === "light") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;

        const button = document.querySelector("#theme-toggle");
        if (!button) return;

        const isDark = theme === "dark";
        button.textContent = isDark ? "☀" : "☾";
        button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        button.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
        button.setAttribute("aria-pressed", String(isDark));
    }

    function createToggle() {
        const header = document.querySelector(".app-header");
        if (!header || document.querySelector("#theme-toggle")) return;

        const button = document.createElement("button");
        button.id = "theme-toggle";
        button.type = "button";
        button.className = "theme-toggle";
        button.addEventListener("click", function () {
            const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
            localStorage.setItem(THEME_KEY, nextTheme);
            applyTheme(nextTheme);
        });

        header.appendChild(button);
        applyTheme(root.dataset.theme || getPreferredTheme());
    }

    const initialTheme = getPreferredTheme();
    root.dataset.theme = initialTheme;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createToggle);
    } else {
        createToggle();
    }
})();
