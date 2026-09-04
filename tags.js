/* =========================================================
   TASK TAGS
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const form = document.querySelector("#todo-form");
    const todoList = document.querySelector("#todo-list");

    function normalizeTags(value) {
        return [...new Set(String(value || "").split(",").map(tag => tag.trim().toLowerCase().replace(/^#+/, "")).filter(tag => /^[a-z0-9_-]{1,20}$/.test(tag)))].slice(0, 10);
    }

    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
        } catch (error) { return []; }
    }

    function save(todos) { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }

    function createInput() {
        if (!form || document.querySelector("#todo-tags")) return;
        const options = form.querySelector(".task-options");
        if (!options) return;
        const group = document.createElement("div");
        group.className = "tag-group";
        group.innerHTML = '<label for="todo-tags">Tags</label><input type="text" id="todo-tags" name="tags" maxlength="220" placeholder="work, urgent, coding" autocomplete="off"><small>Comma-separated · up to 10 tags</small>';
        options.appendChild(group);
        form.addEventListener("submit", function () {
            const input = document.querySelector("#todo-tags");
            if (!input) return;
            const todos = load();
            if (!todos.length) return;
            todos[0].tags = normalizeTags(input.value);
            save(todos);
            input.value = "";
            window.setTimeout(() => window.location.reload(), 120);
        });
    }

    function createFilter() {
        const controls = document.querySelector(".advanced-filters");
        if (!controls || document.querySelector("#filter-tag")) return;
        const wrapper = document.createElement("div");
        wrapper.className = "filter-select tag-filter";
        wrapper.innerHTML = '<label for="filter-tag">Tag</label><select id="filter-tag"><option value="all">All tags</option></select>';
        controls.appendChild(wrapper);
        wrapper.querySelector("select").addEventListener("change", applyFilter);
        refreshFilterOptions();
    }

    function refreshFilterOptions() {
        const select = document.querySelector("#filter-tag");
        if (!select) return;
        const current = select.value;
        const tags = [...new Set(load().flatMap(todo => Array.isArray(todo.tags) ? todo.tags : []))].sort();
        select.innerHTML = '<option value="all">All tags</option>' + tags.map(tag => `<option value="${tag}">#${tag}</option>`).join("");
        select.value = tags.includes(current) ? current : "all";
    }

    function applyFilter() {
        const select = document.querySelector("#filter-tag");
        const selected = select ? select.value : "all";
        todoList.querySelectorAll(".todo-item").forEach(item => {
            const tags = (item.dataset.tags || "").split(",").filter(Boolean);
            item.hidden = selected !== "all" && !tags.includes(selected);
        });
    }

    createInput();
    createFilter();
    window.addEventListener("todo:rendered", function () {
        refreshFilterOptions();
        applyFilter();
    });
})();
