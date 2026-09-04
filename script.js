const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const priorityInput = document.querySelector("#todo-priority");
const categoryInput = document.querySelector("#todo-category");
const dueDateInput = document.querySelector("#todo-due-date");
const searchInput = document.querySelector("#task-search-input");
const categoryFilter = document.querySelector("#filter-category");
const priorityFilter = document.querySelector("#filter-priority");
const todoList = document.querySelector("#todo-list");
const taskCount = document.querySelector("#task-count");
const clearCompletedButton = document.querySelector(".clear-completed");
const filterButtons = document.querySelectorAll(".filter-button");

const statTotal = document.querySelector("#stat-total");
const statActive = document.querySelector("#stat-active");
const statCompleted = document.querySelector("#stat-completed");
const statRate = document.querySelector("#stat-rate");
const statProgress = document.querySelector("#stat-progress");
const statLow = document.querySelector("#stat-low");
const statMedium = document.querySelector("#stat-medium");
const statHigh = document.querySelector("#stat-high");
const statGeneral = document.querySelector("#stat-general");
const statWork = document.querySelector("#stat-work");
const statPersonal = document.querySelector("#stat-personal");
const statLearning = document.querySelector("#stat-learning");
const priorityTotal = document.querySelector("#priority-total");
const categoryTotal = document.querySelector("#category-total");

const STORAGE_KEY = "todos";
const todos = loadTodos();
let currentFilter = "all";
let searchTerm = "";
let selectedCategory = "all";
let selectedPriority = "all";

function loadTodos() {
    try {
        const storedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!Array.isArray(storedTodos)) return [];

        return storedTodos.map(function (todo) {
            return {
                id: todo.id || Date.now() + Math.random(),
                text: String(todo.text || "").trim(),
                completed: Boolean(todo.completed),
                priority: ["low", "medium", "high"].includes(todo.priority) ? todo.priority : "medium",
                category: ["general", "work", "personal", "learning"].includes(todo.category) ? todo.category : "general",
                createdAt: todo.createdAt || new Date().toISOString(),
                dueDate: isValidDateValue(todo.dueDate) ? todo.dueDate : ""
            };
        }).filter(function (todo) {
            return todo.text !== "";
        });
    } catch (error) {
        console.error("Could not load todos:", error);
        return [];
    }
}

function isValidDateValue(value) {
    if (!value || typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function createTodo(text, priority, category, dueDate) {
    return {
        id: Date.now() + Math.random(),
        text: text,
        completed: false,
        priority: priority,
        category: category,
        createdAt: new Date().toISOString(),
        dueDate: dueDate || ""
    };
}

function addTodo(text, priority, category, dueDate) {
    todos.unshift(createTodo(text, priority, category, dueDate));
    saveTodos();
    renderTodos();
}

function toggleTodo(todoId) {
    const todo = todos.find(function (item) { return item.id === todoId; });
    if (!todo) return;
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
}

function deleteTodo(todoId) {
    const todoIndex = todos.findIndex(function (todo) { return todo.id === todoId; });
    if (todoIndex === -1) return;
    todos.splice(todoIndex, 1);
    saveTodos();
    renderTodos();
}

function editTodo(todoId) {
    const todo = todos.find(function (item) { return item.id === todoId; });
    if (!todo) return;

    const todoItem = document.querySelector(`[data-id="${todoId}"]`);
    if (!todoItem) return;

    const textElement = todoItem.querySelector(".todo-text");
    const editButton = todoItem.querySelector(".edit-button");
    const actions = todoItem.querySelector(".todo-actions");
    const input = document.createElement("input");

    input.type = "text";
    input.className = "edit-input";
    input.value = todo.text;
    input.maxLength = 100;
    input.setAttribute("aria-label", `Edit ${todo.text}`);

    textElement.replaceWith(input);
    editButton.textContent = "Save";
    editButton.setAttribute("aria-label", `Save ${todo.text}`);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel-button";
    cancelButton.textContent = "Cancel";
    cancelButton.setAttribute("aria-label", `Cancel editing ${todo.text}`);
    actions.appendChild(cancelButton);

    input.focus();
    input.select();

    function saveEdit() {
        const newText = input.value.trim();
        if (newText === "") {
            input.focus();
            return;
        }
        todo.text = newText;
        saveTodos();
        renderTodos();
    }

    function cancelEdit() {
        renderTodos();
    }

    editButton.onclick = saveEdit;
    cancelButton.addEventListener("click", cancelEdit);

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") saveEdit();
        if (event.key === "Escape") cancelEdit();
    });
}

function clearCompleted() {
    if (!todos.some(function (todo) { return todo.completed; })) return;

    const remainingTodos = todos.filter(function (todo) { return !todo.completed; });
    todos.length = 0;
    todos.push(...remainingTodos);
    saveTodos();
    renderTodos();
}

function getFilteredTodos() {
    return todos.filter(function (todo) {
        const matchesStatus = currentFilter === "all" ||
            (currentFilter === "active" && !todo.completed) ||
            (currentFilter === "completed" && todo.completed);
        const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "all" || todo.category === selectedCategory;
        const matchesPriority = selectedPriority === "all" || todo.priority === selectedPriority;
        return matchesStatus && matchesSearch && matchesCategory && matchesPriority;
    });
}

function updateTaskStatistics() {
    const total = todos.length;
    const completed = todos.filter(function (todo) { return todo.completed; }).length;
    const active = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    statTotal.textContent = total;
    statActive.textContent = active;
    statCompleted.textContent = completed;
    statRate.textContent = `${rate}%`;
    statProgress.style.width = `${rate}%`;

    const priorityCounts = { low: 0, medium: 0, high: 0 };
    const categoryCounts = { general: 0, work: 0, personal: 0, learning: 0 };

    todos.forEach(function (todo) {
        priorityCounts[todo.priority]++;
        categoryCounts[todo.category]++;
    });

    statLow.textContent = priorityCounts.low;
    statMedium.textContent = priorityCounts.medium;
    statHigh.textContent = priorityCounts.high;
    statGeneral.textContent = categoryCounts.general;
    statWork.textContent = categoryCounts.work;
    statPersonal.textContent = categoryCounts.personal;
    statLearning.textContent = categoryCounts.learning;
    priorityTotal.textContent = total;
    categoryTotal.textContent = total;
}

function updateTaskCount() {
    const activeTasks = todos.filter(function (todo) { return !todo.completed; });
    const count = activeTasks.length;
    taskCount.textContent = `${count} task${count !== 1 ? "s" : ""} remaining`;
}

function updateClearCompletedButton() {
    clearCompletedButton.disabled = !todos.some(function (todo) { return todo.completed; });
}

function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(function (button) {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
    renderTodos();
}

function getPriorityLabel(priority) {
    return { low: "Low", medium: "Medium", high: "High" }[priority] || "Medium";
}

function getCategoryLabel(category) {
    return { general: "General", work: "Work", personal: "Personal", learning: "Learning" }[category] || "General";
}

function formatCreatedDate(createdAt) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDueDate(dueDate) {
    if (!isValidDateValue(dueDate)) return "";
    const date = new Date(`${dueDate}T00:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function isOverdue(todo) {
    if (todo.completed || !isValidDateValue(todo.dueDate)) return false;
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return todo.dueDate < todayValue;
}

function getDueDateMarkup(todo) {
    if (!todo.dueDate) return "";
    const overdue = isOverdue(todo);
    const label = overdue ? "Overdue" : "Due";
    const date = formatDueDate(todo.dueDate);
    return `<span class="todo-due-date${overdue ? " overdue" : ""}">${label}: ${date}</span>`;
}

function renderEmptyState() {
    let title = "No tasks yet";
    let message = "Add your first task to get started.";

    if (todos.length > 0) {
        title = "No matching tasks";
        message = "Try changing your search or filters.";
    } else if (currentFilter === "active") {
        title = "No active tasks";
        message = "All your tasks are completed.";
    } else if (currentFilter === "completed") {
        title = "No completed tasks";
        message = "Completed tasks will appear here.";
    }

    todoList.innerHTML = `<li class="empty-state"><div class="empty-icon" aria-hidden="true">✓</div><h3>${title}</h3><p>${message}</p></li>`;
}

function createTodoElement(todo) {
    const todoItem = document.createElement("li");
    todoItem.classList.add("todo-item");
    todoItem.dataset.id = todo.id;
    if (todo.completed) todoItem.classList.add("completed");
    if (isOverdue(todo)) todoItem.classList.add("overdue");

    todoItem.innerHTML = `
        <label class="todo-label">
            <input type="checkbox" ${todo.completed ? "checked" : ""} aria-label="Mark ${todo.text} as completed">
            <span class="custom-checkbox" aria-hidden="true"></span>
            <span class="todo-content">
                <span class="todo-text"></span>
                <span class="todo-meta">
                    <span class="todo-category">${getCategoryLabel(todo.category)}</span>
                    <span class="todo-priority priority-${todo.priority}">${getPriorityLabel(todo.priority)}</span>
                    <span class="todo-date">${formatCreatedDate(todo.createdAt)}</span>
                    ${getDueDateMarkup(todo)}
                </span>
            </span>
        </label>
        <div class="todo-actions">
            <button class="edit-button" type="button" aria-label="Edit ${todo.text}">Edit</button>
            <button class="delete-button" type="button" aria-label="Delete ${todo.text}">Delete</button>
        </div>`;

    todoItem.querySelector(".todo-text").textContent = todo.text;
    todoItem.querySelector('input[type="checkbox"]').addEventListener("change", function () { toggleTodo(todo.id); });
    todoItem.querySelector(".edit-button").addEventListener("click", function () { editTodo(todo.id); });
    todoItem.querySelector(".delete-button").addEventListener("click", function () { deleteTodo(todo.id); });
    return todoItem;
}

function renderTodos() {
    todoList.innerHTML = "";
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        renderEmptyState();
    } else {
        filteredTodos.forEach(function (todo) { todoList.appendChild(createTodoElement(todo)); });
    }

    updateTaskCount();
    updateClearCompletedButton();
    updateTaskStatistics();
}

todoForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const text = todoInput.value.trim();
    const priority = priorityInput.value;
    const category = categoryInput.value;
    const dueDate = dueDateInput.value;
    if (text === "") return;

    addTodo(text, priority, category, dueDate);
    todoInput.value = "";
    priorityInput.value = "medium";
    categoryInput.value = "general";
    dueDateInput.value = "";
    todoInput.focus();
});

searchInput.addEventListener("input", function () {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderTodos();
});

categoryFilter.addEventListener("change", function () {
    selectedCategory = categoryFilter.value;
    renderTodos();
});

priorityFilter.addEventListener("change", function () {
    selectedPriority = priorityFilter.value;
    renderTodos();
});

clearCompletedButton.addEventListener("click", clearCompleted);

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () { setFilter(button.dataset.filter); });
});

saveTodos();
renderTodos();
