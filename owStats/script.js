// LOCAL STORAGE
let data = [];

const allowStorage = localStorage.getItem("allowStorage");

function showPopup() {
    if (allowStorage === null) {
        document.getElementById("popup").style.display = "flex";
    } else if (allowStorage === "true") {
        loadFromStorage();
    }
}

function acceptStorage() {
    localStorage.setItem("allowStorage", "true");
    document.getElementById("popup").style.display = "none";
    saveToStorage();
}

function denyStorage() {
    document.getElementById("popup").style.display = "none";
}

function saveToStorage() {
    if (localStorage.getItem("allowStorage") === "true") {
        localStorage.setItem("seasonData", JSON.stringify(data));
    }
}

function loadFromStorage() {
    const saved = localStorage.getItem("seasonData");
    if (saved) {
        data = JSON.parse(saved);
        renderTable();
    }
}

function clearStorage() {
    localStorage.removeItem("seasonData");
    data = [];
    renderTable();
}

// BASIC FUNCTIONS
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
const tbody = document.querySelector("#statsTable tbody");
const summary = document.querySelector("#summary");

function renderTable() {
    tbody.innerHTML = "";

    if (data.length === 0) return;

    // Ordenar temporadas de menor a mayor
    const sortedData = [...data].sort((a, b) => a.season - b.season);

    const bestKDA = sortedData.reduce((a, b) => a.kda > b.kda ? a : b);
    const worstKDA = sortedData.reduce((a, b) => a.kda < b.kda ? a : b);
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
                <td>${d.kda ? d.kda.toFixed(2) : "0.00"}</td>
                <td>${d.winrate ? d.winrate.toFixed(2) : "0.00"}</td>
                <td>${d.hpm.toFixed(0)}</td>
                <td>${d.dpm.toFixed(0)}</td>
                <td>${d.sratio ? d.sratio.toFixed(2) : "0.00"}</td>
                <td>${d.impact ? d.impact.toFixed(2) : "0.00"}</td>
                <td>${d.obj.toFixed(2)}</td>
            </tr>
        `;

        tbody.innerHTML += row;
    });

    renderSummary();
    renderComparison();
}

function renderSummary() {
    if (data.length === 0) {
        summary.innerHTML = "<p>Aún no hay temporadas añadidas.</p>";
        return;
    }

    const bestKDA = data.reduce((a, b) => a.kda > b.kda ? a : b);
    const worstKDA = data.reduce((a, b) => a.kda < b.kda ? a : b);
    const bestWR = data.reduce((a, b) => a.winrate > b.winrate ? a : b);
    const worstWR = data.reduce((a, b) => a.winrate < b.winrate ? a : b);

    summary.innerHTML = `
        <h2>Resumen</h2>
        <p>🏆 Mejor KDA: S${bestKDA.season} (${bestKDA.kda ? bestKDA.kda.toFixed(2) : "0.00"})</p>
        <p>💀 Peor KDA: S${worstKDA.season} (${worstKDA.kda ? worstKDA.kda.toFixed(2) : "0.00"})</p>
        <p>🏅 Mejor WinRate: S${bestWR.season} (${bestWR.winrate ? bestWR.winrate.toFixed(2) : "0.00"}%)</p>
        <p>❌ Peor WinRate: S${worstWR.season} (${worstWR.winrate ? worstWR.winrate.toFixed(2) : "0.00"}%)</p>
    `;
}

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
    if (unitObj === "m") rawObj /= 60;

    if (unitTotal === "h") rawTotal /= 3600;
    if (unitTotal === "m") rawTotal /= 60;

    document.getElementById("timeOnObj").value = rawObj;
    document.getElementById("totalTime").value = rawTotal;

    document.getElementById("timeOnObjUnit").value = unitObj;
    document.getElementById("totalTimeUnit").value = unitTotal;

    document.querySelectorAll(`[data-target="timeOnObjUnit"] button`).forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-target="timeOnObjUnit"] button[data-unit="${unitObj}"]`).classList.add("active");

    document.querySelectorAll(`[data-target="totalTimeUnit"] button`).forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-target="totalTimeUnit"] button[data-unit="${unitTotal}"]`).classList.add("active");

    document.getElementById("saveBtn").textContent = "Guardar Cambios";
    document.getElementById("deleteBtn").style.display = "inline-block";

    document.querySelector(".card").scrollIntoView({ behavior: "smooth" });
}

function clearForm() {
    document.getElementById("formSeason").reset();

    document.getElementById("timeOnObjUnit").value = "s";
    document.getElementById("totalTimeUnit").value = "s";

    document.querySelectorAll(`[data-target="timeOnObjUnit"] button`).forEach(b => {
        b.classList.remove("active");
        if (b.dataset.unit === "s") b.classList.add("active");
    });
    document.querySelectorAll(`[data-target="totalTimeUnit"] button`).forEach(b => {
        b.classList.remove("active");
        if (b.dataset.unit === "s") b.classList.add("active");
    });

    document.getElementById("deleteBtn").style.display = "none";

    document.getElementById("saveBtn").textContent = "Agregar Temporada";

    editingIndex = null;
}

// ADD SEASON
const form = document.getElementById("formSeason");

form.addEventListener("submit", e => {
    e.preventDefault();

    const season = +document.getElementById("season").value;
    const kills = +document.getElementById("kills").value;
    const assists = +document.getElementById("assists").value;
    const deaths = +document.getElementById("deaths").value;
    const played = +document.getElementById("played").value || 0;
    const wins = +document.getElementById("wins").value || 0;
    const healing = +document.getElementById("healing").value || 0;
    const damage = +document.getElementById("damage").value || 0;
    const rawTimeOnObj = +document.getElementById("timeOnObj").value || 0;
    const rawTotalTime = +document.getElementById("totalTime").value || 1;
    const timeOnObjUnit = document.getElementById("timeOnObjUnit").value;
    const totalTimeUnit = document.getElementById("totalTimeUnit").value;

    const timeOnObj = convertToSeconds(rawTimeOnObj, timeOnObjUnit);
    const totalTime = convertToSeconds(rawTotalTime, totalTimeUnit);

    const minutes = totalTime / 60;

    const entry = {
        season,
        kills,
        assists,
        deaths,
        played,
        wins,
        healing,
        damage,

        rawTimeOnObj: rawTimeOnObj,
        rawTotalTime: rawTotalTime,
        timeOnObjUnit,
        totalTimeUnit,

        timeOnObj,
        totalTime,

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
        document.querySelector("#saveBtn").textContent = "Agregar Temporada";
    } else {
        data.push(entry);
    }

    renderTable();
    saveToStorage();
    clearForm();
});

// COMPARISON
function renderComparison() {
    if (data.length < 2) {
        comparisonText.innerHTML = "<p>No hay suficientes temporadas para comparar.</p>";
        return;
    }

    // Ordenar las temporadas por número de season
    const sortedData = [...data].sort((a, b) => a.season - b.season);

    const current = sortedData[sortedData.length - 1]; // temporada más reciente
    const prev1 = sortedData[sortedData.length - 2];   // 1 temporada atrás
    const prev2 = sortedData.length >= 3 ? sortedData[sortedData.length - 3] : null; // 2 temporadas atrás

    let html = `
        <p>Comparando la temporada <strong>${current.season}</strong> con:</p>
        <ul>
    `;

    html += `
        <li>📌 <strong>1 temporada atrás (S${prev1.season})</strong>
            <ul>
                ${compareMetric("KDA", current.kda, prev1.kda)}
                ${compareMetric("Win Rate", current.winrate, prev1.winrate)}
                ${compareMetric("Curación por minuto", current.hpm, prev1.hpm)}
                ${compareMetric("Daño por minuto", current.dpm, prev1.dpm)}
                ${compareMetric("Curación/Daño", current.sratio, prev1.sratio)}
                ${compareMetric("Impacto", current.impact, prev1.impact)}
                ${compareMetric("Objetivo (%)", current.obj, prev1.obj)}
            </ul>
        </li>
    `;

    if (prev2) {
        html += `
            <li>📌 <strong>2 temporadas atrás (S${prev2.season})</strong>
                <ul>
                    ${compareMetric("KDA", current.kda, prev2.kda)}
                    ${compareMetric("Win Rate", current.winrate, prev2.winrate)}
                    ${compareMetric("Curación por minuto", current.hpm, prev2.hpm)}
                    ${compareMetric("Daño por minuto", current.dpm, prev2.dpm)}
                    ${compareMetric("Curación/Daño", current.sratio, prev2.sratio)}
                    ${compareMetric("Impacto", current.impact, prev2.impact)}
                    ${compareMetric("Objetivo (%)", current.obj, prev2.obj)}
                </ul>
            </li>
        `;
    }

    html += `</ul>`;

    comparisonText.innerHTML = html;
}

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

showPopup();

document.querySelectorAll(".unit-buttons button").forEach(btn => {
    btn.addEventListener("click", () => {
        const parent = btn.parentElement;
        const targetId = parent.dataset.target;

        parent.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.getElementById(targetId).value = btn.dataset.unit;
    });
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

    renderTable();
    clearForm();
});

const tutorialBtn = document.getElementById("tutorial");
const tutorialContent = document.getElementById("tutorialContent");

tutorialBtn.addEventListener("click", () => {
    if (tutorialContent.style.display === "none") {
        tutorialContent.style.display = "block";
        tutorialBtn.textContent = "Ocultar explicación";
    } else {
        tutorialContent.style.display = "none";
        tutorialBtn.textContent = "¿No sabes de dónde sacar esta información? Haz clic aquí y te lo explico.";
    }
});
