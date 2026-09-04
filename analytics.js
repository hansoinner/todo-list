/* =========================================================
   INTERACTIVE DASHBOARD / ANALYTICS
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const dashboard = document.querySelector("#analytics-dashboard");
    if (!dashboard) return;

    const $ = selector => dashboard.querySelector(selector);
    let period = 7;
    let hiddenSeries = new Set();

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

    function daysAgo(days) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - days);
        return date;
    }

    function validDate(value) {
        return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    function getCreatedDate(todo) {
        const value = todo.createdAt ? String(todo.createdAt).slice(0, 10) : "";
        return validDate(value) ? value : "";
    }

    function getCompletedDate(todo) {
        const value = todo.completedAt ? String(todo.completedAt).slice(0, 10) : "";
        return validDate(value) ? value : "";
    }

    function renderKpis(todos) {
        const today = dateValue();
        const overdue = todos.filter(todo => !todo.completed && validDate(todo.dueDate) && todo.dueDate < today).length;
        const dueToday = todos.filter(todo => !todo.completed && todo.dueDate === today).length;
        const completed = todos.filter(todo => todo.completed).length;
        const completionRate = todos.length ? Math.round(completed / todos.length * 100) : 0;
        const since = dateValue(daysAgo(period - 1));
        const completedPeriod = todos.filter(todo => {
            const completedDate = getCompletedDate(todo);
            return completedDate && completedDate >= since;
        }).length;

        $("[data-analytics=overdue]").textContent = overdue;
        $("[data-analytics=today]").textContent = dueToday;
        $("[data-analytics=rate]").textContent = `${completionRate}%`;
        $("[data-analytics=completed7]").textContent = completedPeriod;
    }

    function buildData(todos) {
        const days = [];
        for (let offset = period - 1; offset >= 0; offset--) {
            const date = daysAgo(offset);
            const key = dateValue(date);
            const created = todos.filter(todo => getCreatedDate(todo) === key).length;
            const completed = todos.filter(todo => getCompletedDate(todo) === key).length;
            days.push({ date, key, created, completed });
        }
        return days;
    }

    function renderTrend(todos) {
        const container = $("#completion-trend");
        if (!container) return;

        const data = buildData(todos);
        if (!data.length) {
            container.innerHTML = '<div class="analytics-empty">No analytics data yet.</div>';
            return;
        }

        const width = 760;
        const height = 270;
        const pad = { top: 28, right: 20, bottom: 42, left: 36 };
        const chartWidth = width - pad.left - pad.right;
        const chartHeight = height - pad.top - pad.bottom;
        const max = Math.max(1, ...data.map(item => Math.max(item.created, item.completed)));
        const x = index => pad.left + (data.length === 1 ? chartWidth / 2 : index * chartWidth / (data.length - 1));
        const y = value => pad.top + chartHeight - (value / max) * chartHeight;
        const line = key => data.map((item, index) => `${index ? "L" : "M"}${x(index).toFixed(1)} ${y(item[key]).toFixed(1)}`).join(" ");
        const area = key => `${line(key)} L ${x(data.length - 1).toFixed(1)} ${pad.top + chartHeight} L ${x(0).toFixed(1)} ${pad.top + chartHeight} Z`;

        const labels = data.map((item, index) => {
            const show = period <= 7 || index % Math.ceil(period / 7) === 0 || index === data.length - 1;
            if (!show) return "";
            const label = new Intl.DateTimeFormat(undefined, period <= 7 ? { weekday: "short" } : { month: "short", day: "numeric" }).format(item.date);
            return `<text class="chart-axis-label" x="${x(index)}" y="${height - 12}" text-anchor="middle">${label}</text>`;
        }).join("");

        const points = ["created", "completed"].map(key => {
            if (hiddenSeries.has(key)) return "";
            return data.map((item, index) => `<circle class="chart-point ${key}" cx="${x(index)}" cy="${y(item[key])}" r="4" tabindex="0" data-index="${index}" data-series="${key}" aria-label="${key}: ${item[key]} on ${item.key}"><title>${item.key}: ${item[key]} ${key}</title></circle>`).join("");
        }).join("");

        container.innerHTML = `<div class="chart-toolbar"><div class="chart-legend" role="group" aria-label="Chart series"><button type="button" class="chart-toggle ${hiddenSeries.has("created") ? "is-hidden" : ""}" data-series-toggle="created" aria-pressed="${!hiddenSeries.has("created")}"><span class="legend-dot created"></span>Created</button><button type="button" class="chart-toggle ${hiddenSeries.has("completed") ? "is-hidden" : ""}" data-series-toggle="completed" aria-pressed="${!hiddenSeries.has("completed")}"><span class="legend-dot completed"></span>Completed</button></div><span class="chart-summary">Hover a point for details</span></div><div class="chart-scroll"><svg class="interactive-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Interactive task trend for the last ${period} days"><g class="chart-grid">${[0, .25, .5, .75, 1].map(step => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${y(max * step)}" y2="${y(max * step)}"></line>`).join("")}</g><g class="chart-y-labels">${[0, .25, .5, .75, 1].map(step => `<text x="${pad.left - 8}" y="${y(max * step) + 4}" text-anchor="end">${Math.round(max * step)}</text>`).join("")}</g>${!hiddenSeries.has("created") ? `<path class="chart-area created" d="${area("created")}"></path><path class="chart-line created" d="${line("created")}"></path>` : ""}${!hiddenSeries.has("completed") ? `<path class="chart-area completed" d="${area("completed")}"></path><path class="chart-line completed" d="${line("completed")}"></path>` : ""}${points}${labels}</svg></div><div id="chart-tooltip" class="chart-tooltip" role="status" aria-live="polite"></div>`;

        container.querySelectorAll("[data-series-toggle]").forEach(button => {
            button.addEventListener("click", () => {
                const series = button.dataset.seriesToggle;
                hiddenSeries.has(series) ? hiddenSeries.delete(series) : hiddenSeries.add(series);
                renderTrend(todos);
            });
        });

        const tooltip = $("#chart-tooltip");
        container.querySelectorAll(".chart-point").forEach(point => {
            const updateTooltip = () => {
                const item = data[Number(point.dataset.index)];
                const series = point.dataset.series;
                tooltip.textContent = `${item.key} · ${series === "created" ? "Created" : "Completed"}: ${item[series]}`;
                tooltip.classList.add("visible");
            };
            point.addEventListener("mouseenter", updateTooltip);
            point.addEventListener("focus", updateTooltip);
            point.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
            point.addEventListener("blur", () => tooltip.classList.remove("visible"));
        });
    }

    function getCategory(todo) {
        const category = String(todo.category || "general").toLowerCase();
        return ["general", "work", "personal", "learning"].includes(category) ? category : "general";
    }

    function getPriority(todo) {
        const priority = String(todo.priority || "medium").toLowerCase();
        return ["low", "medium", "high"].includes(priority) ? priority : "medium";
    }

    function filterByDimension(value, type) {
        const select = document.querySelector(type === "category" ? "#filter-category" : "#filter-priority");
        if (!select) return;
        select.value = value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        document.querySelector("#todo-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderCategoryPriority(todos) {
        const categoryContainer = $("#category-analytics");
        const priorityContainer = $("#priority-analytics");
        if (!categoryContainer || !priorityContainer) return;

        const categories = [
            { key: "work", label: "Work" },
            { key: "personal", label: "Personal" },
            { key: "learning", label: "Learning" },
            { key: "general", label: "General" }
        ];
        const priorities = [
            { key: "high", label: "High" },
            { key: "medium", label: "Medium" },
            { key: "low", label: "Low" }
        ];

        const categoryCounts = Object.fromEntries(categories.map(item => [item.key, 0]));
        const priorityCounts = Object.fromEntries(priorities.map(item => [item.key, 0]));
        todos.forEach(todo => {
            categoryCounts[getCategory(todo)]++;
            priorityCounts[getPriority(todo)]++;
        });

        const total = todos.length;
        const categoryTotal = Math.max(1, total);
        const categoryParts = categories.map(item => ({ ...item, count: categoryCounts[item.key], percent: total ? Math.round(categoryCounts[item.key] / total * 100) : 0 }));
        const categoryGradient = categoryParts.reduce((parts, item, index) => {
            const start = categoryParts.slice(0, index).reduce((sum, part) => sum + part.percent, 0);
            const end = start + item.percent;
            parts.push(`var(--analytics-category-${item.key}) ${start}% ${end}%`);
            return parts;
        }, []).join(", ");

        categoryContainer.innerHTML = `<div class="analytics-dimension-layout"><button type="button" class="analytics-donut" style="--donut-gradient:${categoryGradient || "var(--surface-muted) 0% 100%"}" aria-label="Task category distribution: ${categoryParts.map(item => `${item.label} ${item.percent}%`).join(", ")}"><span class="analytics-donut-center"><strong>${total}</strong><small>tasks</small></span></button><div class="analytics-dimension-legend">${categoryParts.map(item => `<button type="button" class="analytics-dimension-row" data-category-filter="${item.key}" aria-label="Filter by ${item.label}: ${item.count} tasks"><span class="analytics-legend-label"><i class="analytics-legend-dot category-${item.key}"></i>${item.label}</span><strong>${item.count}</strong><span class="analytics-percent">${item.percent}%</span></button>`).join("")}</div></div><p class="analytics-chart-hint">Select a category to filter your tasks.</p>`;

        const maxPriority = Math.max(1, ...priorities.map(item => priorityCounts[item.key]));
        priorityContainer.innerHTML = `<div class="analytics-bar-list">${priorities.map(item => { const count = priorityCounts[item.key]; const percent = total ? Math.round(count / total * 100) : 0; const width = Math.round(count / maxPriority * 100); return `<button type="button" class="analytics-bar-row" data-priority-filter="${item.key}" aria-label="Filter by ${item.label} priority: ${count} tasks"><span class="analytics-bar-label"><i class="analytics-legend-dot priority-${item.key}"></i>${item.label}</span><span class="analytics-bar-track"><span class="analytics-bar-fill priority-${item.key}" style="width:${width}%"></span></span><strong>${count}</strong><small>${percent}%</small></button>`; }).join("")}</div><p class="analytics-chart-hint">Select a priority to filter your tasks.</p>`;

        categoryContainer.querySelectorAll("[data-category-filter]").forEach(button => button.addEventListener("click", () => filterByDimension(button.dataset.categoryFilter, "category")));
        priorityContainer.querySelectorAll("[data-priority-filter]").forEach(button => button.addEventListener("click", () => filterByDimension(button.dataset.priorityFilter, "priority")));
    }

    function renderProductivity(todos) {
        const today = dateValue();
        const active = todos.filter(todo => !todo.completed).length;
        const completed = todos.filter(todo => todo.completed).length;
        const due = todos.filter(todo => validDate(todo.dueDate) && !todo.completed).length;
        const overdue = todos.filter(todo => validDate(todo.dueDate) && !todo.completed && todo.dueDate < today).length;
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

        const total = Math.max(1, todos.length);
        const activeRatio = Math.round(active / total * 100);
        const dueRatio = Math.round(due / total * 100);
        const overdueRatio = active ? Math.round(overdue / active * 100) : 0;
        const progressBars = dashboard.querySelectorAll(".analytics-progress span");
        [activeRatio, dueRatio, overdueRatio].forEach((value, index) => {
            if (progressBars[index]) progressBars[index].style.width = `${Math.min(100, value)}%`;
        });

        const completionScore = todos.length ? completed / todos.length * 100 : 0;
        const overduePenalty = active ? overdue / active * 100 : 0;
        const completionSpeed = avgHours ? Math.max(0, 100 - Math.min(avgHours, 168) / 168 * 100) : 50;
        const consistency = Math.min(100, completed / Math.max(1, period) * 100);
        const score = Math.round(completionScore * 0.45 + (100 - overduePenalty) * 0.25 + completionSpeed * 0.15 + consistency * 0.15);
        const scoreValue = $("[data-productivity=score]");
        const scoreBar = $("[data-productivity-score-bar]");
        const scoreLabel = $("[data-productivity=score-label]");

        if (scoreValue) scoreValue.textContent = `${score}/100`;
        if (scoreBar) scoreBar.style.width = `${score}%`;
        if (scoreLabel) scoreLabel.textContent = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs focus" : "At risk";
    }

    function render() {
        const todos = loadTodos();
        renderKpis(todos);
        renderTrend(todos);
        renderProductivity(todos);
        renderCategoryPriority(todos);
    }

    const periodSelect = $("#analytics-period");
    periodSelect?.addEventListener("change", () => {
        period = Number(periodSelect.value) || 7;
        hiddenSeries.clear();
        render();
    });

    render();
    window.addEventListener("todo:rendered", render);
    window.addEventListener("storage", event => { if (event.key === STORAGE_KEY) render(); });
})();
