/* =========================================================
   COMPLETE TASK EDITOR
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const PRIORITIES = ["low", "medium", "high"];
    const CATEGORIES = ["general", "work", "personal", "learning"];

    function loadTodos() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(data) ? data : [];
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

    function normalizeTags(value) {
        return [...new Set(String(value || "")
            .split(",")
            .map(tag => tag.trim().toLowerCase().replace(/^#+/, ""))
            .filter(tag => /^[a-z0-9_-]{1,20}$/.test(tag)))]
            .slice(0, 10);
    }

    function createField(className, labelText, control) {
        const wrapper = document.createElement("div");
        wrapper.className = className;
        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "todo-edit-label";
        wrapper.append(label, control);
        return wrapper;
    }

    function createSelect(label, options, selectedValue) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", label);
        options.forEach(option => {
            const element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            element.selected = option.value === selectedValue;
            select.appendChild(element);
        });
        return select;
    }

    function createMetadataEditor(todo, todoItem) {
        const content = todoItem.querySelector(".todo-content");
        const actions = todoItem.querySelector(".todo-actions");
        if (!content || !actions || content.classList.contains("todo-editing")) return;

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

        const prioritySelect = createSelect("Priority", [
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" }
        ], todo.priority);

        const categorySelect = createSelect("Category", [
            { value: "general", label: "General" },
            { value: "work", label: "Work" },
            { value: "personal", label: "Personal" },
            { value: "learning", label: "Learning" }
        ], todo.category);

        const dueDateInput = document.createElement("input");
        dueDateInput.type = "date";
        dueDateInput.value = isValidDateValue(todo.dueDate) ? todo.dueDate : "";
        dueDateInput.setAttribute("aria-label", "Due date");

        const tagsInput = document.createElement("input");
        tagsInput.type = "text";
        tagsInput.value = Array.isArray(todo.tags) ? todo.tags.join(", ") : "";
        tagsInput.maxLength = 220;
        tagsInput.placeholder = "work, urgent, coding";
        tagsInput.setAttribute("aria-label", "Tags");

        fields.append(
            createField("todo-edit-field", "Priority", prioritySelect),
            createField("todo-edit-field", "Category", categorySelect),
            createField("todo-edit-field", "Due date", dueDateInput),
            createField("todo-edit-field todo-edit-tags", "Tags", tagsInput)
        );

        const hint = document.createElement("small");
        hint.className = "todo-edit-hint";
        hint.textContent = "Comma-separated · up to 10 tags";

        content.append(textInput, fields, hint);

        const saveButton = actions.querySelector(".edit-button");
        const cancelButton = actions.querySelector(".delete-button");
        saveButton.textContent = "Save";
        saveButton.setAttribute("aria-label", `Save ${todo.text}`);
        cancelButton.textContent = "Cancel";
        cancelButton.setAttribute("aria-label", `Cancel editing ${todo.text}`);
        cancelButton.classList.add("cancel-edit-button");

        function restore() {
            window.location.reload();
        }

        function save() {
            const text = textInput.value.trim();
            if (!text) {
                textInput.focus();
                return;
            }

            const todos = loadTodos();
            const storedTodo = todos.find(item => String(item.id) === String(todo.id));
            if (!storedTodo) {
                restore();
                return;
            }

            storedTodo.text = text;
            storedTodo.priority = PRIORITIES.includes(prioritySelect.value) ? prioritySelect.value : "medium";
            storedTodo.category = CATEGORIES.includes(categorySelect.value) ? categorySelect.value : "general";
            storedTodo.dueDate = isValidDateValue(dueDateInput.value) ? dueDateInput.value : "";
            storedTodo.tags = normalizeTags(tagsInput.value);

            saveTodos(todos);
            notify("Task updated");
            restore();
        }

        saveButton.onclick = save;
        cancelButton.onclick = restore;

        const controls = [textInput, prioritySelect, categorySelect, dueDateInput, tagsInput];
        controls.forEach(control => {
            control.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    restore();
                }
            });
        });

        textInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                save();
            }
        });

        textInput.focus();
        textInput.select();
    }

    function handleEditClick(event) {
        const button = event.target.closest(".edit-button");
        if (!button) return;
        const todoItem = button.closest(".todo-item");
        if (!todoItem) return;

        const todo = loadTodos().find(item => String(item.id) === String(todoItem.dataset.id));
        if (!todo) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        createMetadataEditor(todo, todoItem);
    }

    document.addEventListener("click", handleEditClick, true);
})();
