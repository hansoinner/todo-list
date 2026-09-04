/* =========================================================
   DRAG AND DROP TASK ORDERING
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const sortSelect = document.querySelector("#task-sort");
    const todoList = document.querySelector("#todo-list");

    if (!sortSelect || !todoList) return;

    const manualOption = sortSelect.querySelector('option[value="manual"]');
    if (!manualOption) {
        const option = document.createElement("option");
        option.value = "manual";
        option.textContent = "Custom order";
        sortSelect.appendChild(option);
    }

    sortSelect.value = "manual";
    sortSelect.dispatchEvent(new Event("change"));
    let draggedItem = null;

    function loadTodos() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            console.error("Could not load todos for reordering:", error);
            return [];
        }
    }

    function saveTodos(todos) { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }
    function getTaskId(item) { return item.dataset.id; }

    function updateDragAttributes() {
        todoList.querySelectorAll(".todo-item").forEach(function (item) {
            item.setAttribute("draggable", "true");
            item.setAttribute("aria-grabbed", "false");
        });
    }

    function clearDragState() {
        todoList.querySelectorAll(".todo-item").forEach(function (item) {
            item.classList.remove("dragging", "drag-over");
            item.setAttribute("aria-grabbed", "false");
        });
        draggedItem = null;
    }

    function saveVisibleOrder() {
        const visibleIds = Array.from(todoList.querySelectorAll(".todo-item")).map(getTaskId);
        if (visibleIds.length < 2) return false;

        const todos = loadTodos();
        const visibleSet = new Set(visibleIds);
        const reorderedVisible = [];

        visibleIds.forEach(function (id) {
            const todo = todos.find(function (item) { return String(item.id) === String(id); });
            if (todo) reorderedVisible.push(todo);
        });

        let visibleIndex = 0;
        const reorderedTodos = todos.map(function (todo) {
            if (!visibleSet.has(String(todo.id))) return todo;
            return reorderedVisible[visibleIndex++];
        });

        saveTodos(reorderedTodos);
        return true;
    }

    function getDropTarget(container, y) {
        const items = Array.from(container.querySelectorAll(".todo-item:not(.dragging)"));
        return items.reduce(function (closest, item) {
            const box = item.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: item };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    todoList.addEventListener("dragstart", function (event) {
        const item = event.target.closest(".todo-item");
        if (!item || sortSelect.value !== "manual") return;
        draggedItem = item;
        item.classList.add("dragging");
        item.setAttribute("aria-grabbed", "true");
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", getTaskId(item));
        }
    });

    todoList.addEventListener("dragover", function (event) {
        if (!draggedItem || sortSelect.value !== "manual") return;
        event.preventDefault();
        const target = getDropTarget(todoList, event.clientY);
        todoList.querySelectorAll(".todo-item").forEach(function (item) { item.classList.remove("drag-over"); });
        if (target) {
            target.classList.add("drag-over");
            todoList.insertBefore(draggedItem, target);
        } else {
            todoList.appendChild(draggedItem);
        }
    });

    todoList.addEventListener("drop", function (event) {
        if (!draggedItem || sortSelect.value !== "manual") return;
        event.preventDefault();
        const saved = saveVisibleOrder();
        clearDragState();
        if (saved) window.dispatchEvent(new CustomEvent("todo:toast", { detail: { message: "Task order updated", type: "info" } }));
    });

    todoList.addEventListener("dragend", function () {
        if (!draggedItem) return;
        saveVisibleOrder();
        clearDragState();
    });

    const observer = new MutationObserver(updateDragAttributes);
    observer.observe(todoList, { childList: true });
    updateDragAttributes();
})();
