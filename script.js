const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const taskCount = document.querySelector("#task-count");
const clearCompletedButton = document.querySelector(".clear-completed");
const filterButtons = document.querySelectorAll(".filter-button");

const todos = JSON.parse(localStorage.getItem("todos")) || [];
let currentFilter = "all";

function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function addTodo(text) {
    const todo = { id: Date.now(), text: text, completed: false };
    todos.push(todo);
    saveTodos();
    renderTodos();
}

function toggleTodo(todoId) {
    const todo = todos.find(function (todo) { return todo.id === todoId; });
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
    const todo = todos.find(function (todo) { return todo.id === todoId; });
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
    input.setAttribute("aria-label", "Edit task");

    textElement.replaceWith(input);
    editButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "cancel-button";
    cancelButton.textContent = "Cancel";
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

    function cancelEdit() { renderTodos(); }

    editButton.onclick = saveEdit;
    cancelButton.addEventListener("click", cancelEdit);
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") saveEdit();
        if (event.key === "Escape") cancelEdit();
    });
}

function clearCompleted() {
    const completedTodos = todos.filter(function (todo) { return todo.completed; });
    if (completedTodos.length === 0) return;

    const remainingTodos = todos.filter(function (todo) { return !todo.completed; });
    todos.length = 0;
    todos.push(...remainingTodos);
    saveTodos();
    renderTodos();
}

function getFilteredTodos() {
    if (currentFilter === "active") return todos.filter(function (todo) { return !todo.completed; });
    if (currentFilter === "completed") return todos.filter(function (todo) { return todo.completed; });
    return todos;
}

function updateTaskCount() {
    const activeTasks = todos.filter(function (todo) { return !todo.completed; });
    const count = activeTasks.length;
    taskCount.textContent = `${count} task${count !== 1 ? "s" : ""} remaining`;
}

function updateClearCompletedButton() {
    const hasCompletedTodos = todos.some(function (todo) { return todo.completed; });
    clearCompletedButton.disabled = !hasCompletedTodos;
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

function renderEmptyState() {
    let title = "No tasks yet";
    let message = "Add your first task to get started.";

    if (currentFilter === "active") {
        title = "No active tasks";
        message = "All your tasks are completed.";
    }
    if (currentFilter === "completed") {
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

    todoItem.innerHTML = `<label class="todo-label"><input type="checkbox" ${todo.completed ? "checked" : ""} aria-label="Mark ${todo.text} as completed"><span class="custom-checkbox" aria-hidden="true"></span><span class="todo-text"></span></label><div class="todo-actions"><button class="edit-button" type="button" aria-label="Edit ${todo.text}">Edit</button><button class="delete-button" type="button" aria-label="Delete ${todo.text}">Delete</button></div>`;

    todoItem.querySelector(".todo-text").textContent = todo.text;

    const checkbox = todoItem.querySelector('input[type="checkbox"]');
    const editButton = todoItem.querySelector(".edit-button");
    const deleteButton = todoItem.querySelector(".delete-button");

    checkbox.addEventListener("change", function () { toggleTodo(todo.id); });
    editButton.addEventListener("click", function () { editTodo(todo.id); });
    deleteButton.addEventListener("click", function () { deleteTodo(todo.id); });

    return todoItem;
}

function renderTodos() {
    todoList.innerHTML = "";
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        renderEmptyState();
        updateTaskCount();
        updateClearCompletedButton();
        return;
    }

    filteredTodos.forEach(function (todo) {
        todoList.appendChild(createTodoElement(todo));
    });

    updateTaskCount();
    updateClearCompletedButton();
}

todoForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (text === "") return;
    addTodo(text);
    todoInput.value = "";
    todoInput.focus();
});

clearCompletedButton.addEventListener("click", function () { clearCompleted(); });

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () { setFilter(button.dataset.filter); });
});

renderTodos();