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
// TOGGLE TODO
// =========================================================

function toggleTodo(todoId) {

    const todo = todos.find(function (todo) {
        return todo.id === todoId;
    });

    if (!todo) {
        return;
    }

    todo.completed = !todo.completed;

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

        if (todo.completed) {
            listItem.classList.add("completed");
        }


        const checkbox = document.createElement("button");

        checkbox.type = "button";

        checkbox.className = "todo-checkbox";

        checkbox.setAttribute(
            "aria-label",
            todo.completed
                ? `Mark "${todo.text}" as incomplete`
                : `Mark "${todo.text}" as completed`
        );

        checkbox.dataset.todoId = todo.id;


        const todoText = document.createElement("span");

        todoText.className = "todo-text";

        todoText.textContent = todo.text;


        checkbox.addEventListener("click", function () {

            toggleTodo(todo.id);

        });


        listItem.appendChild(checkbox);

        listItem.appendChild(todoText);

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