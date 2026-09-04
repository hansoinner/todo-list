/* =========================================================
   DASHBOARD / ANALYTICS
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const dashboard = document.querySelector("#analytics-dashboard");
    if (!dashboard) return;

    const $ = selector => dashboard.querySelector(selector);

    function loadTodos() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function dateValue(date = new Date()) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    function validDate(value) {
        return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function dayStart(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    function renderKpis(todos) {
        const today = dateValue();
        const overdue = todos.filter(todo => !todo.completed && validDate(todo.dueDate) && todo.dueDate < today).length;
        const dueToday = todos.filter(todo => !todo.completed && todo.dueDate === today).length;
        const completed = todos.filter(todo => todo.completed).length;
        const completionRate = todos.length ? Math.round(completed / todos.length * 100) : 0;

        $("[data-analytics=overdue]").textContent = overdue;
        $("[data-analytics=today]").textContent = dueToday;
        $("[data-analytics=rate]").textContent = `${completionRate}%`;

        const completedLast7 = todos.filter(todo => todo.completed && todo.completedAt && new Date(todo.completedAt) >= daysAgo(7)).length;
        $("[data-analytics=completed7]").textContent = completedLast7;
    }

    function renderTrend(todos) {
        const container = $("#completion-trend");
        if (!container) return;

        const days = [];
        for (let offset = 6; offset >= 0; offset--) {
            const date = daysAgo(offset);
            const key = dateValue(date);
            const created = todos.filter(todo => validDate(todo.createdAt?.slice(0, 10)) && todo.createdAt.slice(0, 10) === key).length;
            const completed = todos.filter(todo => todo.completedAt && todo.completedAt.slice(0, 10) === key).length;
            days.push({ date, created, completed });
        }

        const max = Math.max(1, ...days.map(day => Math.max(day.created, day.completed)));
        container.innerHTML = days.map(day => {
            const createdHeight = Math.max(2, Math.round(day.created / max * 100));
            const completedHeight = Math.max(2, Math.round(day.completed / max * 100));
            const label = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day.date).slice(0, 3);
            return `<div class="trend-day"><span class="trend-value">${day.completed}</span><div class="trend-bars" title="${day.created} created, ${day.completed} completed"><span class="trend-bar" style="height:${createdHeight}%" aria-label="${day.created} tasks created"></span><span class="trend-bar completed" style="height:${completedHeight}%" aria-label="${day.completed} tasks completed"></span></div><span class="trend-label">${label}</span></div>`;
        }).join("");
    }

    function renderProductivity(todos) {
        const active = todos.filter(todo => !todo.completed).length;
        const completed = todos.filter(todo => todo.completed).length;
        const due = todos.filter(todo => validDate(todo.dueDate) && !todo.completed).length;
        const overdue = todos.filter(todo => validDate(todo.dueDate) && !todo.completed && todo.dueDate < dateValue()).length;
        const completedWithDate = todos.filter(todo => todo.completed && todo.createdAt && todo.completedAt);

        let avgHours = 0;
        if (completedWithDate.length) {
            const totalHours = completedWithDate.reduce((sum, todo) => sum + Math.max(0, new Date(todo.completedAt) - new Date(todo.createdAt)) / 3600000, 0);
            avgHours = Math.round(totalHours / completedWithDate.length * 10) / 10;
        }

        $("[data-productivity=active]").textContent = active;
        $("[data-productivity=due]").textContent = due;
        $("[data-productivity=overdue]").textContent = overdue;
        $("[data-productivity=avg]").textContent = avgHours ? `${avgHours}h` : "—";
        $("[data-productivity=completed]").textContent = completed;
    }

    function render() {
        const todos = loadTodos();
        renderKpis(todos);
        renderTrend(todos);
        renderProductivity(todos);
    }

    render();
    window.addEventListener("todo:rendered", render);
    window.addEventListener("storage", event => { if (event.key === STORAGE_KEY) render(); });
})();
