const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const priorityInput = document.querySelector("#todo-priority");
const categoryInput = document.querySelector("#todo-category");
const dueDateInput = document.querySelector("#todo-due-date");
const searchInput = document.querySelector("#task-search-input");
const categoryFilter = document.querySelector("#filter-category");
const priorityFilter = document.querySelector("#filter-priority");
const sortSelect = document.querySelector("#task-sort");
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
let currentSort = "newest";
let selectedTag = "all";

function showToast(message, type = "success") {
    window.dispatchEvent(new CustomEvent("todo:toast", { detail: { message, type } }));
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

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
                dueDate: isValidDateValue(todo.dueDate) ? todo.dueDate : "",
                tags: normalizeTags(todo.tags)
            };
        }).filter(todo => todo.text !== "");
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

function saveTodos() { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); }

function createTodo(text, priority, category, dueDate) {
    return { id: Date.now() + Math.random(), text, completed: false, priority, category, createdAt: new Date().toISOString(), dueDate: dueDate || "", tags: [] };
}

function addTodo(text, priority, category, dueDate) {
    todos.unshift(createTodo(text, priority, category, dueDate));
    saveTodos(); renderTodos(); showToast("Task added");
}

function toggleTodo(todoId) {
    const todo = todos.find(item => item.id === todoId);
    if (!todo) return;
    todo.completed = !todo.completed; saveTodos(); renderTodos();
    showToast(todo.completed ? "Task completed" : "Task marked active");
}

function deleteTodo(todoId) {
    const index = todos.findIndex(todo => todo.id === todoId);
    if (index === -1) return;
    todos.splice(index, 1); saveTodos(); renderTodos(); showToast("Task deleted", "info");
}

function editTodo(todoId) {
    const todo = todos.find(item => item.id === todoId);
    if (!todo) return;
    const todoItem = document.querySelector(`[data-id="${todoId}"]`);
    if (!todoItem) return;
    const textElement = todoItem.querySelector(".todo-text");
    const editButton = todoItem.querySelector(".edit-button");
    const actions = todoItem.querySelector(".todo-actions");
    const input = document.createElement("input");
    input.type = "text"; input.className = "edit-input"; input.value = todo.text; input.maxLength = 100;
    input.setAttribute("aria-label", `Edit ${todo.text}`);
    textElement.replaceWith(input); editButton.textContent = "Save";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button"; cancelButton.className = "cancel-button"; cancelButton.textContent = "Cancel";
    actions.appendChild(cancelButton); input.focus(); input.select();
    function saveEdit() {
        const newText = input.value.trim(); if (!newText) return input.focus();
        todo.text = newText; saveTodos(); renderTodos(); showToast("Task updated");
    }
    editButton.onclick = saveEdit; cancelButton.onclick = () => renderTodos();
    input.addEventListener("keydown", event => { if (event.key === "Enter") saveEdit(); if (event.key === "Escape") renderTodos(); });
}

function clearCompleted() {
    if (!todos.some(todo => todo.completed)) return;
    const remaining = todos.filter(todo => !todo.completed); todos.length = 0; todos.push(...remaining);
    saveTodos(); renderTodos(); showToast("Completed tasks cleared", "info");
}

function getFilteredTodos() {
    return todos.filter(function (todo) {
        const matchesStatus = currentFilter === "all" || (currentFilter === "active" && !todo.completed) || (currentFilter === "completed" && todo.completed);
        const matchesSearch = todo.text.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "all" || todo.category === selectedCategory;
        const matchesPriority = selectedPriority === "all" || todo.priority === selectedPriority;
        const matchesTag = selectedTag === "all" || todo.tags.includes(selectedTag);
        return matchesStatus && matchesSearch && matchesCategory && matchesPriority && matchesTag;
    });
}

function getTimestamp(todo) { const timestamp = new Date(todo.createdAt).getTime(); return Number.isNaN(timestamp) ? 0 : timestamp; }
function getDueTimestamp(todo) {
    if (!isValidDateValue(todo.dueDate)) return null;
    const timestamp = new Date(`${todo.dueDate}T00:00:00`).getTime(); return Number.isNaN(timestamp) ? null : timestamp;
}

function sortTodos(taskList) {
    const sorted = [...taskList]; const priorityOrder = { low: 1, medium: 2, high: 3 };
    sorted.sort(function (a, b) {
        if (currentSort === "newest") return getTimestamp(b) - getTimestamp(a);
        if (currentSort === "oldest") return getTimestamp(a) - getTimestamp(b);
        if (currentSort === "due-soon" || currentSort === "due-late") {
            const aDue = getDueTimestamp(a), bDue = getDueTimestamp(b);
            if (aDue === null && bDue === null) return getTimestamp(b) - getTimestamp(a);
            if (aDue === null) return 1; if (bDue === null) return -1;
            return (currentSort === "due-soon" ? aDue - bDue : bDue - aDue) || getTimestamp(b) - getTimestamp(a);
        }
        if (currentSort === "priority-high" || currentSort === "priority-low") {
            const difference = currentSort === "priority-high" ? priorityOrder[b.priority] - priorityOrder[a.priority] : priorityOrder[a.priority] - priorityOrder[b.priority];
            return difference || getTimestamp(b) - getTimestamp(a);
        }
        return 0;
    }); return sorted;
}

function updateTaskStatistics() {
    const total = todos.length, completed = todos.filter(todo => todo.completed).length, active = total - completed;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    statTotal.textContent = total; statActive.textContent = active; statCompleted.textContent = completed; statRate.textContent = `${rate}%`; statProgress.style.width = `${rate}%`;
    const priorityCounts = { low: 0, medium: 0, high: 0 }, categoryCounts = { general: 0, work: 0, personal: 0, learning: 0 };
    todos.forEach(todo => { priorityCounts[todo.priority]++; categoryCounts[todo.category]++; });
    statLow.textContent = priorityCounts.low; statMedium.textContent = priorityCounts.medium; statHigh.textContent = priorityCounts.high;
    statGeneral.textContent = categoryCounts.general; statWork.textContent = categoryCounts.work; statPersonal.textContent = categoryCounts.personal; statLearning.textContent = categoryCounts.learning;
    priorityTotal.textContent = total; categoryTotal.textContent = total;
}

function updateTaskCount() {
    const count = todos.filter(todo => !todo.completed).length; taskCount.textContent = `${count} task${count !== 1 ? "s" : ""} remaining`;
}
function updateClearCompletedButton() { clearCompletedButton.disabled = !todos.some(todo => todo.completed); }
function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(button => { const active = button.dataset.filter === filter; button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active)); });
    renderTodos();
}
function getPriorityLabel(priority) { return { low: "Low", medium: "Medium", high: "High" }[priority] || "Medium"; }
function getCategoryLabel(category) { return { general: "General", work: "Work", personal: "Personal", learning: "Learning" }[category] || "General"; }
function formatCreatedDate(createdAt) { const date = new Date(createdAt); return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date); }
function formatDueDate(dueDate) { return !isValidDateValue(dueDate) ? "" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dueDate}T00:00:00`)); }
function isOverdue(todo) {
    if (todo.completed || !isValidDateValue(todo.dueDate)) return false;
    const today = new Date(); const value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`; return todo.dueDate < value;
}
function getDueDateMarkup(todo) { if (!todo.dueDate) return ""; const overdue = isOverdue(todo); return `<span class="todo-due-date${overdue ? " overdue" : ""}">${overdue ? "Overdue" : "Due"}: ${formatDueDate(todo.dueDate)}</span>`; }
function getTagsMarkup(todo) { return todo.tags.length ? `<span class="todo-tags">${todo.tags.map(tag => `<span class="todo-tag">#${tag}</span>`).join("")}</span>` : ""; }

function renderEmptyState() {
    let title = "No tasks yet", message = "Add your first task to get started.";
    if (todos.length > 0) { title = "No matching tasks"; message = "Try changing your search or filters."; }
    else if (currentFilter === "active") { title = "No active tasks"; message = "All your tasks are completed."; }
    else if (currentFilter === "completed") { title = "No completed tasks"; message = "Completed tasks will appear here."; }
    todoList.innerHTML = `<li class="empty-state"><div class="empty-icon" aria-hidden="true">✓</div><h3>${title}</h3><p>${message}</p></li>`;
}

function createTodoElement(todo) {
    const todoItem = document.createElement("li"); todoItem.classList.add("todo-item"); todoItem.dataset.id = todo.id;
    if (todo.completed) todoItem.classList.add("completed"); if (isOverdue(todo)) todoItem.classList.add("overdue");
    todoItem.innerHTML = `<label class="todo-label"><input type="checkbox" ${todo.completed ? "checked" : ""} aria-label="Mark ${todo.text} as completed"><span class="custom-checkbox" aria-hidden="true"></span><span class="todo-content"><span class="todo-text"></span><span class="todo-meta"><span class="todo-category">${getCategoryLabel(todo.category)}</span><span class="todo-priority priority-${todo.priority}">${getPriorityLabel(todo.priority)}</span><span class="todo-date">${formatCreatedDate(todo.createdAt)}</span>${getDueDateMarkup(todo)}${getTagsMarkup(todo)}</span></span></label><div class="todo-actions"><button class="edit-button" type="button" aria-label="Edit ${todo.text}">Edit</button><button class="delete-button" type="button" aria-label="Delete ${todo.text}">Delete</button></div>`;
    todoItem.querySelector(".todo-text").textContent = todo.text;
    todoItem.querySelector('input[type="checkbox"]').addEventListener("change", () => toggleTodo(todo.id));
    todoItem.querySelector(".edit-button").addEventListener("click", () => editTodo(todo.id));
    todoItem.querySelector(".delete-button").addEventListener("click", () => deleteTodo(todo.id)); return todoItem;
}

function renderTodos() {
    todoList.innerHTML = ""; const filteredTodos = sortTodos(getFilteredTodos());
    if (filteredTodos.length === 0) renderEmptyState(); else filteredTodos.forEach(todo => todoList.appendChild(createTodoElement(todo)));
    updateTaskCount(); updateClearCompletedButton(); updateTaskStatistics();
    window.dispatchEvent(new CustomEvent("todo:rendered"));
}

todoForm.addEventListener("submit", function (event) {
    event.preventDefault(); const text = todoInput.value.trim(); if (!text) return;
    addTodo(text, priorityInput.value, categoryInput.value, dueDateInput.value);
    todoInput.value = ""; priorityInput.value = "medium"; categoryInput.value = "general"; dueDateInput.value = ""; todoInput.focus();
});
searchInput.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLowerCase(); renderTodos(); });
categoryFilter.addEventListener("change", () => { selectedCategory = categoryFilter.value; renderTodos(); });
priorityFilter.addEventListener("change", () => { selectedPriority = priorityFilter.value; renderTodos(); });
sortSelect.addEventListener("change", () => { currentSort = sortSelect.value; renderTodos(); });
clearCompletedButton.addEventListener("click", clearCompleted);
filterButtons.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));

saveTodos(); renderTodos();
