/* =========================================================
   EXPORT / IMPORT TASK DATA
========================================================= */

(function () {
    const STORAGE_KEY = "todos";
    const MAX_FILE_SIZE = 1024 * 1024;

    function toast(message, type = "success") {
        window.dispatchEvent(new CustomEvent("todo:toast", {
            detail: { message, type }
        }));
    }

    function loadTodos() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            return [];
        }
    }

    function isValidDate(value) {
        if (!value) return true;
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    function normalizeTodo(todo) {
        if (!todo || typeof todo !== "object") return null;
        const text = typeof todo.text === "string" ? todo.text.trim() : "";
        if (!text || text.length > 100) return null;

        return {
            id: todo.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text,
            completed: Boolean(todo.completed),
            priority: ["low", "medium", "high"].includes(todo.priority) ? todo.priority : "medium",
            category: ["general", "work", "personal", "learning"].includes(todo.category) ? todo.category : "general",
            createdAt: typeof todo.createdAt === "string" && !Number.isNaN(new Date(todo.createdAt).getTime())
                ? todo.createdAt
                : new Date().toISOString(),
            dueDate: isValidDate(todo.dueDate) ? (todo.dueDate || "") : ""
        };
    }

    function exportTasks() {
        const data = {
            app: "Todo List",
            version: 1,
            exportedAt: new Date().toISOString(),
            tasks: loadTodos()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `todo-list-${date}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast("Tasks exported", "info");
    }

    function importTasks(file) {
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            toast("Import file is too large", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            try {
                const data = JSON.parse(reader.result);
                const sourceTasks = Array.isArray(data) ? data : data?.tasks;

                if (!Array.isArray(sourceTasks)) throw new Error("Invalid task format");

                const importedTasks = sourceTasks.map(normalizeTodo);
                if (importedTasks.some(function (task) { return task === null; })) {
                    throw new Error("Invalid task data");
                }

                if (!window.confirm(`Import ${importedTasks.length} task${importedTasks.length === 1 ? "" : "s"}? This will replace your current tasks.`)) {
                    return;
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(importedTasks));
                toast("Tasks imported", "success");
                window.setTimeout(function () { window.location.reload(); }, 500);
            } catch (error) {
                console.error("Could not import tasks:", error);
                toast("Could not import tasks. Check the JSON file.", "error");
            }
        };

        reader.onerror = function () {
            toast("Could not read the import file", "error");
        };

        reader.readAsText(file);
    }

    function createControls() {
        const header = document.querySelector(".todo-header");
        if (!header || document.querySelector(".data-transfer-controls")) return;

        const controls = document.createElement("div");
        controls.className = "data-transfer-controls";

        const exportButton = document.createElement("button");
        exportButton.type = "button";
        exportButton.className = "data-transfer-button";
        exportButton.textContent = "Export";
        exportButton.setAttribute("aria-label", "Export tasks as JSON");
        exportButton.addEventListener("click", exportTasks);

        const importButton = document.createElement("button");
        importButton.type = "button";
        importButton.className = "data-transfer-button";
        importButton.textContent = "Import";
        importButton.setAttribute("aria-label", "Import tasks from JSON");

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        fileInput.hidden = true;
        fileInput.setAttribute("aria-hidden", "true");

        importButton.addEventListener("click", function () { fileInput.click(); });
        fileInput.addEventListener("change", function () {
            importTasks(fileInput.files[0]);
            fileInput.value = "";
        });

        controls.append(exportButton, importButton, fileInput);
        header.appendChild(controls);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControls);
    } else {
        createControls();
    }
})();
