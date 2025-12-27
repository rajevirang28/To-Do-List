document.addEventListener("DOMContentLoaded", () => {

  const taskInput = document.getElementById("new-task");
  const addBtn = document.getElementById("add-btn");
  const taskList = document.getElementById("task-list");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const totalTasksEl = document.getElementById("total-task");
  const completedTasksEl = document.getElementById("completed-task");
  const themeButtons = document.querySelectorAll(".theme-btn");
  const priorityOptions = document.querySelectorAll(".priority-option");
  const modeToggle = document.getElementById("mode-toggle");
  const prioritySelector = document.getElementById("priority-selector");
  const prioritySlider = document.getElementById("priority-slider");
  const taskDateInput = document.getElementById("task-date");
  const taskTimeInput = document.getElementById("task-time");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";
  let currentPriority = "high";
  let darkMode = localStorage.getItem("darkMode") !== "false";

  /* ---------- INIT ---------- */
  function init() {
    setTheme(darkMode ? "dark" : "light");

    const now = new Date();
    taskDateInput.value = now.toISOString().split("T")[0];
    taskTimeInput.value = now.toTimeString().slice(0, 5);

    renderTasks();
    updateStats();
    updatePrioritySlider();
    setupEvents();
  }

  /* ---------- EVENTS ---------- */
  function setupEvents() {
    addBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keypress", e => e.key === "Enter" && addTask());

    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
      });
    });

    priorityOptions.forEach(opt => {
      opt.addEventListener("click", () => {
        priorityOptions.forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        currentPriority = opt.dataset.priority.toLowerCase();
        updatePrioritySlider();
      });
    });

    themeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        themeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyColorTheme(btn.dataset.theme);
      });
    });

    modeToggle.addEventListener("click", toggleDarkMode);
    window.addEventListener("resize", updatePrioritySlider);
  }

  /* ---------- TASK LOGIC ---------- */
  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return animateInputError();

    const task = {
      id: Date.now(),
      text,
      completed: false,
      priority: currentPriority,
      date: taskDateInput.value,
      time: taskTimeInput.value
    };

    tasks.unshift(task);
    saveTasks();
    taskInput.value = "";
    renderTasks();
    updateStats();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
  }

  /* ---------- RENDER ---------- */
  function renderTasks() {
  taskList.innerHTML = "";

  let filtered = tasks;
  if (currentFilter === "active") filtered = tasks.filter(t => !t.completed);
  if (currentFilter === "completed") filtered = tasks.filter(t => t.completed);

  if (!filtered.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-tasks"></i>
        <h3>No tasks yet!</h3>
        <p>Add your first task</p>
      </div>`;
    return;
  }

  filtered.forEach(task => {
    const el = document.createElement("div");
    el.className = `task ${task.completed ? "completed" : ""}`;
    el.dataset.id = task.id;

    /* FORMAT DATE + TIME */
    let dateHTML = "";
    if (task.date) {
      const dateObj = new Date(task.date);
      const formattedDate = dateObj.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      dateHTML = `
        <div class="task-meta">
          <div class="task-date">
            <i class="fas fa-calendar-alt"></i>
            <span>${formattedDate}${task.time ? " • " + task.time : ""}</span>
          </div>
        </div>`;
    }

    el.innerHTML = `
      <div class="priority-indicator priority-${task.priority}"></div>

      <label class="checkbox-container">
        <input type="checkbox" ${task.completed ? "checked" : ""}>
        <span class="checkmark"></span>
      </label>

      <div class="task-content">
        ${task.text}
        ${dateHTML}
      </div>

      <div class="task-actions">
        <button class="task-btn complete-btn" title="Complete">
          <i class="fas fa-check"></i>
        </button>
        <button class="task-btn delete-btn" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    el.querySelector("input").addEventListener("change", () => toggleTask(task.id));
    el.querySelector(".complete-btn").addEventListener("click", () => toggleTask(task.id));
    el.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(el);
  });
}

  /* ---------- UI ---------- */
  function updateStats() {
    totalTasksEl.textContent = `${tasks.length} tasks`;
    completedTasksEl.textContent = `${tasks.filter(t => t.completed).length} completed`;
  }

  function animateInputError() {
    taskInput.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }],
      { duration: 150, iterations: 2 }
    );
  }

  function updatePrioritySlider() {
    const selected = document.querySelector(".priority-option.selected");
    if (!selected) return;
    const rect = selected.getBoundingClientRect();
    const parent = prioritySelector.getBoundingClientRect();
    prioritySlider.style.transform = `translateX(${rect.left - parent.left}px)`;
  }

  /* ---------- THEMES ---------- */
  function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    setTheme(darkMode ? "dark" : "light");
  }

  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    modeToggle.innerHTML = mode === "dark"
      ? `<i class="fas fa-sun"></i>`
      : `<i class="fas fa-moon"></i>`;
  }

  function applyColorTheme(theme) {
    const themes = {
      "purple-blue": ["#8a2be2", "#5f1d9e", "#00c6fb"],
      "red-yellow": ["#ff4d4d", "#d63031", "#fdcb6e"],
      "green-blue": ["#00b894", "#0984e3", "#00cec9"],
      "purple-pink": ["#6c5ce7", "#5649d2", "#fd79e8"],
      "orange-yellow": ["#e17055", "#d63031", "#fdcb6e"]
    };
    const [p, pd, s] = themes[theme];
    document.documentElement.style.setProperty("--primary", p);
    document.documentElement.style.setProperty("--primary-dark", pd);
    document.documentElement.style.setProperty("--secondary", s);
  }

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  init();
});
