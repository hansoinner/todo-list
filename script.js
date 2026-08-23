// =========================================================
// TODO DATA
// =========================================================

const todos = [];


// =========================================================
// DOM ELEMENTS
// =========================================================

const todoForm = document.querySelector("#todo-form");
const todoInput = document.querySelector("#todo-input");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");


// =========================================================
// ADD TODO
// =========================================================

function addTodo(text) {

    const todo = {
        id: Date.now(),
        text: text,
        completed: false
    };

    todos.push(todo);

    renderTodos();
}


// =========================================================
// RENDER TODOS
// =========================================================

function renderTodos() {

    todoList.innerHTML = "";

    todos.forEach(function (todo) {

        const listItem = document.createElement("li");

        listItem.className = "todo-item";

        listItem.textContent = todo.text;

        todoList.appendChild(listItem);
    });


    updateTaskCount();

    updateEmptyState();
}


// =========================================================
// UPDATE TASK COUNT
// =========================================================

function updateTaskCount() {

    const remainingTodos = todos.filter(function (todo) {
        return !todo.completed;
    }).length;

    taskCount.textContent =
        `${remainingTodos} ${remainingTodos === 1 ? "task" : "tasks"} remaining`;
}


// =========================================================
// UPDATE EMPTY STATE
// =========================================================

function updateEmptyState() {

    if (todos.length === 0) {

        emptyState.hidden = false;

    } else {

        emptyState.hidden = true;
    }
}


// =========================================================
// FORM SUBMISSION
// =========================================================

todoForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const text = todoInput.value.trim();

    if (text === "") {
        return;
    }

    addTodo(text);

    todoInput.value = "";

    todoInput.focus();
});


// =========================================================
// INITIAL RENDER
// =========================================================

renderTodos();