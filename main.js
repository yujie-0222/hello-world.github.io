const PAGE_LINKS = [
    { href: "index.html", label: "回到首頁", key: "home" },
    { href: "breakfast.html", label: "早餐吃什麼", key: "breakfast" },
    { href: "lunch.html", label: "午餐吃什麼", key: "lunch" },
    { href: "dinner.html", label: "晚餐吃什麼", key: "dinner" },
    { href: "todo.html", label: "代辦事項", key: "todo" },
    { href: "work.html", label: "好想下班", key: "work" },
    { href: "game.html", label: "我要玩遊戲", key: "game" },
    { href: "relax.html", label: "放鬆球球", key: "relax" },
    { href: "fish.html", label: "魚兒魚兒水中游", key: "fish" },
    { href: "about.html", label: "關於我和這個網站", key: "about" }
];

const STORAGE_KEYS = {
    todo: "cozy-home-tasks",
    game: "cozy-home-clicker-best",
    work: "cozy-home-work-settings"
};

document.addEventListener("DOMContentLoaded", () => {
    initShell();
    initClock();
    initHotspots();
    initWheel();
    initTodo();
    initWork();
    initGame();
    initRelax();
    initFish();
    syncCurrentMealLink();
});

function initShell() {
    const shell = document.querySelector(".site-shell");
    const sidebar = document.querySelector("[data-sidebar]");
    const toggle = document.querySelector("[data-menu-toggle]");
    const activeKey = document.body.dataset.page;

    if (sidebar) {
        sidebar.innerHTML = `
            <nav class="sidebar-nav">
                ${PAGE_LINKS.map((link) => `
                    <a class="sidebar-link ${activeKey === link.key ? "is-active" : ""}" href="${link.href}">
                        ${link.label}
                    </a>
                `).join("")}
            </nav>
        `;
    }

    if (!shell || !toggle) {
        return;
    }

    toggle.addEventListener("click", () => {
        const willOpen = !shell.classList.contains("menu-open");
        shell.classList.toggle("menu-open", willOpen);
        toggle.setAttribute("aria-expanded", String(willOpen));
    });

    document.addEventListener("click", (event) => {
        const clickedInsideSidebar = sidebar?.contains(event.target);
        const clickedToggle = toggle.contains(event.target);
        if (!clickedInsideSidebar && !clickedToggle) {
            shell.classList.remove("menu-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            shell.classList.remove("menu-open");
            toggle.setAttribute("aria-expanded", "false");
        }
    });
}

function initClock() {
    const clockNodes = document.querySelectorAll("[data-clock]");
    if (!clockNodes.length) {
        return;
    }

    const renderClock = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const output = `${hours}:${minutes}:${seconds}`;
        clockNodes.forEach((node) => {
            node.textContent = output;
        });
    };

    renderClock();
    window.setInterval(renderClock, 1000);
}

function initHotspots() {
    document.querySelectorAll("[data-link]").forEach((node) => {
        node.addEventListener("click", () => {
            window.location.href = node.dataset.link;
        });
    });

    document.querySelectorAll("[data-meal-link]").forEach((node) => {
        node.addEventListener("click", () => {
            window.location.href = getMealPageByTime();
        });
    });
}

function syncCurrentMealLink() {
    document.querySelectorAll("[data-current-meal]").forEach((node) => {
        node.setAttribute("href", getMealPageByTime());
    });
}

function getMealPageByTime(date = new Date()) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const minutesNow = hour * 60 + minute;

    if (minutesNow >= 4 * 60 && minutesNow <= 10 * 60 + 59) {
        return "breakfast.html";
    }

    if (minutesNow >= 11 * 60 && minutesNow <= 15 * 60 + 59) {
        return "lunch.html";
    }

    return "dinner.html";
}

function initWheel() {
    const app = document.querySelector("[data-wheel-app]");
    if (!app) {
        return;
    }

    const wheel = app.querySelector("[data-wheel]");
    const list = app.querySelector("[data-wheel-options]");
    const input = app.querySelector("[data-wheel-input]");
    const addButton = app.querySelector("[data-wheel-add]");
    const spinButton = app.querySelector("[data-spin]");
    const wheelKey = app.dataset.wheelKey;
    const storageKey = `cozy-home-wheel-${wheelKey}`;
    const maxOptions = 8;
    let options = readJson(storageKey, [])
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => item.trim().slice(0, 12))
        .slice(0, maxOptions);
    let spinning = false;
    let flashTimer = null;

    const saveOptions = () => {
        localStorage.setItem(storageKey, JSON.stringify(options));
    };

    const renderWheel = () => {
        wheel.innerHTML = "";
        const center = document.createElement("div");
        center.className = "meal-wheel-center";
        center.innerHTML = `<div class="meal-wheel-center-text">${options.length ? "" : "先輸入選項"}</div>`;
        wheel.appendChild(center);
    };

    const renderList = () => {
        list.innerHTML = "";
        if (!options.length) {
            addButton.disabled = false;
            return;
        }

        options.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = "meal-option-item";
            li.innerHTML = `
                <span class="meal-option-text">${escapeHtml(item)}</span>
                <button class="meal-remove-btn" type="button" aria-label="刪除 ${escapeHtml(item)}">×</button>
            `;
            li.querySelector(".meal-remove-btn").addEventListener("click", () => {
                options.splice(index, 1);
                saveOptions();
                renderList();
                renderWheel();
            });
            list.appendChild(li);
        });

        addButton.disabled = options.length >= maxOptions;
    };

    const addOption = () => {
        const value = input.value.trim();
        if (!value || options.length >= maxOptions) {
            input.focus();
            return;
        }

        options.push(value.slice(0, 12));
        input.value = "";
        saveOptions();
        renderList();
        renderWheel();
        input.focus();
    };

    addButton?.addEventListener("click", addOption);
    input?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addOption();
        }
    });

    spinButton?.addEventListener("click", () => {
        if (!options.length || spinning) {
            return;
        }

        spinning = true;
        spinButton.disabled = true;
        const centerText = wheel.querySelector(".meal-wheel-center-text");
        const flashes = Math.max(10, Math.min(16, options.length * 2));
        let flashCount = 0;

        if (flashTimer) {
            window.clearInterval(flashTimer);
            flashTimer = null;
        }

        flashTimer = window.setInterval(() => {
            const randomText = options[Math.floor(Math.random() * options.length)];
            centerText.textContent = randomText;
            centerText.classList.remove("is-flashing");
            void centerText.offsetWidth;
            centerText.classList.add("is-flashing");
            flashCount += 1;
        }, 120);

        window.setTimeout(() => {
            window.clearInterval(flashTimer);
            flashTimer = null;
            const winnerIndex = Math.floor(Math.random() * options.length);
            centerText.textContent = options[winnerIndex];
            centerText.classList.remove("is-flashing");
            spinning = false;
            spinButton.disabled = false;
            if (flashCount < flashes) {
                // no-op, just keeps intent clear for the 2-second blind-box effect
            }
        }, 2000);
    });

    renderList();
    renderWheel();
}

function initTodo() {
    const todoRoot = document.querySelector("[data-todo-app]");
    if (!todoRoot) {
        return;
    }

    const titleInput = todoRoot.querySelector("[data-task-title]");
    const addButton = todoRoot.querySelector("[data-add-task]");
    const clearButton = todoRoot.querySelector("[data-clear-tasks]");
    const list = todoRoot.querySelector("[data-task-list]");
    const empty = todoRoot.querySelector("[data-task-empty]");
    let tasks = readJson(STORAGE_KEYS.todo, []);

    const saveTasks = () => localStorage.setItem(STORAGE_KEYS.todo, JSON.stringify(tasks));

    const renderTasks = () => {
        list.innerHTML = "";
        empty.style.display = tasks.length ? "none" : "block";

        tasks.forEach((task) => {
            const item = document.createElement("li");
            item.className = `todo-paper-item ${task.done ? "is-done" : ""}`;
            item.innerHTML = `
                <input class="todo-paper-check" type="checkbox" ${task.done ? "checked" : ""} aria-label="完成待辦">
                <span class="todo-paper-text">${escapeHtml(task.title)}</span>
            `;

            item.querySelector(".todo-paper-check").addEventListener("change", (event) => {
                task.done = event.target.checked;
                saveTasks();
                renderTasks();
            });

            list.appendChild(item);
        });
    };

    addButton?.addEventListener("click", () => {
        const title = titleInput.value.trim();
        if (!title) {
            titleInput.focus();
            return;
        }

        tasks.push({
            id: crypto.randomUUID(),
            title,
            done: false,
            createdAt: Date.now()
        });
        saveTasks();
        titleInput.value = "";
        renderTasks();
        titleInput.focus();
    });

    titleInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            addButton?.click();
        }
    });

    clearButton?.addEventListener("click", () => {
        tasks = [];
        saveTasks();
        renderTasks();
        titleInput.focus();
    });

    renderTasks();
}

function initWork() {
    const workRoot = document.querySelector("[data-work-app]");
    if (!workRoot) {
        return;
    }

    const form = workRoot.querySelector("[data-work-form]");
    const dashboardView = workRoot.querySelector("[data-work-dashboard]");
    const setupView = workRoot.querySelector("[data-work-setup]");
    const topStrip = workRoot.querySelector("[data-work-top-strip]");
    const openSetupButton = workRoot.querySelector("[data-open-work-setup]");
    const closeSetupButton = workRoot.querySelector("[data-close-work-setup]");
    const wageInput = workRoot.querySelector("[name='hourlyWage']");
    const startInput = workRoot.querySelector("[name='startTime']");
    const endInput = workRoot.querySelector("[name='endTime']");
    const remainingDisplay = workRoot.querySelector("[data-remaining-display]");
    const earnedDisplay = workRoot.querySelector("[data-earned-display]");
    const minuteGain = workRoot.querySelector("[data-minute-gain]");
    const resetButton = workRoot.querySelector("[data-work-reset]");
    const resetInlineButton = workRoot.querySelector("[data-work-reset-inline]");

    let minuteTimer = null;
    let gainTimer = null;

    const stored = readJson(STORAGE_KEYS.work, {
        hourlyWage: 190,
        startTime: "09:00",
        endTime: "18:00",
        isRunning: false
    });

    wageInput.value = stored.hourlyWage || "";
    startInput.value = stored.startTime || "";
    endInput.value = stored.endTime || "";

    const openSetup = () => {
        setupView.hidden = false;
        window.setTimeout(() => wageInput.focus(), 40);
    };

    const closeSetup = () => {
        setupView.hidden = true;
    };

    const saveSettings = (isRunning) => {
        const payload = {
            hourlyWage: Number(wageInput.value) || 0,
            startTime: startInput.value,
            endTime: endInput.value,
            isRunning
        };
        localStorage.setItem(STORAGE_KEYS.work, JSON.stringify(payload));
        return payload;
    };

    const clearWorkForm = () => {
        form.reset();
        wageInput.value = "";
        startInput.value = "";
        endInput.value = "";
    };

    const showGain = (amount) => {
        minuteGain.textContent = `+ ${formatGain(amount)}`;
        minuteGain.classList.remove("show");
        void minuteGain.offsetWidth;
        minuteGain.classList.add("show");
    };

    const calculateWorkState = () => {
        const wage = Number(wageInput.value) || 0;
        const start = toMinutes(startInput.value);
        const end = toMinutes(endInput.value);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const { workedMinutes, remainingMinutes } = getWorkProgress(nowMinutes, start, end);
        const minuteWage = wage / 60;
        const earned = workedMinutes * minuteWage;

        remainingDisplay.textContent = `再過 ${formatWorkCountdown(remainingMinutes)} 就可以下班啦`;
        earnedDisplay.textContent = `今天已經賺到了${Math.floor(earned)}元`;
    };

    const clearWorkTimers = () => {
        if (minuteTimer) {
            window.clearTimeout(minuteTimer);
            minuteTimer = null;
        }
        if (gainTimer) {
            window.clearTimeout(gainTimer);
            gainTimer = null;
        }
    };

    const scheduleMinuteLoop = () => {
        clearWorkTimers();
        calculateWorkState();

        const runNext = () => {
            calculateWorkState();
            showGain((Number(wageInput.value) || 0) / 60);
            minuteTimer = window.setTimeout(runNext, 60000);
        };

        const now = new Date();
        const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        gainTimer = window.setTimeout(runNext, delay <= 0 ? 60000 : delay);
    };

    const setRunningState = (isRunning) => {
        dashboardView.classList.toggle("is-idle", !isRunning);
        dashboardView.classList.toggle("is-running", isRunning);
        resetButton.disabled = !isRunning;
        closeSetup();
    };

    const resetToIdle = () => {
        clearWorkTimers();
        clearWorkForm();
        localStorage.setItem(STORAGE_KEYS.work, JSON.stringify({
            hourlyWage: 0,
            startTime: "",
            endTime: "",
            isRunning: false
        }));
        setRunningState(false);
        minuteGain.classList.remove("show");
    };

    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) {
            return;
        }
        saveSettings(true);
        setRunningState(true);
        scheduleMinuteLoop();
    });

    openSetupButton?.addEventListener("click", openSetup);
    closeSetupButton?.addEventListener("click", closeSetup);
    resetInlineButton?.addEventListener("click", () => {
        clearWorkForm();
        localStorage.setItem(STORAGE_KEYS.work, JSON.stringify({
            hourlyWage: 0,
            startTime: "",
            endTime: "",
            isRunning: false
        }));
    });
    resetButton?.addEventListener("click", resetToIdle);

    if (stored.isRunning && stored.hourlyWage && stored.startTime && stored.endTime) {
        setRunningState(true);
        scheduleMinuteLoop();
    } else {
        setRunningState(false);
        closeSetup();
    }
}

function initGame() {
    const gameRoot = document.querySelector("[data-clicker-game]");
    if (!gameRoot) {
        return;
    }

    const target = gameRoot.querySelector("[data-target]");
    const scoreNode = gameRoot.querySelector("[data-score]");
    const bestNode = gameRoot.querySelector("[data-best-score]");
    const timeNode = gameRoot.querySelector("[data-time-left]");
    const statusNode = gameRoot.querySelector("[data-game-status]");
    const area = gameRoot.querySelector("[data-clicker-area]");
    const start = gameRoot.querySelector("[data-start-game]");
    const reset = gameRoot.querySelector("[data-reset-game]");
    let score = 0;
    let timeLeft = 30;
    let running = false;
    let timer = null;
    let best = Number(localStorage.getItem(STORAGE_KEYS.game) || 0);
    bestNode.textContent = String(best);
    timeNode.textContent = String(timeLeft);

    const moveTarget = () => {
        const areaRect = area.getBoundingClientRect();
        const targetSize = target.offsetWidth || 112;
        const left = 30 + Math.random() * Math.max(areaRect.width - targetSize - 60, 0);
        const top = 90 + Math.random() * Math.max(areaRect.height - targetSize - 130, 0);
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
    };

    const refresh = () => {
        scoreNode.textContent = String(score);
        bestNode.textContent = String(best);
        timeNode.textContent = String(timeLeft);
    };

    const spawnScore = (value) => {
        const label = document.createElement("div");
        label.className = "game-floating-plus";
        label.textContent = `+${value}`;
        label.style.left = target.style.left;
        label.style.top = target.style.top;
        area.appendChild(label);
        window.setTimeout(() => label.remove(), 880);
    };

    const endGame = () => {
        running = false;
        window.clearInterval(timer);
        timer = null;
        target.hidden = true;
        statusNode.textContent = `時間到，這次拿到 ${score} 分`;
        start.disabled = false;
        refresh();
    };

    const startGame = () => {
        score = 0;
        timeLeft = 30;
        running = true;
        target.hidden = false;
        start.disabled = true;
        statusNode.textContent = "快點擊餅乾加分";
        refresh();
        moveTarget();

        window.clearInterval(timer);
        timer = window.setInterval(() => {
            timeLeft -= 1;
            refresh();
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    };

    target.addEventListener("click", () => {
        if (!running) {
            return;
        }

        const gained = 1;
        score += gained;
        best = Math.max(best, score);
        localStorage.setItem(STORAGE_KEYS.game, String(best));

        target.classList.remove("bump");
        void target.offsetWidth;
        target.classList.add("bump");
        spawnScore(gained);
        moveTarget();
        refresh();
    });

    start?.addEventListener("click", startGame);

    reset?.addEventListener("click", () => {
        window.clearInterval(timer);
        timer = null;
        running = false;
        score = 0;
        timeLeft = 30;
        target.hidden = true;
        statusNode.textContent = "按下開始遊戲";
        start.disabled = false;
        refresh();
    });

    refresh();
    target.hidden = true;
    window.addEventListener("resize", moveTarget);
}

function initRelax() {
    const textNode = document.querySelector("[data-relax-text]");
    if (!textNode) {
        return;
    }

    const messages = [
        "吸氣 4 秒，讓肩膀慢慢放鬆。",
        "吐氣時想像今天的壓力一起離開。",
        "現在的你，已經很努力了。",
        "先專心照顧自己，再繼續往前。"
    ];

    let index = 0;
    textNode.textContent = messages[index];
    window.setInterval(() => {
        index = (index + 1) % messages.length;
        textNode.textContent = messages[index];
    }, 5000);
}

function initFish() {
    const feedButton = document.querySelector("[data-feed-fish]");
    const moodNode = document.querySelector("[data-fish-mood]");
    if (!feedButton || !moodNode) {
        return;
    }

    const moods = [
        "小魚今天看起來很悠哉。",
        "牠們游得更有精神了。",
        "魚缸裡冒出一串滿足的小泡泡。",
        "今天的魚缸氣氛非常平靜。"
    ];

    feedButton.addEventListener("click", () => {
        const mood = moods[Math.floor(Math.random() * moods.length)];
        moodNode.textContent = mood;
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        maximumFractionDigits: 0
    }).format(value);
}

function formatDuration(minutes) {
    const total = Math.max(Math.round(minutes), 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours} 小時 ${mins} 分`;
}

function formatWorkCountdown(minutes) {
    const total = Math.max(Math.round(minutes), 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}小時${mins}分鐘`;
}

function formatGain(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getWorkProgress(nowMinutes, start, end) {
    const fullDay = 24 * 60;
    const totalMinutes = end > start ? end - start : fullDay - start + end;

    if (end > start) {
        if (nowMinutes < start) {
            return {
                workedMinutes: 0,
                remainingMinutes: end - nowMinutes
            };
        }

        if (nowMinutes >= end) {
            return {
                workedMinutes: totalMinutes,
                remainingMinutes: 0
            };
        }

        return {
            workedMinutes: nowMinutes - start,
            remainingMinutes: end - nowMinutes
        };
    }

    if (nowMinutes >= start) {
        return {
            workedMinutes: nowMinutes - start,
            remainingMinutes: fullDay - nowMinutes + end
        };
    }

    if (nowMinutes < end) {
        return {
            workedMinutes: fullDay - start + nowMinutes,
            remainingMinutes: end - nowMinutes
        };
    }

    return {
        workedMinutes: 0,
        remainingMinutes: start - nowMinutes + totalMinutes
    };
}

function toMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
