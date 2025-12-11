// LOCAL STORAGE
let data = [];
const allowStorage = localStorage.getItem("allowStorage");

const simpleBtn = document.getElementById("modeSimple");
const advBtn = document.getElementById("modeAdvanced");
const tbody = document.querySelector("#statsTable tbody");
const summary = document.querySelector("#summary");
const form = document.getElementById("formSeason");
const tutorialBtn = document.getElementById("tutorial");
const tutorialContent = document.getElementById("tutorialContent");
const toggleButton = document.getElementById('theme-toggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme');
const icon = toggleButton.querySelector("i");
const btnShareTable = document.querySelector("#shareTable");
const btnShareGraphics = document.querySelector("#shareGraphics");

function showPopup() {
    if (allowStorage === null) {
        document.getElementById("popupSave").style.display = "flex";
    }
    loadFromStorage();
}

function acceptStorage() {
    localStorage.setItem("allowStorage", "true");
    document.getElementById("popupSave").style.display = "none";
    saveToStorage();
}

function denyStorage() {
    document.getElementById("popupSave").style.display = "none";
}

function saveToStorage() {
    if (localStorage.getItem("allowStorage") === "true") {
        localStorage.setItem("seasonData", JSON.stringify(data));
    }
}

function loadFromStorage() {
    const saved = localStorage.getItem("seasonData");
    if (saved) {
        updateStatsVisibility();
        data = JSON.parse(saved);
        renderTable();
    }
}

function clearStorage() {
    localStorage.removeItem("seasonData");
    data = [];
    renderTable();
    updateStatsVisibility();
}


// BASIC FUNCTIONS (KDA, WINRATE, ETC.)
function KDA(kills, assists, deaths) { return (kills + assists) / deaths; }
function WinRate(played, wins) { return (wins / played) * 100; }
function HPM(healing, min) { return healing / min; }
function DPM(damage, min) { return damage / min; }
function SRatio(healing, damage) { return healing / damage; }
function SupportImpact(healing, assists, deaths) { return (healing / 1000 + assists) / deaths; }
function ObjectiveFocus(timeOnObj, totalTime) { return (timeOnObj / totalTime) * 100; }

function convertToSeconds(value, unit) {
    if (unit === "h") return value * 3600;
    if (unit === "m") return value * 60;
    return value;
}


// RENDER TABLE + SUMMARY
function fmtNum(value, digits = 2) {
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
        return "0,00";
    }

    if (digits === 0) {
        return Number(value)
            .toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    return fmt(Number(value).toFixed(digits), digits);
}

function renderTable() {
    tbody.innerHTML = "";
    if (data.length === 0) return;

    const sortedData = [...data].sort((a, b) => a.season - b.season);

    const bestKDA = sortedData.reduce((a, b) => {
        const aVal = (a.kda === 0) ? Infinity : a.kda;
        const bVal = (b.kda === 0) ? Infinity : b.kda;
        return aVal > bVal ? a : b;
    });
    const worstKDA = sortedData.reduce((a, b) => {
        const aVal = (a.kda === 0) ? Infinity : a.kda;
        const bVal = (b.kda === 0) ? Infinity : b.kda;
        return aVal < bVal ? a : b;
    });
    const bestWR = sortedData.reduce((a, b) => a.winrate > b.winrate ? a : b);
    const worstWR = sortedData.reduce((a, b) => a.winrate < b.winrate ? a : b);

    sortedData.forEach(d => {
        let rowClass = "";

        if (d === bestKDA) rowClass += " best-kda ";
        if (d === worstKDA) rowClass += " worst-kda ";
        if (d === bestWR) rowClass += " best-wr ";
        if (d === worstWR) rowClass += " worst-wr ";

        const row = `
            <tr class="${rowClass}">
                <td><button class="edit-btn" data-index="${data.indexOf(d)}">Editar</button></td>
                <td>${d.season}</td>
                <td>${(d.kda == null || d.kda === 0) ? "Infinito" : fmtNum(d.kda)}</td>
                <td>${fmtNum(d.winrate)}</td>
                <td class="col-adv">${fmtNum(d.hpm, 1)}</td>
                <td class="col-adv">${fmtNum(d.dpm, 1)}</td>
                <td class="col-adv">${fmtNum(d.sratio)}</td>
                <td class="col-adv">${fmtNum(d.impact)}</td>
                <td>${fmtNum(d.obj)}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });

    renderSummary();
    renderComparison();
    updateStatsVisibility();
    setSimpleMode();
}

function renderSummary() {
    if (data.length === 0) {
        summary.innerHTML = "<p>Aún no hay temporadas añadidas.</p>";
        return;
    }

    const bestKDA = data.reduce((a, b) => {
        const aVal = (a.kda === 0) ? Infinity : a.kda;
        const bVal = (b.kda === 0) ? Infinity : b.kda;
        return aVal > bVal ? a : b;
    });

    const worstKDA = data.reduce((a, b) => {
        const aVal = (a.kda === 0) ? Infinity : a.kda;
        const bVal = (b.kda === 0) ? Infinity : b.kda;
        return aVal < bVal ? a : b;
    });

    const bestWR = data.reduce((a, b) => a.winrate > b.winrate ? a : b);
    const worstWR = data.reduce((a, b) => a.winrate < b.winrate ? a : b);

    summary.innerHTML = `
        <h2>Resumen</h2>

        <p>🏆 Mejor KDA: 
            S${bestKDA.season} 
            (${(bestKDA.kda == null || bestKDA.kda === 0) ? "Infinito" : fmtNum(bestKDA.kda, 2)})
        </p>

        <p>💀 Peor KDA: 
            S${worstKDA.season} 
            (${(worstKDA.kda == null || worstKDA.kda === 0) ? "Infinito" : fmtNum(worstKDA.kda, 2)})
        </p>

        <p>🏅 Mejor WinRate: 
            S${bestWR.season} (${fmtNum(bestWR.winrate)}%)
        </p>

        <p>❌ Peor WinRate: 
            S${worstWR.season} (${fmtNum(worstWR.winrate)}%)
        </p>
    `;
}

// EDIT SEASON
let editingIndex = null;

function loadSeasonIntoForm(index) {
    const s = data[index];
    editingIndex = index;

    document.getElementById("season").value = s.season;
    document.getElementById("kills").value = s.kills;
    document.getElementById("assists").value = s.assists;
    document.getElementById("deaths").value = s.deaths;
    document.getElementById("played").value = s.played;
    document.getElementById("wins").value = s.wins;
    document.getElementById("healing").value = s.healing;
    document.getElementById("damage").value = s.damage;

    const unitObj = s.timeOnObjUnit || "s";
    const unitTotal = s.totalTimeUnit || "s";

    let rawObj = s.timeOnObj;
    let rawTotal = s.totalTime;

    if (unitObj === "h") rawObj /= 3600;
    else if (unitObj === "m") rawObj /= 60;

    if (unitTotal === "h") rawTotal /= 3600;
    else if (unitTotal === "m") rawTotal /= 60;

    document.getElementById("timeOnObj").value = rawObj;
    document.getElementById("timeOnObjUnit").value = unitObj;
    document.getElementById("totalTime").value = rawTotal;
    document.getElementById("totalTimeUnit").value = unitTotal;

    document.getElementById("saveBtn").textContent = "Guardar Cambios";
    document.getElementById("deleteBtn").style.display = "block";

    document.querySelectorAll(".section-content").forEach(sec => sec.style.display = "flex");

    document.querySelector(".card").scrollIntoView({ behavior: "smooth" });
}

function clearForm() {
    document.getElementById("formSeason").reset();
    document.getElementById("timeOnObjUnit").value = "s";
    document.getElementById("totalTimeUnit").value = "s";
    document.getElementById("deleteBtn").style.display = "none";
    document.getElementById("saveBtn").textContent = "Agregar Temporada";

    document.querySelectorAll(".section-content").forEach(sec => sec.style.display = "none");

    editingIndex = null;
}


// ADD SEASON
form.addEventListener("submit", e => {
    e.preventDefault();

    const season = +document.getElementById("season").value;
    const kills = +document.getElementById("kills").value;
    const assists = +document.getElementById("assists").value;
    const deaths = +document.getElementById("deaths").value;
    const played = +document.getElementById("played").value || 0;
    const wins = +document.getElementById("wins").value || 0;

    if (wins > played) {
        alert("❌ Las victorias no pueden ser mayores que las partidas jugadas.");
        return;
    }

    const healing = +document.getElementById("healing").value || 0;
    const damage = +document.getElementById("damage").value || 0;

    const rawTimeOnObj = +document.getElementById("timeOnObj").value || 0;
    const rawTotalTime = +document.getElementById("totalTime").value || 1;

    const timeOnObjUnit = document.getElementById("timeOnObjUnit").value;
    const totalTimeUnit = document.getElementById("totalTimeUnit").value;

    const timeOnObj = convertToSeconds(rawTimeOnObj, timeOnObjUnit);
    const totalTime = convertToSeconds(rawTotalTime, totalTimeUnit);


    if (timeOnObj > totalTime) {
        alert("❌ El tiempo en objetivo no puede ser mayor que el tiempo total jugado.");
        return;
    }
    const minutes = totalTime / 60;

    const entry = {
        season, kills, assists, deaths,
        played, wins, healing, damage,

        rawTimeOnObj, rawTotalTime,
        timeOnObjUnit, totalTimeUnit,

        timeOnObj, totalTime,

        kda: KDA(kills, assists, deaths),
        winrate: WinRate(played, wins),
        hpm: HPM(healing, minutes),
        dpm: DPM(damage, minutes),
        sratio: SRatio(healing, damage),
        impact: SupportImpact(healing, assists, deaths),
        obj: ObjectiveFocus(timeOnObj, totalTime)
    };

    if (editingIndex !== null) {
        data[editingIndex] = entry;
        editingIndex = null;
        document.getElementById("saveBtn").textContent = "Agregar Temporada";
    } else {
        data.push(entry);
    }

    alert("Temporada agregada / actualizada!");

    renderTable();
    saveToStorage();
    clearForm();
    updateStatsVisibility();
    renderSingleChart();

    const openSection = document.querySelector(".open");
    if (openSection) openSection.style.display = "flex";
});


// COMPARISON BETWEEN SEASONS
function renderComparison() {
    if (data.length < 2) {
        comparisonText.innerHTML = "<p>No hay suficientes temporadas para comparar.</p>";
        return;
    }

    const sortedData = [...data].sort((a, b) => a.season - b.season);

    const current = sortedData.at(-1);
    const prev1 = sortedData.at(-2);
    const prev2 = sortedData.length >= 3 ? sortedData.at(-3) : null;

    let html = `<p>Comparando la temporada <strong>${current.season}</strong> con:</p><ul>`;

    html += generateComparisonBlock("1 temporada atrás", prev1, current);

    if (prev2) {
        html += generateComparisonBlock("2 temporadas atrás", prev2, current);
    }

    html += "</ul>";

    comparisonText.innerHTML = html;
}

function generateComparisonBlock(label, past, current) {
    return `
        <li>📌 <strong>${label} (S${past.season})</strong>
            <ul>
                ${compareMetric("KDA", current.kda, past.kda)}
                ${compareMetric("Win Rate", current.winrate, past.winrate)}
                ${compareMetric("Curación por minuto", current.hpm, past.hpm)}
                ${compareMetric("Daño por minuto", current.dpm, past.dpm)}
                ${compareMetric("Curación/Daño", current.sratio, past.sratio)}
                ${compareMetric("Impacto", current.impact, past.impact)}
                ${compareMetric("Objetivo (%)", current.obj, past.obj)}
            </ul>
        </li>
    `;
}


// RECOMMENDATIONS
function getRecommendation(name, improved) {
    const tips = {
        "KDA": {
            bad: "Moriste más de lo necesario. Intentá reposicionarte mejor y evitar duelos innecesarios.",
            good: "Buen posicionamiento. Seguí jugando cerca de cobertura y rotando con tu equipo."
        },
        "Win Rate": {
            bad: "Tu impacto o picks quizá no se adaptaron bien. Revisá composición y timings de ultimate.",
            good: "Buena toma de decisiones y adaptación de picks. Seguí así."
        },
        "Curación por minuto": {
            bad: "Curaste menos de lo esperado. Priorizá mejor los targets en riesgo y usá cooldowns con más eficiencia.",
            good: "Gran eficiencia de curación. Aprovechá momentos seguros para aportar daño."
        },
        "Daño por minuto": {
            bad: "Faltó daño cuando era seguro. Buscá ventanas donde tu equipo esté estable para sumar presión.",
            good: "Buen daño seguro. Seguí presionando cuando no haya urgencia de curar."
        },
        "Curación/Daño": {
            bad: "Te falta equilibrio: quizá estás curando demasiado o dañando demasiado según la situación.",
            good: "Buen equilibrio entre curación y daño."
        },
        "Impacto": {
            bad: "Impacto bajo: tratá de participar más en kills y usar habilidades con mayor valor.",
            good: "Gran impacto: estás aportando en casi todas las peleas."
        },
        "Objetivo (%)": {
            bad: "Tu posición en el objetivo no fue ideal.",
            good: "Buenas rotaciones entre backline y objetivo."
        }
    };

    const tooltipWords = {
        "rotando": "Implica moverte con tu equipo de una zona a otra.",
        "rotar": "Implica moverte con tu equipo de una zona a otra.",
        "picks": "Elecciones de héroe según la situación y composición.",
        "ultimate": "Habilidad máxima del héroe, usada para cambiar o asegurar peleas.",
        "cooldowns": "Tiempos de espera antes de poder volver a usar habilidades.",
        "backline": "Zona trasera del equipo donde juegan supports y DPS de poca movilidad."
    };

    function applyTooltips(text) {
        for (const word in tooltipWords) {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            text = text.replace(regex, `<span class="t" data-tip="${tooltipWords[word]}">${word}</span>`);
        }
        return text;
    }

    const baseText = improved ? tips[name].good : tips[name].bad;
    return applyTooltips(baseText);
}

function compareMetric(name, current, past) {
    const diff = (current - past).toFixed(2);

    if (diff > 0) {
        return `
            <li>
                <span class="green">✔ Mejoraste</span> en <strong>${name}</strong> (${diff})
                <br><span class="tip">👉 ${getRecommendation(name, true)}</span>
            </li>
        `;
    } else if (diff < 0) {
        return `
            <li>
                <span class="red">✘ Empeoraste</span> en <strong>${name}</strong> (${diff})
                <br><span class="tip">👉 ${getRecommendation(name, false)}</span>
            </li>
        `;
    } else {
        return `
            <li>
                <span class="neutral">• No cambió</span> en <strong>${name}</strong>
                <br><span class="tip">👉 Jugá de manera consistente para seguir progresando.</span>
            </li>
        `;
    }
}


// VISIBILITY OF THE STATE
function updateStatsVisibility() {
    const saved = JSON.parse(localStorage.getItem("seasonData") || "[]");
    const stats = document.getElementById("stats-containers");
    const noSeasons = document.getElementById("noSeasons");

    if (data.length > 0 || saved.length > 0) {
        noSeasons.style.display = "none";
        stats.style.display = "block";
    } else {
        noSeasons.style.display = "block";
        stats.style.display = "none";
    }
}

updateStatsVisibility();
showPopup();


// GENERAL EVENTS
document.getElementById("popupSave").addEventListener("click", (e) => {
    if (e.target === document.getElementById("popupSave")) {
        document.getElementById("popupSave").style.display = "none";
    }
});

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("edit-btn")) {
        const index = e.target.dataset.index;
        loadSeasonIntoForm(index);
    }
});

document.getElementById("deleteBtn").addEventListener("click", () => {
    if (editingIndex === null) return;

    const seasonNumber = data[editingIndex].season;
    const ok = confirm(`¿Seguro que querés eliminar la temporada ${seasonNumber}?`);
    if (!ok) return;

    data.splice(editingIndex, 1);
    editingIndex = null;

    saveToStorage();
    updateStatsVisibility();
    renderTable();
    clearForm();
    renderSingleChart();
});


// UNIT BUTTONS
document.querySelectorAll(".unit-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        const parent = btn.parentElement;
        const targetId = parent.dataset.target;

        parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.getElementById(targetId).value = btn.dataset.unit;
    });
});


// TUTORIAL

tutorialBtn.addEventListener("click", () => {
    if (tutorialContent.style.display === "none") {
        tutorialContent.style.display = "block";
        tutorialBtn.textContent = "Ocultar explicación";
    } else {
        tutorialContent.style.display = "none";
        tutorialBtn.textContent = "¿No sabes de dónde sacar esta información? Haz clic aquí y te lo explico.";
    }
});


// THEME (DARK / LIGHT)

if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    icon.className = savedTheme === 'dark' ? "fas fa-sun" : "fas fa-moon";
}

toggleButton.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');

    if (allowStorage === null) {
        body.setAttribute('data-theme', 'dark');
        icon.className = "fas fa-sun";
        return;
    }

    if (allowStorage === "true") {
        if (currentTheme === 'dark') {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            icon.className = "fas fa-moon";
        } else {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.className = "fas fa-sun";
        }
    }

    renderSingleChart();
});

// EXPORT PNG/PDF

document.getElementById("shareTable").addEventListener("click", () => {
    document.getElementById("popupShareTable").style.display = "flex";
});

document.getElementById("popupShareTable").addEventListener("click", (e) => {
    if (e.target === document.getElementById("popupShareTable")) {
        document.getElementById("popupShareTable").style.display = "none";
    }
});

document.getElementById("closePopupShareTable").addEventListener("click", () => {
    document.getElementById("popupShareTable").style.display = "none";
});

document.getElementById("shareGraphics").addEventListener("click", () => {
    document.getElementById("popupShareGraphics").style.display = "flex";
});

document.getElementById("popupShareGraphics").addEventListener("click", (e) => {
    if (e.target === document.getElementById("popupShareGraphics")) {
        document.getElementById("popupShareGraphics").style.display = "none";
    }
});

document.getElementById("closePopupShareGraphics").addEventListener("click", () => {
    document.getElementById("popupShareGraphics").style.display = "none";
});

const urlPara = document.createElement("p");
urlPara.textContent = window.location.href;
urlPara.style.fontSize = "12px";
urlPara.style.opacity = "0.7";
urlPara.style.marginTop = "10px";

function hideEditColumn() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.style.display = "none";
    });

    document.querySelectorAll("td:first-child, th:first-child").forEach(col => {
        col.style.display = "none";
    });
}

function showEditColumn() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.style.display = "inline-block";
    });

    document.querySelectorAll("td:first-child, th:first-child").forEach(col => {
        col.style.display = "";
    });
}

function showChartTitleForExport() {
    const sel = document.getElementById("chartSelector").value;
    const datasets = { kda: "KDA", winrate: "WinRate", hpm: "HPM", dpm: "DPM" };
    const title = datasets[sel] || "Chart";

    document.getElementById("chartSelectorLabel").style.display = "none";
    document.getElementById("chartSelector").style.display = "none";

    const h3 = document.getElementById("chartTitleExport");
    h3.innerText = title;
    h3.style.display = "block";
}

function restoreChartTitle() {
    document.getElementById("chartSelectorLabel").style.display = "block";
    document.getElementById("chartSelector").style.display = "block";
    document.getElementById("chartTitleExport").style.display = "none";
}

function exportPNG(buttonShare, selector, filename) {
    const original = document.querySelector(selector);

    buttonShare.style.display = "none";
    if (urlPara) original.appendChild(urlPara);

    hideEditColumn();

    const clone = original.cloneNode(true);
    clone.style.width = original.offsetWidth + "px";
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";

    document.body.appendChild(clone);

    const originalCanvas = original.querySelector("canvas");
    const clonedCanvas = clone.querySelector("canvas");
    if (originalCanvas && clonedCanvas) {
        clonedCanvas.width = originalCanvas.width;
        clonedCanvas.height = originalCanvas.height;
        copyCanvasContent(originalCanvas, clonedCanvas);
    }

    html2canvas(clone, { scale: 2, backgroundColor: null })
        .then(canvas => {
            const link = document.createElement("a");
            link.download = filename + ".png";
            link.href = canvas.toDataURL();
            link.click();
        })
        .finally(() => {
            clone.remove();
            if (urlPara) urlPara.remove();
            showEditColumn();
            buttonShare.style.display = "block";
        });
}

function copyCanvasContent(originalCanvas, clonedCanvas) {
    const ctx = clonedCanvas.getContext("2d");
    ctx.drawImage(originalCanvas, 0, 0);
}

function exportPDF(buttonShare, selector, filename) {
    const original = document.querySelector(selector);

    buttonShare.style.display = "none";
    urlPara && original.appendChild(urlPara);

    hideEditColumn();

    const clone = original.cloneNode(true);
    clone.style.width = original.offsetWidth + "px";
    clone.style.maxWidth = "none";
    clone.style.overflow = "visible";
    clone.style.position = "absolute";
    clone.style.top = "-9999px";

    document.body.appendChild(clone);

    const originalCanvas = original.querySelector("canvas");
    const clonedCanvas = clone.querySelector("canvas");
    if (originalCanvas && clonedCanvas) {
        clonedCanvas.width = originalCanvas.width;
        clonedCanvas.height = originalCanvas.height;
        copyCanvasContent(originalCanvas, clonedCanvas);
    }
    html2canvas(clone, { scale: 2, backgroundColor: null }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jspdf.jsPDF("p", "mm", "a4");

        const pageWidth = 190;
        const ratio = canvas.height / canvas.width;
        const pageHeight = pageWidth * ratio;

        pdf.addImage(imgData, "PNG", 10, 10, pageWidth, pageHeight);
        pdf.save(filename + ".pdf");
    }).finally(() => {
        clone.remove();
        urlPara && urlPara.remove();
        showEditColumn();
        buttonShare.style.display = "block";
    });
}

async function exportAllChartsPDF() {
    const metrics = ["winrate", "kda", "hpm", "dpm"];
    const titles = ["WinRate", "KDA", "HPM", "DPM"];
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    let images = [];

    for (let i = 0; i < metrics.length; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 600;
        document.body.appendChild(canvas);

        renderSingleChart(metrics[i], canvas);

        await sleep(200);

        const img = canvas.toDataURL("image/png");
        images.push(img);

        canvas.remove();
    }

    for (let i = 0; i < images.length; i++) {
        if (i > 0 && i % 2 === 0) pdf.addPage();

        const y = (i % 2 === 0) ? 10 : 150;

        pdf.setFontSize(18);
        pdf.text(titles[i], 10, y - 2);
        pdf.addImage(images[i], "PNG", 10, y, 190, 130);
    }

    pdf.save("All_Charts.pdf");
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

document.getElementById("exportTablePNG").addEventListener("click", () => exportPNG(btnShareTable, "#stats", "overwatch-stats"));
document.getElementById("exportTablePDF").addEventListener("click", () => exportPDF(btnShareTable, "#stats", "overwatch-stats"));

document.getElementById("exportGraphicsPNG").addEventListener("click", () => {
    showChartTitleForExport();
    const sel = document.getElementById("chartSelector").value;
    const datasets = { kda: "KDA", winrate: "WinRate", hpm: "HPM", dpm: "DPM" };
    exportPNG(btnShareGraphics, "#graphics", datasets[sel]);
    setTimeout(restoreChartTitle, 150);
});

document.getElementById("exportGraphicsPDF").addEventListener("click", () => {
    exportAllChartsPDF();
});

// IMPORT/EXPORT JSON
document.getElementById("exportData").addEventListener("click", () => {
    const saved = JSON.parse(localStorage.getItem("seasonData") || "[]");
    const blob = new Blob([JSON.stringify(saved, null, 2)], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "overwatch_stats.json";
    link.click();
});

document.getElementById("importData").addEventListener("click", () => {
    document.getElementById("importFile").click();
});

document.getElementById("importFile").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) return alert("El archivo no es válido.");

            localStorage.setItem("seasonData", JSON.stringify(imported));
            data = [...imported];

            renderTable();
            updateStatsVisibility();
            alert("Datos importados correctamente.");

        } catch {
            alert("Error al leer el archivo.");
        }

        document.getElementById("importFile").value = "";
        renderSingleChart();
    };

    reader.readAsText(file);
});


// GRAPHICS (CHART JS)
let mainChart = null;

function fmt(n, digits = 3) {
    const num = Number(n);

    if (isNaN(num) || !isFinite(num)) return "0,00";

    let parts = num.toFixed(digits).split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1];

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return integerPart + "," + decimalPart;
}

function renderSingleChart(type = null, targetCanvas = null) {
    const sel = type || document.getElementById("chartSelector").value;

    const canvas = targetCanvas || document.getElementById("chartCanvas");
    const ctx = canvas.getContext("2d");

    const datasets = {
        kda: { label: "KDA", values: data.map(d => d.kda) },
        winrate: { label: "WinRate (%)", values: data.map(d => d.winrate ?? 0) },
        hpm: { label: "HPM", values: data.map(d => d.hpm) },
        dpm: { label: "DPM", values: data.map(d => d.dpm) }
    };

    const selected = datasets[sel];
    const seasons = data.map(d => d.season);
    const isWinRate = sel === "winrate";

    if (!targetCanvas && mainChart) {
        mainChart.destroy();
    }

    const labelColor = getComputedStyle(document.body).getPropertyValue("--color-text").trim();

    const colors = selected.values.map((val, i) => {
        if (i === 0)
            return getComputedStyle(document.body).getPropertyValue("--color-text-secondary").trim();

        const prev = selected.values[i - 1];
        return val > prev ? "#6fdf6f" : val < prev ? "#eb5e59" : "#d6d6d6";
    });

    const annotationPlugin = {
        id: "annotationPlugin",
        afterDatasetsDraw(chart) {
            const ctx = chart.ctx;
            const dataset = chart.data.datasets[0].data;
            const meta = chart.getDatasetMeta(0);

            meta.data.forEach((point, i) => {
                ctx.save();
                ctx.textAlign = "center";
                ctx.font = "13px sans-serif";

                if (isWinRate) {
                    if (i > 0) {
                        const prev = dataset[i - 1];
                        const curr = dataset[i];
                        const diff = curr - prev;

                        const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "•";
                        const color = diff > 0 ? "#6fdf6f" : diff < 0 ? "#eb5e59" : "#d6d6d6";

                        ctx.fillStyle = color;
                        ctx.fillText(`${arrow} ${fmt(Math.abs(diff), 2)}%`, point.x, point.y - 14);
                    } else {
                        ctx.fillStyle = labelColor;
                        ctx.fillText(`${fmt(dataset[i], 2)}%`, point.x, point.y - 14);
                    }
                } else {
                    ctx.fillStyle = labelColor;
                    ctx.fillText(fmt(dataset[i], 2), point.x, point.y - 14);
                }
                ctx.restore();
            });
        }
    };

    const chartBackgroundPlugin = {
        id: "chartBackgroundPlugin",
        beforeDraw(chart) {
            const ctx = chart.ctx;
            const { width, height } = chart;

            ctx.save();
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--card");
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    };

    const chart = new Chart(ctx, {
        type: isWinRate ? "line" : "bar",
        data: {
            labels: seasons,
            datasets: [{
                label: selected.label,
                data: selected.values,
                backgroundColor: isWinRate ? undefined : colors,
                borderColor: isWinRate ? undefined : colors,
                borderWidth: 2
            }]
        },
        options: {
            animation: false,
            scales: {
                x: {
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue("--grid-color").trim()
                    },
                    ticks: {
                        color: labelColor
                    }
                },
                y: {
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue("--grid-color").trim()
                    },
                    ticks: {
                        color: labelColor
                    }
                }
            }
        },
        plugins: [annotationPlugin, chartBackgroundPlugin]
    });

    if (!targetCanvas) mainChart = chart;
    return chart;
}

document.getElementById("chartSelector").addEventListener("change", () => { renderSingleChart(); });
renderSingleChart();

// CARD STATUS (COLLAPSE)
function saveCardState() {
    const state = {};
    document.querySelectorAll(".card").forEach((card, i) => {
        state[i] = card.classList.contains("minimized");
    });
    localStorage.setItem("cardsMinimized", JSON.stringify(state));
}

function loadCardState() {
    const state = JSON.parse(localStorage.getItem("cardsMinimized") || "{}");
    document.querySelectorAll(".card").forEach((card, i) => {
        const h2 = card.querySelector("h2");
        if (state[i]) {
            card.classList.add("minimized");
            h2.textContent = "► " + h2.textContent.replace(/^[▼►]\s*/, "");
        } else {
            h2.textContent = "▼ " + h2.textContent.replace(/^[▼►]\s*/, "");
        }
    });
}

document.querySelectorAll(".card h2").forEach(h2 => {
    h2.style.cursor = "pointer";

    if (!h2.textContent.includes("▼") && !h2.textContent.includes("►")) {
        h2.textContent = "▼ " + h2.textContent;
    }

    h2.addEventListener("click", () => {
        const card = h2.parentElement;
        card.classList.toggle("minimized");

        if (card.classList.contains("minimized")) {
            h2.textContent = "► " + h2.textContent.replace(/^[▼►]\s*/, "");
        } else {
            h2.textContent = "▼ " + h2.textContent.replace(/^[▼►]\s*/, "");
        }

        if (localStorage.getItem("allowStorage") === "true") {
            saveCardState();
        }
    });
});

loadCardState();


// FOLDABLE SECTIONS
document.querySelectorAll(".section-header").forEach(header => {
    header.addEventListener("click", () => {
        const content = header.nextElementSibling;
        content.style.display = content.style.display === "flex" ? "none" : "flex";
    });
});


// SIMPLE / ADVANCED MODE
function setSimpleMode() {
    simpleBtn.classList.add("active");
    advBtn.classList.remove("active");
    document.querySelectorAll(".col-adv").forEach(el => el.classList.add("hide"));
}

function setAdvancedMode() {
    advBtn.classList.add("active");
    simpleBtn.classList.remove("active");
    document.querySelectorAll(".col-adv").forEach(el => el.classList.remove("hide"));
}

simpleBtn.addEventListener("click", setSimpleMode);
advBtn.addEventListener("click", setAdvancedMode);
setSimpleMode();


// MENU SECTIONS
function updateActiveMenu() {
    const hash = window.location.hash.replace("#", "");

    document.querySelectorAll(".menu-btn").forEach(btn => {
        const section = btn.dataset.section;
        btn.classList.toggle("active", section === hash);
    });
}

document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        setTimeout(updateActiveMenu, 10);
    });
});

updateActiveMenu();
window.addEventListener("hashchange", updateActiveMenu);
