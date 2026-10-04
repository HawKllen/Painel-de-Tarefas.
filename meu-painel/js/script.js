
const $ = (selector) => document.querySelector(selector);

const taskForm = $("#taskForm");
const taskInput = $("#taskInput");
const taskList = $("#taskList");
const noteForm = $("#noteform");
const noteInput = $("#noteInput");
const noteList = $("#noteList");

let tasks = loadData("meuPainelTarefas");
let notes = loadData("meuPainelNotas");
let currentFilter = "all";
let recentlyCompletedTaskId = null;

function loadData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveData() {
  localStorage.setItem("meuPainelTarefas", JSON.stringify(tasks));
  localStorage.setItem("meuPainelNotas", JSON.stringify(notes));
}

function updateDate() {
  $("#today").textContent = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function updateStats() {
  const completed = tasks.filter(task => task.done).length;
  const pending = tasks.length - completed;

  $("#totalTasks").textContent = tasks.length;
  $("#pendingTasks").textContent = pending;
  $("#completedTasks").textContent = completed;
}

function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") return !task.done;
    if (currentFilter === "completed") return task.done;
    return true;
  });

  if (visibleTasks.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";

    message.textContent = tasks.length === 0
      ? "Nenhuma tarefa cadastrada ainda."
      : "Nenhuma tarefa nesta categoria.";

    taskList.append(message);
    recentlyCompletedTaskId = null;
    return;
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}${
      task.id === recentlyCompletedTaskId ? " just-completed" : ""
    }`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Concluir: ${task.text}`);
    checkbox.dataset.action = "toggle";
    checkbox.dataset.id = task.id;

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Excluir";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = task.id;
    deleteButton.setAttribute("aria-label", `Excluir: ${task.text}`);

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  });

  recentlyCompletedTaskId = null;
}

function renderNotes() {
  noteList.replaceChildren();

  if (notes.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";
    message.textContent = "Suas anotações aparecerão aqui.";
    noteList.append(message);
    return;
  }

  notes.forEach(note => {
    const item = document.createElement("li");
    item.className = "note-item";

    const text = document.createElement("span");
    text.textContent = note.text;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Excluir";
    deleteButton.dataset.action = "delete-note";
    deleteButton.dataset.id = note.id;
    deleteButton.setAttribute("aria-label", "Excluir anotação");

    item.append(text, deleteButton);
    noteList.append(item);
  });
}

function refresh() {
  saveData();
  renderTasks();
  renderNotes();
  updateStats();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = taskInput.value.trim();
  if (!text) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    done: false
  });

  taskInput.value = "";
  currentFilter = "all";

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  refresh();
  taskInput.focus();
});

taskList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;

  if (button.dataset.action === "delete") {
    tasks = tasks.filter(task => task.id !== id);
  }

  refresh();
});

taskList.addEventListener("change", event => {
  const checkbox = event.target;

  if (
    checkbox.matches('input[data-action="toggle"]')
  ) {
    const task = tasks.find(task => task.id === checkbox.dataset.id);

    if (task) {
      task.done = checkbox.checked;
      recentlyCompletedTaskId = checkbox.checked ? task.id : null;
      refresh();
    }
  }
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      filterButton.classList.toggle(
        "active",
        filterButton === button
      );
    });

    renderTasks();
  });
});

noteForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = noteInput.value.trim();
  if (!text) return;

  notes.unshift({
    id: crypto.randomUUID(),
    text
  });

  noteInput.value = "";
  refresh();
  noteInput.focus();
});

noteList.addEventListener("click", event => {
  const button = event.target.closest(
    'button[data-action="delete-note"]'
  );

  if (!button) return;

  notes = notes.filter(note => note.id !== button.dataset.id);
  refresh();
});

updateDate();
refresh();