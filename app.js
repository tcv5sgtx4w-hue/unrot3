const quotes = [
  "No negocies contigo mismo.",
  "La disciplina es libertad.",
  "Hazlo aunque no te apetezca.",
  "Brainrot o progreso. Elige."
];

let usageTimer = null;

let data = JSON.parse(localStorage.getItem("unrot3")) || {
  tasks: [],
  time: 0,
  earned: 0,
  spent: 0,
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  dailyGoal: 30,
  weeklyGoal: 150,
  cooldownUntil: 0,
  lastTimestamp: Date.now()
};

function today() {
  return new Date().toDateString();
}

function save() {
  localStorage.setItem("unrot3", JSON.stringify(data));
}

/* ───────────── ANTITRAMPAS BÁSICA ───────────── */
function checkTimeManipulation() {
  if (Date.now() < data.lastTimestamp) {
    lock("Manipulación de hora detectada.");
    return true;
  }
  data.lastTimestamp = Date.now();
  save();
  return false;
}
const lockScreen = document.getElementById("lockScreen");

lockScreen.addEventListener("touchstart", () => {
  pressTimer = setTimeout(() => {
    locked = false;
    lockScreen.style.display = "none";
  }, 3000);
});

lockScreen.addEventListener("touchend", () => {
  clearTimeout(pressTimer);
});

/* ───────────── RESET DIARIO DURO ───────────── */
function dailyCheck() {
  if (data.lastDay && data.lastDay !== today()) {
    data.tasks = [];
    data.time = Math.max(0, data.time - 30); // castigo
    data.streak = Math.max(0, data.streak - 1);
    save();
  }
}

/* ───────────── TAREAS ───────────── */
function addTask() {
  if (data.tasks.length >= 5) {
    alert("Demasiadas tareas.");
    return;
  }

  const n = taskName.value.trim();
  const m = +taskMinutes.value;

  if (!n || m <= 0) return;

  data.tasks.push({ n, m });
  save();
  render();
}

function completeTask(i) {
  if (checkTimeManipulation()) return;

  const base = data.tasks[i].m;
  const difficulty = Math.max(0.7, 1 - data.streak * 0.02);
  const reward = Math.floor(base * difficulty);

  data.time += reward;
  data.earned += reward;

  if (data.lastDay !== today()) {
    data.streak++;
    data.bestStreak = Math.max(data.bestStreak, data.streak);
    data.lastDay = today();
  }

  navigator.vibrate?.(100);

  // 🔗 DISPARADOR REAL iOS
  window.location.href =
    "shortcuts://run-shortcut?name=TAREA_COMPLETADA";

  data.tasks.splice(i, 1);
  save();
  render();
}

/* ───────────── USO DE TIEMPO (SIN BUGS) ───────────── */
function startUsage() {
  if (usageTimer) return; // ⛔ evita múltiples intervalos

  if (checkTimeManipulation()) return;

  if (Date.now() < data.cooldownUntil) {
    lock("Cooldown activo. Espera.");
    return;
  }

  if (data.time <= 0 || data.tasks.length === 0) {
    hardlock("No tienes tiempo o tareas reales.");
    navigator.vibrate?.([200, 100, 200]);
    return;
  }

  hideLock();

  usageTimer = setInterval(() => {
    if (data.time <= 0) return;

    data.time--;
    data.spent++;

    if (data.time === 0) {
      clearInterval(usageTimer);
      usageTimer = null;
      data.cooldownUntil = Date.now() + 10 * 60000;
      lock("Tiempo agotado.");
    }

    save();
    render();
  }, 60000);
}

/* ───────────── BLOQUEO ───────────── */
function lock(msg) {
  lockMsg.textContent = msg;
  lock.classList.remove("hidden");
  lock.style.pointerEvents = "none"; // permite interactuar con la app
}
function hardLock(msg) {
  lockMsg.textContent = msg;
  lock.classList.remove("hidden");
  lock.style.pointerEvents = "auto"; // bloqueo total
}

function hideLock() {
  lock.classList.add("hidden");
}

/* ───────────── IMPORT / EXPORT ───────────── */
function exportData() {
  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "unrot-backup.json";
  a.click();
}

function importData(e) {
  const file = e.target.files[0];
  const r = new FileReader();
  r.onload = () => {
    data = JSON.parse(r.result);
    save();
    render();
  };
  r.readAsText(file);
}

/* ───────────── RENDER ───────────── */
function render() {
  dailyCheck();

  if (Date.now() < data.cooldownUntil) {
    lock("Cooldown activo. Espera.");
  }

  quote.textContent =
    quotes[Math.floor(Math.random() * quotes.length)];

  streak.textContent = `🔥 Racha: ${data.streak}`;
  earned.textContent = data.earned;
  spent.textContent = data.spent;
  bestStreak.textContent = data.bestStreak;
  timeAllowed.textContent = `${data.time} min`;

  bar.style.width = Math.min(data.time, 60) + "%";

  taskList.innerHTML = "";
  data.tasks.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.n} (${t.m}m)
      <button onclick="completeTask(${i})">✔</button>
    `;
    taskList.appendChild(li);
  });
}

/* ───────────── ARRANQUE ───────────── */
window.addEventListener("load", () => {
  if (Date.now() < data.cooldownUntil) {
    lock("Cooldown activo. Espera.");
  }
  render();
});
