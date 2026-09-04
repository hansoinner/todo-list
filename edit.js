/* =========================================================
   EDIT TASK METADATA
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const PRIORITIES = ["low", "medium", "high"];
    const CATEGORIES = ["general", "work", "personal", "learning"];

    function loadTodos() {
        try {
            const todos = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(todos) ? todos : [];
        } catch (error) {
            console.error("Could not load todos for editing:", error);
            return [];
        }
    }

    function saveTodos(todos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function notify(message, type = "success") {
        window.dispatchEvent(new CustomEvent("todo:toast", { detail: { message, type } }));
    }

    function isValidDateValue(value) {
        if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function createSelect(className, label, options, selectedValue) {
        const wrapper = document.createElement("div");
        wrapper.className = className;
        const select = document.createElement("select");
        select.setAttribute("aria-label", label);
        options.forEach(function (option) {
            const element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            element.selected = option.value === selectedValue;
            select.appendChild(element);
        });
        wrapper.appendChild(select);
        return { wrapper, select };
    }

    function createDateInput(value) {
        const wrapper = document.createElement("div");
        wrapper.className = "date-group todo-edit-field";
        const input = document.createElement("input");
        input.type = "date";
        input.value = isValidDateValue(value) ? value : "";
        input.setAttribute("aria-label", "Due date");
        wrapper.appendChild(input);
        return { wrapper, input };
    }

    function createMetadataEditor(todo, todoItem) {
        const content = todoItem.querySelector(".todo-content");
        const actions = todoItem.querySelector(".todo-actions");
        const editButton = actions.querySelector(".edit-button");
        const deleteButton = actions.querySelector(".delete-button");

        content.innerHTML = "";
        content.classList.add("todo-editing");

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "edit-input todo-edit-text";
        textInput.value = todo.text;
        textInput.maxLength = 100;
        textInput.setAttribute("aria-label", "Edit task name");

        const fields = document.createElement("div");
        fields.className = "todo-edit-fields";

        const priority = createSelect("select-group todo-edit-field", "Priority", [
            { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }
        ], todo.priority);

        const category = createSelect("select-group todo-edit-field", "Category", [
            { value: "general", label: "General" }, { value: "work", label: "Work" }, { value: "personal", label: "Personal" }, { value: "learning", label: "Learning" }
        ], todo.category);

        const dueDate = createDateInput(todo.dueDate);
        fields.append(priority.wrapper, category.wrapper, dueDate.wrapper);
        content.append(textInput, fields);

        editButton.textContent = "Save";
        editButton.setAttribute("aria-label", `Save ${todo.text}`);
        deleteButton.textContent = "Cancel";
        deleteButton.setAttribute("aria-label", `Cancel editing ${todo.text}`);
        deleteButton.classList.add("cancel-edit-button");

        textInput.focus();
        textInput.select();

        function restore() { window.location.reload(); }

        function save() {
            const text = textInput.value.trim();
            if (!text) { textInput.focus(); return; }

            const selectedTodos = loadTodos();
            const storedTodo = selectedTodos.find(function (item) { return String(item.id) === String(todo.id); });
            if (!storedTodo) { restore(); return; }

            storedTodo.text = text;
            storedTodo.priority = PRIORITIES.includes(priority.select.value) ? priority.select.value : "medium";
            storedTodo.category = CATEGORIES.includes(category.select.value) ? category.select.value : "general";
            storedTodo.dueDate = isValidDateValue(dueDate.input.value) ? dueDate.input.value : "";

            saveTodos(selectedTodos);
            notify("Task updated");
            restore();
        }

        editButton.onclick = save;
        deleteButton.onclick = restore;

        textInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") save();
            if (event.key === "Escape") restore();
        });

        [priority.select, category.select, dueDate.input].forEach(function (field) {
            field.addEventListener("keydown", function (event) {
                if (event.key === "Escape") restore();
            });
        });
    }

    function handleEditClick(event) {
        const button = event.target.closest(".edit-button");
        if (!button) return;
        const todoItem = button.closest(".todo-item");
        if (!todoItem) return;
        const todos = loadTodos();
        const todo = todos.find(function (item) { return String(item.id) === String(todoItem.dataset.id); });
        if (!todo) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        createMetadataEditor(todo, todoItem);
    }

    document.addEventListener("click", handleEditClick, true);
})();
