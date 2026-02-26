// --- LOCAL DATE HELPERS ---
function pad2(n) {
    return String(n).padStart(2, '0');
}

// Parse a YYYY-MM-DD string as a LOCAL date at noon (DST-safe)
function parseYmdLocalNoon(ymd) {
    if (!ymd) return new Date(NaN);
    if (ymd instanceof Date) {
        return new Date(ymd.getFullYear(), ymd.getMonth(), ymd.getDate(), 12, 0, 0, 0);
    }
    const s = String(ymd);
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) {
        // Fallback: try native parse then normalize
        const d = new Date(s);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
    }
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 12, 0, 0, 0);
}

function localDateKeyFromDate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function localDateKey(ymdOrDate) {
    const d = parseYmdLocalNoon(ymdOrDate);
    if (isNaN(d)) return '';
    return localDateKeyFromDate(d);
}
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAYS_OF_WEEK = [
    { name: 'Monday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Tuesday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Wednesday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Thursday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Friday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Saturday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 },
    { name: 'Sunday', options: ['Rest', 'Easy', 'Tempo', 'Speed', 'Long'], activeOption: 0 }
];

const DISTANCE_OPTIONS = [
    { label: '5K', value: '5k' },
    { label: '10K', value: '10k' },
    { label: 'Half Marathon', value: 'half-marathon' },
    { label: 'Marathon', value: 'marathon' },
];

const PLAN_LENGTH_OPTIONS = [
    { label: '4 Week Training Plan', value: 4 },
    { label: '6 Week Training Plan', value: 6 },
    { label: '8 Week Training Plan', value: 8 },
    { label: '10 Week Training Plan', value: 10 },
    { label: '12 Week Training Plan', value: 12 },
    { label: '16 Week Training Plan', value: 16 },
    { label: '20 Week Training Plan', value: 20 },
    { label: '24 Week Training Plan', value: 24 }
];

const EVENT_COLOR_MAP = new Map([
    ["Easy Run", "green"],
    ["Speed Workout", "red"],
    ["Long Run", "purple"],
    ["Race", "blue"]
]);

function exportToCSV(events) {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Group events by week start (Monday) and store distance + notes per day
    const grouped = {};

    events.forEach(event => {
        const dateObj = parseYmdLocalNoon(event.event_date);
        if (isNaN(dateObj)) return;

        const monday = getMonday(dateObj);
        const weekKey = localDateKeyFromDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 12, 0, 0, 0));

        if (!grouped[weekKey]) {
            grouped[weekKey] = Array.from({ length: 7 }, () => ({ distance: '', notes: '' }));
        }

        // Convert Sun–Sat (0–6) to Mon–Sun (0–6)
        const dayIndex = (dateObj.getDay() + 6) % 7;

        grouped[weekKey][dayIndex] = {
            distance: event.event_distance || '',
            notes: event.event_notes || ''
        };
    });

    // Build header: Week, Mon, Mon Notes, Tue, Tue Notes, ... , Sun, Sun Notes, Total
    const header = ['Week'];
    daysOfWeek.forEach(d => {
        header.push(d);
        header.push(`${d} Notes`);
    });
    header.push('Total');

    // Build rows
    const rows = Object.entries(grouped).map(([weekStart, dayData], i) => {
        let total = 0;
        const cells = [];

        dayData.forEach(({ distance, notes }) => {
            const num = parseFloat(distance);
            if (!isNaN(num)) {
                total += num;
            }
            cells.push(distance);
            cells.push(notes);
        });

        const totalStr = total ? total.toFixed(1) : '';
        return [i + 1, ...cells, totalStr];
    });

    // CSV-encode with quotes and escaping for commas/quotes
    const allRows = [header, ...rows];
    const csvContent = allRows
        .map(row =>
            row
                .map(value => {
                    const v = value == null ? '' : String(value);
                    const escaped = v.replace(/"/g, '""');
                    return `"${escaped}"`;
                })
                .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "training_plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = d.getDate() - ((day + 6) % 7); // Adjust back to Monday
    return new Date(d.setDate(diff));
}

function exportToPDF(events) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Group events by week start (Monday) and store distance + notes per day
    const grouped = {};

    events.forEach(event => {
        const dateObj = parseYmdLocalNoon(event.event_date);
        if (isNaN(dateObj)) return;

        const monday = getMonday(dateObj);
        const weekKey = localDateKeyFromDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 12, 0, 0, 0));

        if (!grouped[weekKey]) {
            grouped[weekKey] = Array.from({ length: 7 }, () => ({ distance: '', notes: '' }));
        }

        // Convert Sun–Sat (0–6) to Mon–Sun (0–6)
        const dayIndex = (dateObj.getDay() + 6) % 7;

        grouped[weekKey][dayIndex] = {
            distance: event.event_distance || '',
            notes: event.event_notes || ''
        };
    });

    // Build header: Week, Mon, Mon Notes, Tue, Tue Notes, ... , Sun, Sun Notes, Total
    const header = ['Week'];
    daysOfWeek.forEach(d => {
        header.push(d);
        header.push(`${d} Notes`);
    });
    header.push('Total');

    // Build rows
    const rows = Object.entries(grouped).map(([weekStart, dayData], i) => {
        let total = 0;
        const cells = [];

        dayData.forEach(({ distance, notes }) => {
            const num = parseFloat(distance);
            if (!isNaN(num)) {
                total += num;
            }
            cells.push(distance);
            cells.push(notes);
        });

        const totalStr = total ? total.toFixed(1) : '';
        return [i + 1, ...cells, totalStr];
    });

    // Use autoTable to render the weekly grid with notes, mirroring the CSV layout
    doc.autoTable({
        head: [header],
        body: rows,
        startY: 10,
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            halign: 'center'
        },
        styles: {
            fontSize: 8,
            cellPadding: 2
        },
        columnStyles: {
            0: { halign: 'center' }
        }
    });

    doc.save("training_plan.pdf");
}


function transformEvent(event) {
    // Map event_workout to event_type
    const workoutTypeMap = {
        "Easy": "Easy Run",
        "Speed": "Speed Workout",
        "Tempo": "Speed Workout",
        "Long": "Long Run",
        "Race": "Race"
    };

    // Ensure event_date is properly formatted (LOCAL date key; avoids UTC/DST shifting)
    const date = event.event_date_key || localDateKey(event.event_date);

    return {
        date: date,
        // Build a richer title that surfaces the specific session (400s, hills, cruise intervals, etc.)
        // without forcing the user to open the details modal.
        title: (() => {
            const base = `${event.event_distance} miles ${String(event.event_workout || '').toLowerCase()} run`;

            // Only append session detail for quality workouts (Tempo/Speed). Easy/Long/Race stays clean.
            const isQuality = event.event_workout === "Tempo" || event.event_workout === "Speed";
            const rawNotes = (event.event_notes || '').trim();
            if (!isQuality || !rawNotes) return base;

            // Prefer the first clause, and keep it short.
            // Also strip common boilerplate like WU/CD.
            let detail = rawNotes
                .split('|')[0]
                .split('. ')[0]
                .replace(/\(WU\/CD\)/gi, '')
                .replace(/WU\s*\d+[^)]*\/?\s*CD\s*\d+[^)]*/gi, '')
                .trim();

            // Guard: if stripping made it empty, fall back to the raw first clause
            if (!detail) {
                detail = rawNotes.split('|')[0].trim();
            }

            // Truncate to avoid ugly wrapping in the calendar grid
            const maxLen = 70;
            if (detail.length > maxLen) {
                detail = detail.slice(0, maxLen - 1).trimEnd() + '…';
            }

            return `${base} — ${detail}`;
        })(),
        event_distance: event.event_distance,

        // 🔥 preserve subtype + pace for analytics
        event_workout: event.event_workout,
        event_pace: event.event_pace,
        event_pace_decimal: event.event_pace_decimal,

        // Surface full structured workout description in the UI
        notes: (() => {
            const raw = (event.event_notes || '').trim();

            // If notes already contain WU/CD or recovery detail, keep as-is
            if (/warm[- ]?up|cool[- ]?down|WU|CD|recovery|rest/i.test(raw)) {
                return raw;
            }

            // Otherwise append standard guidance for quality workouts
            if (event.event_workout === 'Tempo' || event.event_workout === 'Speed') {
                return [
                    raw,
                    'Warm-up 10–15 min easy + drills/strides.',
                    'Cool-down 10 min easy jog.'
                ].filter(Boolean).join(' ');
            }

            return raw;
        })(),
        theme: "",
        event_type: workoutTypeMap[event.event_workout],
    };
}

function exportToICS(events) {
    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Your Company//TrainingPlan//EN\r\n";

    events.forEach((event, index) => {
        const uid = `event-${index}@yourdomain.com`;
        // Format dates as YYYYMMDD
        const dtStart = new Date(event.event_date)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");
        // For simplicity, we set DTEND as the same day.
        const dtEnd = dtStart;
        icsContent += "BEGIN:VEVENT\r\n";
        icsContent += `UID:${uid}\r\n`;
        icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z\r\n`;
        icsContent += `DTSTART;VALUE=DATE:${dtStart}\r\n`;
        icsContent += `DTEND;VALUE=DATE:${dtEnd}\r\n`;
        icsContent += `SUMMARY:${event.event_title}\r\n`;
        icsContent += `DESCRIPTION:${event.event_notes}\r\n`;
        icsContent += "END:VEVENT\r\n";
    });

    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "training_plan.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function triggerPlanGeneratedCustomEvent() {
    const event = new CustomEvent("trainingplangenerated", {
        detail: { message: null, time: new Date() }
    });
    document.dispatchEvent(event);
}

function convertPaceToDecimal(pace) {
    if (!pace) return NaN;
    const s = String(pace).trim();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return NaN;
    const minutes = parseInt(m[1], 10);
    const seconds = parseInt(m[2], 10);
    return minutes + (seconds / 60);
}

function formatPaceFromDecimal(paceDecimal) {
    if (paceDecimal == null || isNaN(paceDecimal)) return "";
    const minutes = Math.floor(paceDecimal);
    const seconds = Math.round((paceDecimal - minutes) * 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getTrainingPhaseForWeek(weekIndex, totalWeeks) {
    const progress = totalWeeks > 0 ? (weekIndex / totalWeeks) : 0;
    if (progress < 0.4) return "base";
    if (progress < 0.7) return "build";
    if (progress < 0.9) return "peak";
    return "taper";
}

function getTargetPaceDecimal(workoutType, goalPace, trainingPhase) {
    const goalDecimal = convertPaceToDecimal(goalPace);
    if (isNaN(goalDecimal)) return null;

    // Keep in sync with trainingPlanGenerator.js phase offsets (seconds per mile)
    const OFFSETS = {
        Tempo: { base: 35, build: 25, peak: 15, taper: 10 },
        Speed: { base: -10, build: -20, peak: -30, taper: -20 }
    };

    const offsetSec = (OFFSETS[workoutType] && OFFSETS[workoutType][trainingPhase]) || 0;
    return goalDecimal + (offsetSec / 60);
}

function getMonthName(dateString) {
    const date = new Date(dateString);
    return MONTH_NAMES[date.getMonth()];
}

var myChart;

const monthLabelPlugin = {
    id: "monthLabelPlugin",
    beforeDraw(chart) {
        const ctx = chart.ctx;
        const xAxis = chart.scales["x"];
        if (!xAxis) return;

        const pluginOptions = chart.config.options.plugins.monthLabelPlugin || {};
        const monthLabels = pluginOptions.monthLabels || [];

        ctx.save();
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";

        let lastMonth = null;

        monthLabels.forEach((month, index) => {
            if (month && month !== lastMonth) {
                lastMonth = month;
                const x = xAxis.getPixelForTick(index);
                const y = chart.chartArea.bottom + 40;
                ctx.fillText(month, x, y);
            }
        });

        ctx.restore();
    }
};

const trainingPhasePlugin = {
    id: "trainingPhasePlugin",
    beforeDraw(chart) {
        // Only draw if this chart explicitly enables the plugin
        const enabled = chart.config?.options?.plugins?.trainingPhasePlugin;
        if (!enabled) return;
        const ctx = chart.ctx;
        const xAxis = chart.scales["x"];
        if (!xAxis) return;

        const totalWeeks = chart.config.data.labels.length;
        const peakIndex = getPeakWeekIndex(chart);
        const taperStart = totalWeeks - 2;

        const bracketY = chart.height - 5;
        const bracketHeight = 10;

        function drawBracket(startX, endX, y, label, labelOffset = 4, height = bracketHeight) {
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            ctx.moveTo(startX, y - height);
            ctx.lineTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.lineTo(endX, y - height);
            ctx.stroke();

            const centerX = (startX + endX) / 2;
            ctx.font = "12px sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.textAlign = "center";
            ctx.fillText(label, centerX, y - height - labelOffset);
        }

        ctx.save();

        // Build Phase: Week 0 to (Peak - 1)
        const buildStartX = xAxis.getPixelForTick(0);
        const buildEndX = xAxis.getPixelForTick(peakIndex - 1);
        drawBracket(buildStartX, buildEndX - 6, bracketY, "Build Phase");

        // Peak: widen a little more
        const peakXStart = xAxis.getPixelForTick(peakIndex - 1);
        const peakXEnd = xAxis.getPixelForTick(peakIndex + 1);
        drawBracket(peakXStart, peakXEnd, bracketY, "Peak", 6, 14);

        // Taper: extend one more week back
        const taperStartX = xAxis.getPixelForTick(taperStart - 1); // 👈 widen left
        const taperEndX = xAxis.getPixelForTick(totalWeeks - 1);
        drawBracket(taperStartX + 4, taperEndX, bracketY, "Taper");

        ctx.restore();
    }
};

function getPeakWeekIndex(chart) {
    const datasets = chart.config.data.datasets;
    const weekCount = chart.config.data.labels.length;

    const totals = new Array(weekCount).fill(0);

    datasets.forEach(ds => {
        ds.data.forEach((val, i) => {
            totals[i] += val;
        });
    });

    return totals.indexOf(Math.max(...totals));
}

function setupBarChart(workoutEvents) {
    if (!workoutEvents || workoutEvents.length === 0) return;

    const chartEl = document.getElementById("myChart");
    if (!chartEl || typeof chartEl.getContext !== "function") {
        return;
    }
    const ctx = chartEl.getContext("2d");

    workoutEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    const firstEventDate = new Date(workoutEvents[0].date);
    const startOfWeek1 = getPreviousMonday(firstEventDate);

    let aggregatedData = {};
    let weekToMonthMap = {}; // Store week-to-month mapping

    workoutEvents.forEach(w => {
        const eventDate = new Date(w.date);
        const weekNumber = getWeekNumber(startOfWeek1, eventDate);
        const monthLabel = getMonthName(eventDate); // Get month name (e.g., "January")

        if (!aggregatedData[weekNumber]) {
            aggregatedData[weekNumber] = { "Easy Run": 0, "Speed Workout": 0, "Long Run": 0 };
        }
        if (!weekToMonthMap[weekNumber]) {
            weekToMonthMap[weekNumber] = monthLabel; // Assign month for each week
        }

        aggregatedData[weekNumber][w.event_type] += w.event_distance;
    });

    // remove the last week for now
    const keys = Object.keys(aggregatedData);
    const lastKey = keys[keys.length - 1];
    delete aggregatedData[lastKey];

    const weekLabels = Object.keys(aggregatedData).map(week => `Week ${week}`);
    const monthLabels = weekLabels.map((_, index) => weekToMonthMap[index + 1] || ""); // Align with weeks

    const totalPerWeek = Object.values(aggregatedData).map(w =>
        w["Easy Run"] + w["Speed Workout"] + w["Long Run"]
    );

    const peakIndex = totalPerWeek.indexOf(Math.max(...totalPerWeek));
    const taperStart = totalPerWeek.length - 2;

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: weekLabels,
            datasets: [
                {
                    label: "Easy Run",
                    backgroundColor: "rgba(167, 243, 208, 0.2)",
                    borderColor: "rgba(167, 243, 208, 1)",
                    borderWidth: 1,
                    data: Object.values(aggregatedData).map(weekData => weekData["Easy Run"])
                },
                {
                    label: "Speed Workout",
                    backgroundColor: "rgba(216, 4, 4, 0.2)",
                    borderColor: "rgba(216, 4, 4, 1)",
                    borderWidth: 1,
                    data: Object.values(aggregatedData).map(weekData => weekData["Speed Workout"])
                },
                {
                    label: "Long Run",
                    backgroundColor: "rgba(118, 1, 168, 0.2)",
                    borderColor: "rgba(118, 1, 168, 1)",
                    borderWidth: 1,
                    data: Object.values(aggregatedData).map(weekData => weekData["Long Run"])
                }
            ]
        },
        options: {
            layout: {
                padding: {
                    top: 10,
                    bottom: 50
                }
            },
            scales: {
                x: {
                    ticks: {
                        beginAtZero: true,
                        padding: 5
                    }
                },
                y: {
                    ticks: {
                        beginAtZero: true
                    }
                }
            },
            plugins: {
                monthLabelPlugin: { monthLabels },
                trainingPhasePlugin: true
            }
        }
    });
}

// **Helper function to get the previous (or same) Monday**
function getPreviousMonday(date) {
    const dayOfWeek = date.getDay();
    const difference = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + difference);
    return monday;
}

// **Compute week number using Monday as the start**
function getWeekNumber(startOfWeek1, eventDate) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.min(24, Math.floor((eventDate - startOfWeek1) / msPerWeek) + 1);
}

// **Helper function to get month name from a date**
function getMonthName(date) {
    return date.toLocaleString('default', { month: 'long' });
}

window.addEventListener("load", function () {
    Chart.register(monthLabelPlugin);
    Chart.register(trainingPhasePlugin);
    setTimeout(function () {
        // noUiSlider removed; premium goal pace slider is driven by Alpine sharedState
        window.paceGoal = ['9:00 min/mi'];
        setupBarChart(null);
    });
});

let init = false;

function configureSlider() {
    const weeklyMileageSlider = document.getElementById("weeklyMileageSlider");
    if (!weeklyMileageSlider) {
        return;
    } else if (weeklyMileageSlider.noUiSlider) {
        // Destroy existing slider instance if it exists
        weeklyMileageSlider.noUiSlider.destroy();
    }

    // Generate pace values from 4:30 to 13:00 (5-second increments)
    const paceValues = Array.from({ length: ((13 - 4.5) * 60) / 5 + 1 }, (_, i) => {
        const totalSeconds = (4.5 * 60) + (i * 5);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds} min/mi`;
    });

    const paceFormat = {
        to: value => {
            const roundedIndex = Math.round(value);
            return paceValues[roundedIndex] || paceValues[0]; // Ensure it's in range
        },
        from: value => {
            const index = paceValues.indexOf(value);
            return index >= 0 ? index : 0;
        }
    };

    noUiSlider.create(weeklyMileageSlider, {
        start: [60],
        connect: [true, true],
        tooltips: [{ to: paceFormat.to, from: paceFormat.from }],
        format: paceFormat,
        range: { min: 0, max: paceValues.length - 1 },
        step: 1
    });

    // Ensure it sets correctly to 9:00
    const defaultPaceIndex = paceValues.indexOf("9:00 min/mi");

    // Move tooltip below slider
    document.querySelectorAll(".noUi-tooltip").forEach(tooltip => {
        tooltip.style.bottom = "-45px"; // Adjust this value as needed
    });

    setTimeout(() => {
        weeklyMileageSlider.noUiSlider.on("change", (value) => {
            window.paceGoal = value;
        });

        weeklyMileageSlider.noUiSlider.set('9:00 min/mi');
    }, 0);
}

function calculateDefaults(selectedWorkouts) {
    const conditions = {
        Easy: false,
        Tempo: false,
        Speed: false,
        Long: false
    };

    for (const key in selectedWorkouts) {
        if (selectedWorkouts[key] > 0 && key in conditions) {
            conditions[key] = true;
        }
    }

    const trueConditions = Object.keys(conditions).filter(key => conditions[key]);
    return window.slider.getOptions(trueConditions.join("+"));
}

function preventRightClickOnPage() {
    document.addEventListener('contextmenu', event => event.preventDefault());
}

// --- PLAN MANAGER ---
// CRUD operations for saved training plans via Salesforce REST API
const planManager = {
    async savePlan({ name, currentWorkouts, selectedRaceDistance, raceDate, selectedWeeklyMileage, numOfWeeksInTraining }) {
        const body = {
            name,
            planJson: JSON.stringify(currentWorkouts),
            raceDistance: selectedRaceDistance || null,
            raceDate: raceDate || null,
            mileageLevel: selectedWeeklyMileage || null,
            durationWeeks: numOfWeeksInTraining || null
        };
        const res = await authManager.apiFetch('/pyr/plans', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        return res.json();
    },

    async listPlans() {
        const res = await authManager.apiFetch('/pyr/plans');
        return res.json();
    },

    async loadPlan(planId) {
        const res = await authManager.apiFetch(`/pyr/plans/${planId}`);
        return res.json();
    },

    async deletePlan(planId) {
        const res = await authManager.apiFetch(`/pyr/plans/${planId}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};

// --- AUTH MANAGER ---
// Handles Google OAuth, JWT storage in localStorage, and Salesforce REST API calls
const authManager = {
    SALESFORCE_BASE_URL: 'https://orgfarm-d3a1bb2cb0-dev-ed.develop.my.site.com',
    TOKEN_KEY: 'pyr_jwt_token',
    USER_KEY: 'pyr_user',

    token: null,
    user: null,

    init() {
        this.token = localStorage.getItem(this.TOKEN_KEY);
        const userStr = localStorage.getItem(this.USER_KEY);
        if (userStr) {
            try { this.user = JSON.parse(userStr); } catch(e) { this.user = null; }
        }
    },

    isAuthenticated() {
        return !!this.token;
    },

    getToken() {
        return this.token;
    },

    async signInWithGoogle(idToken) {
        const res = await fetch(`${this.SALESFORCE_BASE_URL}/services/apexrest/pyr/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });
        const data = await res.json();
        if (data.success) {
            this._storeSession(data.token, {
                userId: data.userId,
                pyrUserId: data.pyrUserId,
                email: data.email
            });
        }
        return data;
    },

    signOut() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
    },

    _storeSession(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    // Authenticated fetch helper — attaches Bearer token for Salesforce REST calls
    async apiFetch(path, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        return fetch(`${this.SALESFORCE_BASE_URL}/services/apexrest${path}`, {
            ...options,
            headers
        });
    }
};

function sharedState() {
    return {
        goalPacePercent: 50,
        goalPaceSeconds: null,
        goalPaceLabel: '—',
        goalPaceMinLabel: '',
        goalPaceMaxLabel: '',

        // Pace ranges used by the premium goal pace slider
        timeLimits: {
            '5k': { min: '5:00', max: '9:00' },
            '10k': { min: '5:30', max: '9:30' },
            'half-marathon': { min: '6:00', max: '10:00' },
            'marathon': { min: '6:30', max: '11:00' }
        },

        parsePaceToSeconds(paceStr) {
            if (!paceStr || typeof paceStr !== 'string' || !paceStr.includes(':')) return null;
            const [m, s] = paceStr.split(':').map(v => parseInt(v, 10));
            if (Number.isNaN(m) || Number.isNaN(s)) return null;
            return (m * 60) + s;
        },

        secondsToPace(seconds) {
            if (seconds == null || !Number.isFinite(seconds)) return '—';
            const m = Math.floor(seconds / 60);
            const s = Math.round(seconds % 60);
            return `${m}:${String(s).padStart(2, '0')}/mi`;
        },

        secondsToMinMi(seconds) {
            if (seconds == null || !Number.isFinite(seconds)) return '';
            const m = Math.floor(seconds / 60);
            const s = Math.round(seconds % 60);
            return `${m}:${String(s).padStart(2, '0')} min/mi`;
        },

        updateGoalPaceFromPercent() {
            const dist = this.selectedRaceDistance;
            const limits = (dist && this.timeLimits) ? this.timeLimits[dist] : null;

            const minStr = limits?.min || '6:00';
            const maxStr = limits?.max || '10:00';

            const minSec = this.parsePaceToSeconds(minStr) ?? 360;
            const maxSec = this.parsePaceToSeconds(maxStr) ?? 600;

            const lo = Math.min(minSec, maxSec);
            const hi = Math.max(minSec, maxSec);

            const p = Math.max(0, Math.min(100, Number(this.goalPacePercent) || 0));
            const sec = lo + ((hi - lo) * (p / 100));

            this.goalPaceSeconds = Math.round(sec);
            this.goalPaceLabel = this.secondsToPace(sec);
            this.goalPaceMinLabel = `${minStr}/mi`;
            this.goalPaceMaxLabel = `${maxStr}/mi`;

            const el = document.getElementById('goalPaceRange');
            if (el) el.style.setProperty('--p', `${p}%`);
        },

        // Constants
        daysOfWeek: DAYS_OF_WEEK,
        raceDistanceOptions: DISTANCE_OPTIONS,

        get raceDateOptions() {
            if (!this.raceDate) {
                return PLAN_LENGTH_OPTIONS; // Show all options when no race date is selected
            } else {
                // Compute full weeks until race using date-only UTC math (avoids DST/time-of-day off-by-one)
                const today = new Date();
                const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

                const [yy, mm, dd] = String(this.raceDate).split('-').map(n => parseInt(n, 10));
                const raceUTC = Date.UTC(yy, (mm || 1) - 1, dd || 1);

                const msPerDay = 24 * 60 * 60 * 1000;
                const daysUntilRace = Math.round((raceUTC - todayUTC) / msPerDay);
                const weeksUntilRace = Math.floor(daysUntilRace / 7);

                const cap = Math.max(4, Math.min(24, weeksUntilRace));
                return PLAN_LENGTH_OPTIONS.filter(option => option.value <= cap);
            }
        },

        // selections made by the user
        selectedRaceDistance: '',
        selectedTimeframe: '',
        raceDate: '',
        selectedGoal: '',
        selectedWeeklyMileage: '',
        errors: {},
        weeklyMileage: '',
        raceTime: '',
        isGenerating: false,
        currentTab: 'Calendar',
        tabs: [
            //{ name: 'Overview' },
            { name: 'Calendar' },
            { name: 'Training Load Summary' }
        ],
        miles: Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: i + 1 })),

        // Track the active tab for the new tab state
        activeTab: 'calendar',

        // Viewport flag used by top controls (avoids relying on Tailwind breakpoints)
        isMobile: window.innerWidth < 768,

        updateIsMobile() {
            this.isMobile = window.innerWidth < 768;
        },

        average_mileage_weekly: 0,
        average_mileage_daily: 0,
        numOfWeeksInTraining: 0,

        // Analytics summary and chart refs
        analyticsSummary: {
            totalMileage: 0,
            typePercents: { easy: 0, speed: 0, long: 0 },
            peakWeekMileage: 0,
        },
        analyticsCharts: { weeklyTrend: null, typeBreakdown: null, longRun: null, paceProgression: null },

        get zonePreferences() {
            return [0.6, 0.12, 0.08, 0.2];
        },

        get workoutMap() {
            return new Map([
                ["Monday", ["Easy"]],
                ["Tuesday", ["Tempo"]],
                ["Wednesday", ["Easy"]],
                ["Thursday", ["Speed"]],
                ["Friday", ["Rest"]],
                ["Saturday", ["Long"]],
                ["Sunday", ["Easy"]]
            ]);
        },

        // master-list of all workouts
        currentWorkouts: [],

        // -----------------------------------------------------------------
        // Advanced Configuration (Workout Library Selection)
        // -----------------------------------------------------------------

        // Controls whether the advanced config modal is open
        advancedConfigOpen: false,

        // Catalog loaded from workoutsCatalog.js (array of workout types)
        workoutCatalog: [],

        // User-selected workout type ids (this will be edited by the modal)
        // Defaults match our generator defaults, but now live in UI state.
        selectedWorkoutTypeIds: ["tempo", "intervals", "progression", "long_run"],

        // Tracks whether the user has manually changed the selection.
        // If false, we can safely apply smarter defaults based on experience level.
        hasCustomizedWorkoutSelection: false,

        // Loaded from workoutsCatalog.js (DEFAULT_WORKOUT_SELECTION_BY_LEVEL)
        defaultWorkoutSelectionByLevel: {},
        createWorkoutInstanceByIdFn: null,

        // Load catalog once so the modal can render a library
        async loadWorkoutCatalog() {
            try {
                const mod = await import("./workoutsCatalog.js");
                this.workoutCatalog = Array.isArray(mod.WORKOUT_CATALOG) ? mod.WORKOUT_CATALOG : [];
                this.defaultWorkoutSelectionByLevel = (mod.DEFAULT_WORKOUT_SELECTION_BY_LEVEL && typeof mod.DEFAULT_WORKOUT_SELECTION_BY_LEVEL === 'object')
                    ? mod.DEFAULT_WORKOUT_SELECTION_BY_LEVEL
                    : {};
                this.createWorkoutInstanceByIdFn =
                    (typeof mod.createWorkoutInstanceById === 'function')
                        ? mod.createWorkoutInstanceById
                        : null;
            } catch (e) {
                //console.error("Failed to load workoutsCatalog.js", e);
                this.workoutCatalog = [];
                this.defaultWorkoutSelectionByLevel = {};
                this.createWorkoutInstanceByIdFn = null;
            }
        },
        // Infer experience level using mileage target (simple heuristic).
        // Keeps UI defaults in sync with generator behavior without importing generator internals.
        inferExperienceLevelFromMileageTarget(mileageTarget) {
            const m = parseInt(mileageTarget, 10);
            if (!Number.isFinite(m) || m <= 0) return 'beginner';
            if (m <= 35) return 'beginner';
            if (m <= 60) return 'intermediate';
            return 'advanced';
        },

        // Apply default selection by level IF the user has not customized.
        applyDefaultWorkoutSelection() {
            if (this.hasCustomizedWorkoutSelection) return;

            // Only apply if we have enough inputs to infer a reasonable level
            if (!this.selectedRaceDistance || !this.selectedWeeklyMileage) return;

            // Ensure selectedGoal is populated so mileage target is consistent
            if (!this.selectedGoal) {
                if (this.goalPaceSeconds && Number.isFinite(this.goalPaceSeconds)) {
                    this.selectedGoal = this.secondsToMinMi(this.goalPaceSeconds);
                } else if (this.goalPaceLabel && this.goalPaceLabel.includes('/mi')) {
                    this.selectedGoal = String(this.goalPaceLabel).replace('/mi', ' min/mi');
                }
            }

            const mileageTarget = this.getWeeklyMileage(this.selectedWeeklyMileage, this.selectedRaceDistance, this.selectedGoal);
            const level = this.inferExperienceLevelFromMileageTarget(mileageTarget);
            const defaults = this.defaultWorkoutSelectionByLevel && this.defaultWorkoutSelectionByLevel[level];

            if (Array.isArray(defaults) && defaults.length) {
                this.selectedWorkoutTypeIds = [...defaults];
            }
        },

        // Open/close modal helpers
        openAdvancedConfig() {
            // If the user hasn't customized yet, apply defaults before showing the modal
            this.applyDefaultWorkoutSelection();
            this.advancedConfigOpen = true;
        },
        closeAdvancedConfig() {
            // Validate that at least one non-easy workout type is selected
            const nonEasyWorkouts = (this.selectedWorkoutTypeIds || []).filter(id => id !== "easy");
            if (nonEasyWorkouts.length === 0) {
                alert("Please select at least one workout type besides Easy runs.");
                return;
            }
            this.advancedConfigOpen = false;
        },

        // --- Mobile charts modal ---
        chartsModalOpen: false,
        // --- Mobile Overview chart modal ---
        overviewChartModalOpen: false,

        openChartsModal() {
            this.chartsModalOpen = true;

            // Defer chart rendering until modal DOM is visible AND measurable
            this.$nextTick(() => {
                this.destroyAnalyticsCharts();

                // 1st frame: modal content mounts
                requestAnimationFrame(() => {
                    this.loadAnalyticsCharts({ forceMobileSizing: true, retryIfMissing: true });

                    // 2nd frame: after any CSS transitions, force Chart.js resize
                    requestAnimationFrame(() => {
                        const c = this.analyticsCharts || {};
                        if (c.weeklyTrend && typeof c.weeklyTrend.resize === "function") c.weeklyTrend.resize();
                        if (c.typeBreakdown && typeof c.typeBreakdown.resize === "function") c.typeBreakdown.resize();
                        if (c.longRun && typeof c.longRun.resize === "function") c.longRun.resize();
                        if (c.paceProgression && typeof c.paceProgression.resize === "function") c.paceProgression.resize();
                    });
                });
            });
        },

        closeChartsModal() {
            this.chartsModalOpen = false;

            this.$nextTick(() => {
                this.destroyAnalyticsCharts();
                this._chartsRetryCount = 0;
            });
        },

        openOverviewChartModal() {
            this.overviewChartModalOpen = true;

            // Defer chart rendering until modal DOM is visible AND measurable
            this.$nextTick(() => {
                // Destroy any existing global chart instance (overview uses global `myChart`)
                try {
                    if (typeof myChart !== 'undefined' && myChart && typeof myChart.destroy === 'function') {
                        myChart.destroy();
                    }
                } catch (e) {
                    // no-op
                }

                // 1st frame: modal content mounts
                requestAnimationFrame(() => {
                    // Re-render the Overview bar chart (setupBarChart safely no-ops if canvas isn't present)
                    try {
                        setupBarChart(this.currentWorkouts || []);
                    } catch (e) {
                        // no-op
                    }

                    // 2nd frame: force resize after any transitions (Safari/iOS)
                    requestAnimationFrame(() => {
                        try {
                            if (typeof myChart !== 'undefined' && myChart && typeof myChart.resize === 'function') {
                                myChart.resize();
                            }
                        } catch (e) {
                            // no-op
                        }
                    });
                });
            });
        },

        closeOverviewChartModal() {
            this.overviewChartModalOpen = false;

            // Optional: clean up the chart instance when closing the modal
            this.$nextTick(() => {
                try {
                    if (typeof myChart !== 'undefined' && myChart && typeof myChart.destroy === 'function') {
                        myChart.destroy();
                    }
                } catch (e) {
                    // no-op
                }
            });
        },

        // Toggle selection from the modal UI
        toggleWorkoutType(workoutId) {
            if (!workoutId) return;

            // Easy runs are foundational and always included (not configurable)
            if (workoutId === "easy") return;

            this.hasCustomizedWorkoutSelection = true;
            const current = Array.isArray(this.selectedWorkoutTypeIds) ? this.selectedWorkoutTypeIds : [];
            const idx = current.indexOf(workoutId);

            if (idx >= 0) {
                current.splice(idx, 1);
            } else {
                current.push(workoutId);
            }
            // Keep it stable (no duplicates)
            this.selectedWorkoutTypeIds = Array.from(new Set(current));
        },

        // Helper for checkbox binding in Alpine
        isWorkoutSelected(workoutId) {
            // Easy runs are always included
            if (workoutId === "easy") return true;
            return Array.isArray(this.selectedWorkoutTypeIds) && this.selectedWorkoutTypeIds.includes(workoutId);
        },

        // Computed: catalog entries grouped for display
        get workoutLibraryGroups() {
            const groups = { quality: [], long: [], easy: [], strength: [], mobility: [] };
            (this.workoutCatalog || []).forEach((w) => {
                if (!w || !w.category) return;
                if (!groups[w.category]) groups[w.category] = [];
                groups[w.category].push(w);
            });
            return groups;
        },

        // --- AI Coach shared state ---
        userInput: "",
        enhancedOutput: "",
        loading: false,

        // --- Auth state ---
        isLoggedIn: false,
        currentUser: null,
        authError: '',
        authLoading: false,

        // --- Plan manager state ---
        showSavePlanModal: false,
        savePlanName: '',
        planSaving: false,
        planSaveError: '',
        showMyPlansModal: false,
        savedPlans: [],
        plansLoading: false,
        planActionError: '',

        // Root Alpine init – wires up listeners for the LWC bridge events
        init() {
            // Restore auth session and wire up Google Sign-In
            authManager.init();
            this.isLoggedIn = authManager.isAuthenticated();
            this.currentUser = authManager.user;
            if (window.google && window.google.accounts) {
                this._initGoogleSignIn();
            } else {
                window.addEventListener('gisloaded', () => this._initGoogleSignIn(), { once: true });
            }

            this.updateIsMobile();
            window.addEventListener('resize', () => this.updateIsMobile())

            this.updateGoalPaceFromPercent();
            // Load workout catalog for the Advanced Configuration modal
            this.loadWorkoutCatalog();
            // Listen for successful reviews from the LWC bridge
            window.addEventListener("trainingplanreviewed", (evt) => {
                this.loading = false;
                const detail = (evt && evt.detail) || {};

                const summary =
                    detail.summaryText ||
                    (detail.rawAgentOutput && String(detail.rawAgentOutput)) ||
                    "The AI coach did not return a summary.";

                this.enhancedOutput = summary;
            });

            // Listen for errors from the LWC bridge
            window.addEventListener("trainingplanreviewerror", (evt) => {
                this.loading = false;
                const message =
                    (evt && evt.detail && evt.detail.message) ||
                    "There was a problem reviewing your training plan.";

                this.enhancedOutput = `⚠️ ${message}`;
            });
        },

        async handleGoogleSignIn(idToken) {
            this.authLoading = true;
            this.authError = '';
            try {
                const data = await authManager.signInWithGoogle(idToken);
                if (data.success) {
                    this.isLoggedIn = true;
                    this.currentUser = authManager.user;
                } else {
                    this.authError = data.error || 'Sign in failed. Please try again.';
                }
            } catch(e) {
                this.authError = 'Sign in failed. Please try again.';
            } finally {
                this.authLoading = false;
            }
        },

        authSignOut() {
            authManager.signOut();
            this.isLoggedIn = false;
            this.currentUser = null;
            // Re-render the sign-in button after the DOM updates
            if (typeof this.$nextTick === 'function') {
                this.$nextTick(() => this._renderGoogleButton());
            } else {
                setTimeout(() => this._renderGoogleButton(), 0);
            }
        },

        _initGoogleSignIn() {
            google.accounts.id.initialize({
                client_id: '581536767999-4jhqjdl51n9tr2ad1f72ejaqh5u9u79c.apps.googleusercontent.com',
                callback: (response) => this.handleGoogleSignIn(response.credential),
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            this._renderGoogleButton();
        },

        _renderGoogleButton() {
            if (this.isLoggedIn) return;
            const render = () => {
                const btnEl = document.getElementById('google-signin-btn');
                if (btnEl) {
                    btnEl.innerHTML = '';
                    google.accounts.id.renderButton(btnEl, {
                        theme: 'filled_black',
                        size: 'medium',
                        shape: 'pill',
                        text: 'signin_with',
                    });
                }
            };
            if (typeof this.$nextTick === 'function') {
                this.$nextTick(render);
            } else {
                setTimeout(render, 0);
            }
        },

        // --- Plan manager methods ---

        openSavePlanModal() {
            const dist = this.selectedRaceDistance
                ? this.selectedRaceDistance.charAt(0).toUpperCase() + this.selectedRaceDistance.slice(1).replace(/-/g, ' ')
                : 'Training';
            const date = this.raceDate
                ? new Date(this.raceDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '';
            this.savePlanName = [dist, date].filter(Boolean).join(' – ');
            this.planSaveError = '';
            this.showSavePlanModal = true;
        },

        async confirmSavePlan() {
            if (!this.savePlanName.trim()) {
                this.planSaveError = 'Please enter a plan name.';
                return;
            }
            this.planSaving = true;
            this.planSaveError = '';
            try {
                const data = await planManager.savePlan({
                    name: this.savePlanName.trim(),
                    currentWorkouts: this.currentWorkouts,
                    selectedRaceDistance: this.selectedRaceDistance,
                    raceDate: this.raceDate,
                    selectedWeeklyMileage: this.selectedWeeklyMileage,
                    numOfWeeksInTraining: this.numOfWeeksInTraining
                });
                if (data.success) {
                    this.showSavePlanModal = false;
                    this.savePlanName = '';
                } else {
                    console.log('***', JSON)
                    this.planSaveError = data.error || 'Failed to save plan.';
                }
            } catch(e) {
                                    console.log('***', e)

                this.planSaveError = 'Failed to save plan. Please try again.';
            } finally {
                this.planSaving = false;
            }
        },

        async openMyPlans() {
            this.showMyPlansModal = true;
            this.plansLoading = true;
            this.planActionError = '';
            try {
                const data = await planManager.listPlans();
                if (data.success) {
                    this.savedPlans = data.plans || [];
                } else {
                    this.planActionError = data.error || 'Failed to load plans.';
                }
            } catch(e) {
                this.planActionError = 'Failed to load plans.';
            } finally {
                this.plansLoading = false;
            }
        },

        async loadSavedPlan(planId) {
            this.plansLoading = true;
            this.planActionError = '';
            try {
                const data = await planManager.loadPlan(planId);
                if (data.success) {
                    const plan = data.plan;
                    this.currentWorkouts = plan.planJson;
                    window.currentTrainingPlanJson = this.currentWorkouts;
                    if (plan.raceDistance) this.selectedRaceDistance = plan.raceDistance;
                    if (plan.raceDate) this.raceDate = String(plan.raceDate).substring(0, 10);
                    if (plan.mileageLevel) this.selectedWeeklyMileage = plan.mileageLevel;
                    if (plan.durationWeeks) this.numOfWeeksInTraining = plan.durationWeeks;
                    this.showMyPlansModal = false;
                    this.destroyAnalyticsCharts();
                    this.loadAnalyticsCharts();
                } else {
                    this.planActionError = data.error || 'Failed to load plan.';
                }
            } catch(e) {
                this.planActionError = 'Failed to load plan.';
            } finally {
                this.plansLoading = false;
            }
        },

        async deleteSavedPlan(planId) {
            if (!confirm('Delete this plan?')) return;
            this.planActionError = '';
            try {
                const data = await planManager.deletePlan(planId);
                if (data.success) {
                    this.savedPlans = this.savedPlans.filter(p => p.id !== planId);
                } else {
                    this.planActionError = data.error || 'Failed to delete plan.';
                }
            } catch(e) {
                this.planActionError = 'Failed to delete plan.';
            }
        },

        validateField(fieldName) {
            this.errors[fieldName] = ''; // Clear existing errors

            if (fieldName === 'raceDate') {
                if (!this.raceDate) return;

                // Parse the date correctly in local time
                const raceDate = new Date(this.raceDate + "T00:00:00"); // Force local time zone

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Calculate the min and max allowed race dates
                const minRaceDate = new Date(today);
                minRaceDate.setDate(today.getDate() + 28); // 4 weeks

                const maxRaceDate = new Date(today);
                maxRaceDate.setDate(today.getDate() + 168); // 24 weeks

                // Validate race date
                if (isNaN(raceDate.getTime())) {
                    this.errors.raceDate = 'Please enter a valid race date.';
                } else if (raceDate < minRaceDate) {
                    this.errors.raceDate = `Race date must be at least 4 weeks from today (${minRaceDate.toLocaleDateString()}).`;
                } else if (raceDate > maxRaceDate) {
                    this.errors.raceDate = `Race date cannot be more than 24 weeks from today (${maxRaceDate.toLocaleDateString()}).`;
                } else {
                    this.raceDate = this.raceDate; // Keep the original date string
                }
            } else if (fieldName === 'raceTime') {
                const time = this.raceTime;

                // Define min/max times based on the selected race distance
                const timeLimits = {
                    '5k': { min: '00:12:00', max: '01:30:00' },
                    '10k': { min: '00:25:00', max: '02:30:00' },
                    'half-marathon': { min: '01:00:00', max: '04:00:00' },
                    'marathon': { min: '02:00:00', max: '06:00:00' },
                };

                const { min, max } = timeLimits[this.selectedRaceDistance] || {};

                // Validate time format (hh:mm:ss or mm:ss)
                const timeRegex = /^(\d{1,2}:\d{2}(:\d{2})?)$/;
                if (!time || !timeRegex.test(time)) {
                    this.errors.raceTime = 'Please enter a valid race time (e.g., 12:00 or 1:30:00).';
                    this.selectedGoal = null;
                    return;
                }

                // Convert time strings to seconds for comparison
                const toSeconds = (timeString) => {
                    const parts = timeString.split(':').map(Number);
                    if (parts.length === 2) {
                        // mm:ss format
                        const [minutes, seconds] = parts;
                        return (minutes || 0) * 60 + (seconds || 0);
                    } else if (parts.length === 3) {
                        // hh:mm:ss format
                        const [hours, minutes, seconds] = parts;
                        return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
                    }
                    return 0;
                };

                const inputSeconds = toSeconds(time);
                const minSeconds = min ? toSeconds(min) : null;
                const maxSeconds = max ? toSeconds(max) : null;

                // Validate range
                if (minSeconds !== null && inputSeconds < minSeconds) {
                    this.errors.raceTime = `Time must be at least ${min.replace(/^00:/, '')}.`;
                    this.selectedGoal = null;
                } else if (maxSeconds !== null && inputSeconds > maxSeconds) {
                    this.errors.raceTime = `Time cannot exceed ${max.replace(/^00:/, '')}.`;
                    this.selectedGoal = null;
                }
            } else if (fieldName === 'weeklyMileage') {
                // Weekly mileage is selected via radio buttons (selectedWeeklyMileage: low/medium/high).
                // Do not mutate selectedWeeklyMileage here, or the UI will appear to “deselect” on Generate.
                if (!this.selectedWeeklyMileage) {
                    this.errors.weeklyMileage = 'Please select a weekly mileage preference (Low / Medium / High).';
                }
            }
        },

        async generatePlan() {
            // Show spinner immediately
            this.isGenerating = true;
            this.showErrorToast = false;

            try {
                // Sync goal pace from the premium slider
                this.updateGoalPaceFromPercent();

                if (this.goalPaceSeconds && Number.isFinite(this.goalPaceSeconds)) {
                    this.selectedGoal = this.secondsToMinMi(this.goalPaceSeconds);
                } else if (this.goalPaceLabel && this.goalPaceLabel.includes('/mi')) {
                    // fallback to label string if seconds missing
                    this.selectedGoal = String(this.goalPaceLabel).replace('/mi', ' min/mi');
                } else {
                    this.selectedGoal = '9:00 min/mi';
                }

                // Keep legacy global in sync (some code still reads paceGoal?.[0])
                window.paceGoal = [this.selectedGoal];

                // 🔒 FORCE validation before allowing Generate
                this.validateField('raceDate');

                if (!this.formComplete) {
                    this.showErrorToast = true;

                    // Make sure the toast disappears every time
                    setTimeout(() => {
                        this.showErrorToast = false;
                    }, 3000);

                    return false;
                }

                const numberOfWeeksUntilRace = this.selectedTimeframe.substring(0, 2).trim();
                const weeksInt = parseInt(numberOfWeeksUntilRace, 10);
                const allowed = (this.raceDateOptions || []).some(o => o.value === weeksInt);
                if (!allowed) {
                    this.errors.selectedTimeframe = 'Selected plan length does not fit within the chosen race date.';
                    this.showErrorToast = true;
                    setTimeout(() => { this.showErrorToast = false; }, 3000);
                    return false;
                } else if (this.errors.selectedTimeframe) {
                    this.errors.selectedTimeframe = '';
                }

                const startDate = this.getTrainingStartDate(this.raceDate, numberOfWeeksUntilRace);
                const mileageTarget = this.getWeeklyMileage(this.selectedWeeklyMileage, this.selectedRaceDistance, this.selectedGoal);
                // Apply smart defaults (e.g., include hills for intermediate/advanced) unless the user has customized
                this.applyDefaultWorkoutSelection();
                const trainingController = await import("./trainingPlanGenerator.js");
                // Workout library selection (controlled by Advanced Configuration modal)
                const fallbackDefaults = (this.defaultWorkoutSelectionByLevel && this.defaultWorkoutSelectionByLevel.beginner)
                    ? this.defaultWorkoutSelectionByLevel.beginner
                    : ["tempo", "long_run"];

                const selectedWorkoutTypeIds = Array.isArray(this.selectedWorkoutTypeIds)
                    ? this.selectedWorkoutTypeIds
                    : fallbackDefaults;

                const allRuns = trainingController.createTrainingPlan(
                    startDate,
                    mileageTarget,
                    this.raceDate,
                    this.selectedGoal,
                    numberOfWeeksUntilRace,
                    {
                        selectedWorkoutTypeIds
                    }
                );

                this.currentWorkouts = [];
                let totalDistance = 0;
                for (let i = 0; i < allRuns.length; i++) {
                    if (allRuns[i].event_distance && allRuns[i].event_workout != 'Rest') {
                        const transformed = transformEvent(allRuns[i]);
                        transformed.event_workout = allRuns[i].event_workout;
                        transformed.event_pace = allRuns[i].event_pace;
                        transformed.event_pace_decimal = allRuns[i].event_pace_decimal;
                        // Assign a stable-ish id so edits/deletes can target a specific event
                        transformed.id = `${transformed.date}-${i}`;
                        this.currentWorkouts.push(transformed);
                        totalDistance += allRuns[i].event_distance;
                    }
                }

                // Expose the current training plan globally for the AI Coach LWC
                window.currentTrainingPlanJson = this.currentWorkouts;

                this.numOfWeeksInTraining = numberOfWeeksUntilRace;
                this.average_mileage_weekly = Math.ceil(totalDistance / numberOfWeeksUntilRace);
                this.average_mileage_daily = Math.ceil(this.average_mileage_weekly / 6);

                triggerPlanGeneratedCustomEvent();

                // Always refresh charts after generating a plan so Overview/Analytics are in sync
                this.destroyAnalyticsCharts();
                this.loadAnalyticsCharts();
                return true;
            } catch (e) {
                return false;
            } finally {
                // Always clear spinner even if we early-return on validation
                this.isGenerating = false;
            }
        },

        async enhancePlan() {
            // Clear previous output and show loading state
            this.loading = true;
            this.enhancedOutput = "";

            // Ensure the LWC bridge is ready
            const cmp = window.trainingPlanReviewCmp;
            if (!cmp || typeof cmp.reviewPlan !== "function") {
                this.loading = false;
                this.enhancedOutput = "⚠️ The AI Coach is not ready yet. Try again in a moment.";
                return;
            }

            // Ensure we actually have a training plan to send
            const planJson = window.currentTrainingPlanJson || [];
            if (!Array.isArray(planJson) || planJson.length === 0) {
                this.loading = false;
                this.enhancedOutput = "⚠️ Please generate a training plan first, then ask the AI Coach.";
                return;
            }

            // User question / notes from the textarea
            const userQuestion =
                this.userInput && this.userInput.trim().length
                    ? this.userInput.trim()
                    : "Please review this training plan and suggest practical improvements.";

            // Optional runner context – derive from sharedState fields
            const runnerContext = {
                raceDistance: this.selectedRaceDistance || null,
                raceDate: this.raceDate || null,
                weeklyMileage: this.selectedWeeklyMileage || null
            };

            // Build request object for the LWC bridge; it will normalize/serialize as needed
            const req = {
                trainingPlanJson: planJson,      // array of workout objects
                runnerContext: runnerContext,    // extra metadata/context
                userQuestion: userQuestion       // maps to Apex ReviewRequest.userQuestion
            };

            try {
                // Call the LWC @api method with a single request object
                await cmp.reviewPlan(req);
                // Do not set enhancedOutput here; it will be set when the
                // trainingplanreviewed or trainingplanreviewerror events fire.
            } catch (e) {
                // LWC / Apex-style errors usually have body.message etc.
                if (e && e.body) {
                }

                // Some Lightning Out errors show up here instead
                /*if (e && e.message) {
                    console.error('*** error.message:', e.message);
                }

                try {
                    console.error('*** error as JSON:', JSON.stringify(e));
                } catch (jsonErr) {
                    console.error('*** error could not be stringified:', jsonErr);
                }*/
                this.loading = false;
                this.enhancedOutput = "⚠️ There was an unexpected error contacting the AI Coach.";
            }
        },

        getWeeklyMileage(selectedWeeklyMileage, raceDistance, goalPace) {
            let baseMileageRange = {
                "5k": [15, 40],
                "10k": [25, 50],
                "half-marathon": [30, 70],
                "marathon": [40, 100]
            };

            let baseMin = baseMileageRange[raceDistance][0];
            let baseMax = baseMileageRange[raceDistance][1];

            // Convert pace to decimal
            let pace = convertPaceToDecimal(goalPace);

            // Adjust based on pace effort
            const fastestPace = 4.5; // 4:30 min/mi
            const slowestPace = 13.0; // 13:00 min/mi
            let paceEffortScale = 0.7 + ((slowestPace - pace) / (slowestPace - fastestPace)) * (1.3 - 0.7);

            // Adjust based on intensity setting
            let intensityAdjustment;
            switch (selectedWeeklyMileage) {
                case "low":
                    intensityAdjustment = 0.8;
                    break;
                case "medium":
                    intensityAdjustment = 1.0;
                    break;
                case "high":
                    intensityAdjustment = 1.2;
                    break;
                default:
                    intensityAdjustment = 1.0;
            }

            // Calculate target mileage
            let mileageTarget = ((baseMin + baseMax) / 2) * paceEffortScale * intensityAdjustment;

            // Ensure within bounds (10 to 100 miles)
            mileageTarget = Math.max(10, Math.min(100, Math.round(mileageTarget)));

            return mileageTarget;
        },

        get formComplete() {
            const hasErrors =
                (this.errors && (
                    !!this.errors.raceDate ||
                    !!this.errors.raceTime ||
                    !!this.errors.weeklyMileage
                ));

            return this.selectedRaceDistance &&
                this.selectedTimeframe &&
                this.raceDate &&
                this.selectedGoal &&
                this.selectedWeeklyMileage &&
                !hasErrors;
        },

        getTrainingStartDate(raceDate, weeks) {
            // Ensure the input is a valid date
            let raceDay = new Date(raceDate);
            if (isNaN(raceDay)) {
                throw new Error("Invalid race date provided.");
            }

            const validWeeks = ['4', '6', '8', '10', '12', '14', '16', '20', '24'];
            if (!validWeeks.includes(weeks)) {
                throw new Error("Invalid weeks provided. Must be one of: " + validWeeks.join(", "));
            }

            // Calculate the start date
            let startDate = new Date(raceDay);
            startDate.setDate(raceDay.getDate() - weeks * 7);

            // Return in YYYY-MM-DD format using LOCAL components (avoid UTC/DST shift)
            return localDateKeyFromDate(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0, 0));
        },

        calendarComponent() {
            const self = this;
            return {
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                workouts: [], // This will be populated from `currentWorkouts`
                blankdays: [],
                no_of_days: [],
                isModalOpen: false,
                eventToEdit: null,
                workoutPickerOpen: false,
                workoutPickerQuery: '',

                // -----------------------------
                // Mobile Mode (safe, grid-preserving)
                // -----------------------------
                selectedDayKey: '',

                // Build YYYY-MM-DD key for a date number in the current month
                dayKey(date) {
                    return localDateKeyFromDate(new Date(this.year, this.month, date, 12, 0, 0, 0));
                },

                // Called when a day cell is tapped (mobile)
                setSelectedDay(date) {
                    this.selectedDayKey = this.dayKey(date);
                },

                // All events for a given day number
                dayEvents(date) {
                    const key = this.dayKey(date);
                    const list = Array.isArray(this.workouts) ? this.workouts : [];
                    return list.filter(e => (e.event_date_key || localDateKey(e.event_date)) === key);
                },

                // Compact count used in the grid on mobile
                dayEventCount(date) {
                    return this.dayEvents(date).length;
                },

                isMobile: window.innerWidth < 768,

                updateIsMobile() {
                    this.isMobile = window.innerWidth < 768;
                },

                // Label shown above the mobile agenda panel
                get selectedDayLabel() {
                    if (!this.selectedDayKey) return '';
                    const d = new Date(`${this.selectedDayKey}T12:00:00`);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                },

                // Date number (1–31) used when opening the modal from agenda panel
                get selectedDayDateNumber() {
                    if (!this.selectedDayKey) return null;
                    const d = new Date(`${this.selectedDayKey}T12:00:00`);
                    if (isNaN(d.getTime())) return null;
                    return d.getDate();
                },

                // Events rendered in the mobile agenda panel
                get selectedDayEvents() {
                    if (!this.selectedDayKey) return [];
                    const list = Array.isArray(this.workouts) ? this.workouts : [];
                    return list.filter(e => (e.event_date_key || localDateKey(e.event_date)) === this.selectedDayKey);
                },

                // Mobile Agenda/List view: group workouts by date for the currently viewed month
                // Must never throw (Alpine will stop rendering if this errors).
                get mobileAgendaGroups() {
                    try {
                        const list = Array.isArray(this.workouts)
                            ? this.workouts
                            : (Array.isArray(window.workouts) ? window.workouts : []);

                        const byKey = {};

                        for (const e of list) {
                            if (!e || !e.event_date) continue;

                            const key = e.event_date_key
                                ? String(e.event_date_key)
                                : String(e.event_date).slice(0, 10);

                            if (!key || key.length < 10) continue;

                            // Local noon avoids timezone shifting
                            const d = new Date(`${key}T12:00:00`);
                            if (isNaN(d.getTime())) continue;

                            // Only include workouts in the currently viewed month/year
                            if (d.getFullYear() !== this.year || d.getMonth() !== this.month) continue;

                            if (!byKey[key]) {
                                byKey[key] = {
                                    dateKey: key,
                                    day: d.getDate(),
                                    label: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
                                    events: []
                                };
                            }
                            byKey[key].events.push(e);
                        }

                        return Object.values(byKey)
                            .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
                            .map(g => {
                                g.events = g.events
                                    .slice()
                                    .sort((x, y) => String(x.event_title || "").localeCompare(String(y.event_title || "")));
                                return g;
                            });
                    } catch (err) {
                        //console.warn("[PYR] mobileAgendaGroups failed (non-blocking):", err);
                        return [];
                    }
                },

                MONTH_NAMES,
                DAYS,

                // Initialize Calendar
                init() {
                    this.loadWorkouts();
                    this.calculateDays();

                    this.updateIsMobile();
                    window.addEventListener('resize', () => this.updateIsMobile());

                    document.addEventListener("trainingplangenerated", (event) => {
                        this.loadWorkouts();
                    });
                },

                // Load workouts from `currentWorkouts`
                loadWorkouts() {
                    this.workouts = [];

                    // Normalize shape from currentWorkouts so we handle any mixed key names
                    this.workouts = (self.currentWorkouts || []).map((workout) => {
                        const event_date = workout.event_date || workout.date;
                        const event_title = workout.event_title || workout.title || "";
                        const event_notes = workout.event_notes || workout.notes || "";
                        const event_distance =
                            workout.event_distance !== undefined && workout.event_distance !== null
                                ? workout.event_distance
                                : workout.distance;
                        const event_type = workout.event_type || workout.event_workout || "";
                        const event_date_key = workout.event_date_key || localDateKey(event_date);

                        return {
                            id: workout.id,
                            event_date,
                            event_date_key,
                            event_title,
                            event_notes,
                            event_distance,
                            event_workout_type_id: workout.event_workout_type_id,
                            event_theme: EVENT_COLOR_MAP.get(event_type),
                            event_type
                        };
                    });

                    // Default selected day for mobile: today if visible, else first of month
                    if (!this.selectedDayKey) {
                        const today = new Date();
                        if (today.getFullYear() === this.year && today.getMonth() === this.month) {
                            this.selectedDayKey = localDateKeyFromDate(
                                new Date(this.year, this.month, today.getDate(), 12, 0, 0, 0)
                            );
                        } else {
                            this.selectedDayKey = localDateKeyFromDate(
                                new Date(this.year, this.month, 1, 12, 0, 0, 0)
                            );
                        }
                    }

                    if (this.workouts.length) {
                        const firstDate = parseYmdLocalNoon(this.workouts[0].event_date_key || this.workouts[0].event_date);
                        this.month = firstDate.getMonth();
                        this.year = firstDate.getFullYear();
                        this.calculateDays();
                    }
                    self.loadBarChart();
                },

                // Navigate Months
                changeMonth(step) {
                    this.month += step;
                    if (this.month > 11) {
                        this.month = 0;
                        this.year++;
                    } else if (this.month < 0) {
                        this.month = 11;
                        this.year--;
                    }
                    this.calculateDays();
                },

                // Calculate Days in Month
                calculateDays() {
                    // Adjust the first day to align weeks to Sunday
                    const firstDay = new Date(this.year, this.month, 1).getDay(); // 0 = Sunday
                    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

                    this.blankdays = Array(firstDay).fill(null); // Prepend blank days for alignment
                    this.no_of_days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                },

                // Check if Today
                isToday(date) {
                    const today = new Date();
                    const currentDay = new Date(this.year, this.month, date, 12, 0, 0, 0);
                    return today.toDateString() === currentDay.toDateString();
                },

                // Show Edit Modal
                editEvent(event, date) {
                    this.eventToEdit = { ...event, date };
                    this.isModalOpen = true;
                },

                showEventModal(date) {
                    const cellKey = localDateKeyFromDate(new Date(this.year, this.month, date, 12, 0, 0, 0));
                    const existingEvent = this.workouts.find((e) => (e.event_date_key || localDateKey(e.event_date)) === cellKey);

                    if (existingEvent) {
                        // Edit existing event
                        this.eventToEdit = { ...existingEvent, date };
                    } else {
                        // Create a new event
                        const localDate = new Date(this.year, this.month, date);

                        localDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
                        this.eventToEdit = {
                            event_date: `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`,
                            event_title: "",
                            event_notes: "",
                            event_distance: 1,
                            event_theme: "blue", // Default theme
                            date,
                        };
                    }

                    // Reset workout picker whenever the event modal opens
                    this.workoutPickerOpen = false;
                    this.workoutPickerQuery = '';
                    this.isModalOpen = true;
                },

                openWorkoutPicker() {
                    this.workoutPickerOpen = true;
                    this.workoutPickerQuery = '';
                },

                closeWorkoutPicker() {
                    this.workoutPickerOpen = false;
                    this.workoutPickerQuery = '';
                },

                getWorkoutPickerHint() {
                    const t = (this.eventToEdit && this.eventToEdit.event_type)
                        ? String(this.eventToEdit.event_type).toLowerCase()
                        : '';
                    if (t.includes('easy')) return 'Easy-run options';
                    if (t.includes('long')) return 'Long-run options';
                    if (t.includes('speed')) return 'Quality options (tempo / intervals / hills)';
                    if (t.includes('race')) return 'Race day — typically not replaced, but you can.';
                    return 'Pick a workout from your library.';
                },

                getSelectedWorkoutLabel() {
                    const id = this.eventToEdit && this.eventToEdit.event_workout_type_id;
                    if (!id) return 'Using the default workout for this day.';
                    const w = (self.workoutCatalog || []).find(x => x.id === id);
                    return w ? `Selected: ${w.name}` : `Selected: ${id}`;
                },

                buildWorkoutInstanceContext() {
                    const parsePaceMinPerMile = (paceLabel) => {
                        if (!paceLabel) return undefined;
                        const s = String(paceLabel).trim();
                        const m = s.match(/(\d+):(\d+)/);
                        if (!m) return undefined;
                        const mm = Number(m[1]);
                        const ss = Number(m[2]);
                        if (!Number.isFinite(mm) || !Number.isFinite(ss)) return undefined;
                        return mm + (ss / 60);
                    };

                    const goal = parsePaceMinPerMile(self.goalPaceLabel);
                    const pacesMinPerMile = {
                        easy: (typeof goal === 'number') ? goal + 1.5 : undefined,
                        long: (typeof goal === 'number') ? goal + 1.0 : undefined,
                        tempo: (typeof goal === 'number') ? goal + 0.3 : undefined,
                        speed: (typeof goal === 'number') ? Math.max(0.1, goal - 0.3) : undefined
                    };

                    const dayMs = 24 * 60 * 60 * 1000;
                    let weekIndex = 0;
                    let totalWeeks = self.numOfWeeksInTraining ? parseInt(self.numOfWeeksInTraining, 10) : 1;
                    try {
                        const first = (this.workouts && this.workouts.length) ? new Date(this.workouts[0].event_date) : null;
                        const cur = (this.eventToEdit && this.eventToEdit.event_date)
                            ? new Date(`${this.eventToEdit.event_date}T12:00:00`)
                            : null;
                        if (first && cur && !isNaN(first) && !isNaN(cur)) {
                            weekIndex = Math.max(0, Math.floor((cur.getTime() - first.getTime()) / (7 * dayMs)));
                        }
                        if (this.workouts && this.workouts.length) {
                            totalWeeks = Math.max(1, Math.ceil(this.workouts.length / 7));
                        }
                    } catch (e) { }

                    return {
                        level: self.inferExperienceLevelFromMileageTarget
                            ? self.inferExperienceLevelFromMileageTarget(self.average_mileage_weekly)
                            : 'beginner',
                        weekIndex,
                        totalWeeks,
                        pacesMinPerMile
                    };
                },

                getSelectedWorkoutDetails() {
                    const id = this.eventToEdit && this.eventToEdit.event_workout_type_id;
                    if (!id) return '';

                    let instance = null;
                    try {
                        const fn = self.createWorkoutInstanceByIdFn || window.createWorkoutInstanceById;
                        if (typeof fn === 'function') {
                            instance = fn(id, this.buildWorkoutInstanceContext());
                        }
                    } catch (e) { instance = null; }

                    if (!instance) return '';

                    const milesTxt = (typeof instance.estimatedMiles === 'number' && Number.isFinite(instance.estimatedMiles))
                        ? `Est. ${instance.estimatedMiles} mi`
                        : 'Est. — mi';

                    const detail = instance.titleDetail || instance.description || '';
                    return detail ? `${milesTxt} • ${detail}` : milesTxt;
                },

                workoutOptionMilesText(w) {
                    if (!w || !w.id) return 'Est. — mi';
                    try {
                        const fn = self.createWorkoutInstanceByIdFn || window.createWorkoutInstanceById;
                        if (typeof fn !== 'function') return 'Est. — mi';
                        const inst = fn(w.id, this.buildWorkoutInstanceContext());
                        if (inst && typeof inst.estimatedMiles === 'number' && Number.isFinite(inst.estimatedMiles)) {
                            return `Est. ${inst.estimatedMiles} mi`;
                        }
                    } catch (e) { }
                    return 'Est. — mi';
                },

                workoutOptionPreviewText(w) {
                    if (!w || !w.id) return '';
                    try {
                        const fn = self.createWorkoutInstanceByIdFn || window.createWorkoutInstanceById;
                        if (typeof fn !== 'function') return '';
                        const inst = fn(w.id, this.buildWorkoutInstanceContext());
                        if (!inst) return '';
                        return inst.titleDetail || inst.description || inst.notes || '';
                    } catch (e) { }
                    return '';
                },

                filteredWorkoutOptions() {
                    const q = (this.workoutPickerQuery || '').trim().toLowerCase();
                    const t = (this.eventToEdit && this.eventToEdit.event_type)
                        ? String(this.eventToEdit.event_type).toLowerCase()
                        : '';

                    let allowedCategory = null;
                    if (t.includes('easy')) allowedCategory = 'easy';
                    else if (t.includes('long')) allowedCategory = 'long';
                    else if (t.includes('speed')) allowedCategory = 'quality';

                    const selectedIds = Array.isArray(self.selectedWorkoutTypeIds) ? self.selectedWorkoutTypeIds : null;

                    const base = (self.workoutCatalog || []).filter(w => {
                        if (!w) return false;
                        if (allowedCategory && String(w.category) !== allowedCategory) return false;

                        if (selectedIds && selectedIds.length > 0) {
                            if (!selectedIds.includes(w.id)) return false;
                        }
                        return true;
                    });

                    if (!q) return base;

                    return base.filter(w => {
                        const blob = `${w.name || ''} ${w.id || ''} ${w.category || ''} ${(w.description || '')}`.toLowerCase();
                        return blob.includes(q);
                    });
                },

                applyWorkoutSelection(workoutTypeId) {
                    if (!this.eventToEdit) return;

                    this.eventToEdit.event_workout_type_id = workoutTypeId;

                    const ctx = this.buildWorkoutInstanceContext();

                    // Prefer the function captured from dynamic import; fall back to window if present.
                    const fn = self.createWorkoutInstanceByIdFn || window.createWorkoutInstanceById;

                    let instance = null;
                    try {
                        if (typeof fn === 'function') {
                            instance = fn(workoutTypeId, ctx);
                        }
                    } catch (e) {
                        instance = null;
                    }

                    if (instance) {
                        // Notes: set to notes only (no duplication), fallback to description if missing
                        this.eventToEdit.event_notes = String(instance.notes || instance.description || '').trim();

                        // Distance (if known)
                        if (typeof instance.estimatedMiles === 'number' && Number.isFinite(instance.estimatedMiles)) {
                            // Distance dropdown currently supports integer miles only; round so it stays in sync.
                            this.eventToEdit.event_distance = Math.max(1, Math.round(instance.estimatedMiles));
                        }

                        // Align event_type with the selected workout category to reduce confusion.
                        // Only adjust if the event isn't a Race.
                        const cat = String(instance.category || '').toLowerCase();
                        const currentType = String(this.eventToEdit.event_type || '');
                        if (!currentType.toLowerCase().includes('race')) {
                            if (cat === 'easy') this.eventToEdit.event_type = 'Easy Run';
                            else if (cat === 'long') this.eventToEdit.event_type = 'Long Run';
                            else if (cat === 'quality') this.eventToEdit.event_type = 'Speed Workout';
                        }

                        // Title: always update to match the new event type, distance, and workout
                        const workoutName = instance.title;
                        const dist = (this.eventToEdit.event_distance != null) ? `${this.eventToEdit.event_distance}` : '';

                        // Map event_type to the wording used in titles.
                        const typeLabel = (() => {
                            const t = String(this.eventToEdit.event_type || '');
                            if (t === 'Easy Run') return 'easy run';
                            if (t === 'Long Run') return 'long run';
                            if (t === 'Speed Workout') return 'speed workout';
                            if (t === 'Race') return 'race';
                            return String(t).toLowerCase();
                        })();

                        const prefix = (dist ? `${dist} miles ` : '') + (typeLabel ? `${typeLabel}` : '');
                        this.eventToEdit.event_title = `${prefix} — ${workoutName}`.replace(/\s+/g, ' ').trim();
                    }

                    this.closeWorkoutPicker();
                },

                saveEvent() {
                    // Create local date string (avoid UTC conversion)
                    const eventDate = localDateKey(this.eventToEdit.event_date);

                    let index = -1;

                    // Prefer to match by id when available (most reliable)
                    if (this.eventToEdit.id) {
                        index = (self.currentWorkouts || []).findIndex(
                            (e) => e.id === this.eventToEdit.id
                        );
                    }

                    // Fallback: match by date if id is missing
                    if (index === -1) {
                        index = (self.currentWorkouts || []).findIndex(
                            (e) => localDateKey(e.date) === eventDate
                        );
                    }

                    if (index !== -1) {
                        // Update existing event, preserving its id and any extra fields
                        const existing = self.currentWorkouts[index] || {};
                        const effectiveId =
                            existing.id ||
                            this.eventToEdit.id ||
                            `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                        self.currentWorkouts[index] = {
                            ...existing,
                            id: effectiveId,
                            date: eventDate, // Keep in local format
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: EVENT_COLOR_MAP.get(this.eventToEdit.event_type),
                            event_type: this.eventToEdit.event_type,
                            event_distance: this.eventToEdit.event_distance,
                            event_workout_type_id: this.eventToEdit.event_workout_type_id
                        };
                    } else {
                        // Add new event with a generated id (or reuse any provided id)
                        const newId =
                            this.eventToEdit.id ||
                            `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                        self.currentWorkouts.push({
                            id: newId,
                            date: eventDate, // Store in consistent format
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: EVENT_COLOR_MAP.get(this.eventToEdit.event_type),
                            event_type: this.eventToEdit.event_type,
                            event_distance: this.eventToEdit.event_distance,
                            event_workout_type_id: this.eventToEdit.event_workout_type_id
                        });
                    }

                    // Keep the global training plan JSON in sync for the AI Coach LWC
                    window.currentTrainingPlanJson = self.currentWorkouts;

                    this.loadWorkouts();
                    this.isModalOpen = false;
                },

                deleteEvent() {
                    if (!this.eventToEdit) {
                        return;
                    }

                    // Prefer deleting by id when available
                    if (this.eventToEdit.id) {
                        self.currentWorkouts = (self.currentWorkouts || []).filter(
                            (e) => e.id !== this.eventToEdit.id
                        );
                    } else {
                        // Fallback: delete by date match if no id was present
                        const eventDate = new Date(`${this.eventToEdit.event_date}T12:00:00`).toLocaleDateString('en-CA');
                        self.currentWorkouts = (self.currentWorkouts || []).filter(
                            (e) => new Date(`${e.date}T12:00:00`).toLocaleDateString('en-CA') !== eventDate
                        );
                    }

                    // Keep global JSON in sync for the AI Coach LWC
                    window.currentTrainingPlanJson = self.currentWorkouts;

                    this.loadWorkouts();
                    this.isModalOpen = false;
                    this.eventToEdit = null;
                },

                exportAsCSV() {
                    exportToCSV(this.workouts);
                },

                exportAsPDF() {
                    exportToPDF(this.workouts);
                },

                exportAsCal() {
                    exportToICS(this.workouts);
                },

                dropdown() {
                    return {
                        open: false,
                        dropdownStyles: '',
                        toggleDropdown() {
                            this.open = !this.open;
                            if (this.open) {
                                this.$nextTick(() => {
                                    const rect = this.$refs.toggle.getBoundingClientRect();
                                    let left = rect.right - 192;
                                    left = Math.max(left, 0);
                                    if (left + 192 > window.innerWidth) {
                                        left = window.innerWidth - 192;
                                    }
                                    this.dropdownStyles = `position: fixed; top: ${rect.bottom}px; left: ${left}px;`;
                                });
                            }
                        },
                        closeDropdown() {
                            this.open = false;
                        }
                    }
                }

            };
        },

        // Safely destroy any existing analytics charts
        destroyAnalyticsCharts() {
            const c = this.analyticsCharts || {};
            if (c.weeklyTrend && typeof c.weeklyTrend.destroy === 'function') c.weeklyTrend.destroy();
            if (c.typeBreakdown && typeof c.typeBreakdown.destroy === 'function') c.typeBreakdown.destroy();
            if (c.longRun && typeof c.longRun.destroy === 'function') c.longRun.destroy();
            if (c.paceProgression && typeof c.paceProgression.destroy === 'function') c.paceProgression.destroy();
            if (c.trainingPhaseBreakdown && typeof c.trainingPhaseBreakdown.destroy === 'function') c.trainingPhaseBreakdown.destroy();
            if (c.easyVsQualityRatio && typeof c.easyVsQualityRatio.destroy === 'function') c.easyVsQualityRatio.destroy();
            if (c.cumulativeVolume && typeof c.cumulativeVolume.destroy === 'function') c.cumulativeVolume.destroy();
            this.analyticsCharts = { weeklyTrend: null, typeBreakdown: null, longRun: null, paceProgression: null, trainingPhaseBreakdown: null, easyVsQualityRatio: null, cumulativeVolume: null };
        },

        // Internal: used to retry chart rendering when canvases are not yet in the DOM (mobile modal)
        _chartsRetryCount: 0,

        // Internal: sizing defaults that work both inline and inside the mobile charts modal
        _getChartSizingOptions(forceMobileSizing) {
            const mobile = !!forceMobileSizing || !!this.isMobile || !!this.chartsModalOpen;

            return {
                responsive: true,
                // In modals, maintainAspectRatio often makes charts tiny.
                maintainAspectRatio: !mobile,
                // Only meaningful when maintainAspectRatio is true
                aspectRatio: mobile ? 1.1 : 2,
                plugins: {
                    legend: {
                        labels: { color: "#e5e7eb" },
                        position: mobile ? "bottom" : "top"
                    }
                }
            };
        },

        // Internal: if a canvas is missing (DOM not ready), retry a few times
        _retryChartsIfMissing(opts) {
            const retryIfMissing = !!(opts && opts.retryIfMissing);
            if (!retryIfMissing) return false;

            this._chartsRetryCount = (this._chartsRetryCount || 0) + 1;
            if (this._chartsRetryCount > 6) return false;

            setTimeout(() => {
                this.loadAnalyticsCharts({ ...(opts || {}), retryIfMissing: true });
            }, 60);

            return true;
        },

        // Aggregate data for Cumulative Volume chart
        _getCumulativeVolumeData(weekly) {
            const cumulativeVolume = [];
            let runningTotal = 0;
            for (let i = 0; i < weekly.length; i++) {
                runningTotal += (weekly[i] || 0);
                cumulativeVolume.push(runningTotal);
            }
            return cumulativeVolume;
        },

        // Aggregate data for Training Phase Breakdown
        _getTrainingPhaseData(weekly, weekCount) {
            const phaseData = { base: 0, build: 0, peak: 0, taper: 0 };
            const phaseWeeks = { base: 0, build: 0, peak: 0, taper: 0 };

            for (let i = 0; i < weekCount; i++) {
                const phase = getTrainingPhaseForWeek(i, weekCount);
                phaseData[phase] += (weekly[i] || 0);
                phaseWeeks[phase] += 1;
            }

            return {
                phases: ['Base', 'Build', 'Peak', 'Taper'],
                phaseMileage: [
                    Math.round(phaseData.base),
                    Math.round(phaseData.build),
                    Math.round(phaseData.peak),
                    Math.round(phaseData.taper)
                ],
                phaseWeeks: [phaseWeeks.base, phaseWeeks.build, phaseWeeks.peak, phaseWeeks.taper]
            };
        },

        // Aggregate data for Easy vs Quality Ratio chart
        _getEasyVsQualityData(workouts) {
            let easyCount = 0;
            let qualityCount = 0;

            workouts.forEach(w => {
                if (w.event_type === 'Easy Run') {
                    easyCount += 1;
                } else if (w.event_type === 'Speed Workout' || w.event_type === 'Tempo' || w.event_type === 'Long Run') {
                    qualityCount += 1;
                }
            });

            return { easyCount, qualityCount };
        },

        // Build analytics data series from currentWorkouts
        _buildAnalyticsData() {
            const workouts = this.currentWorkouts || [];
            if (!workouts.length) {
                return {
                    labels: [],
                    weekly: [],
                    typeCounts: { 'Easy Run': 0, 'Speed Workout': 0, 'Long Run': 0, 'Race': 0 },
                    longRun: [],
                    tempoPace: [],
                    speedPace: [],
                    tempoTarget: [],
                    speedTarget: []
                };
            }

            // Sort by date and anchor weeks to the Monday of the first workout
            const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
            const firstDate = new Date(sorted[0].date);
            const startMonday = getPreviousMonday(firstDate);

            const msPerWeek = 7 * 24 * 60 * 60 * 1000;
            const weekIndex = (d) => Math.max(0, Math.floor((new Date(d) - startMonday) / msPerWeek));

            const weeklyMileage = [];
            const typeCounts = { 'Easy Run': 0, 'Speed Workout': 0, 'Long Run': 0, 'Race': 0 };
            const longRunByWeek = {};
            const tempoPacesByWeek = {};
            const speedPacesByWeek = {};

            sorted.forEach(w => {
                const wk = weekIndex(w.date);
                const dist = parseFloat(w.event_distance || 0) || 0;
                weeklyMileage[wk] = (weeklyMileage[wk] || 0) + dist;
                if (w.event_type in typeCounts) typeCounts[w.event_type] += dist;
                if (w.event_type === 'Long Run') {
                    longRunByWeek[wk] = Math.max(longRunByWeek[wk] || 0, dist);
                }
                const paceDec = parseFloat(w.event_pace_decimal);
                if (!isNaN(paceDec)) {
                    if (w.event_workout === 'Tempo') {
                        (tempoPacesByWeek[wk] = tempoPacesByWeek[wk] || []).push(paceDec);
                    } else if (w.event_workout === 'Speed') {
                        (speedPacesByWeek[wk] = speedPacesByWeek[wk] || []).push(paceDec);
                    }
                }
            });

            const weekCount = Math.max(weeklyMileage.length, parseInt(this.numOfWeeksInTraining || weeklyMileage.length || 0, 10));
            const labels = Array.from({ length: weekCount }, (_, i) => `Week ${i + 1}`);
            const weekly = Array.from({ length: weekCount }, (_, i) => weeklyMileage[i] || 0);
            const longRun = Array.from({ length: weekCount }, (_, i) => longRunByWeek[i] || 0);
            const avg = (arr) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
            const tempoPace = Array.from({ length: weekCount }, (_, i) => avg(tempoPacesByWeek[i]));
            const speedPace = Array.from({ length: weekCount }, (_, i) => avg(speedPacesByWeek[i]));
            const longRunPct = Array.from({ length: weekCount }, (_, i) => {
                const w = weekly[i] || 0;
                const lr = longRun[i] || 0;
                return w > 0 ? (lr / w) * 100 : null;
            });

            const goalPace = this.selectedGoal || window.paceGoal || null;

            const tempoTarget = Array.from({ length: weekCount }, (_, i) => {
                const phase = getTrainingPhaseForWeek(i, weekCount);
                return getTargetPaceDecimal("Tempo", goalPace, phase);
            });

            const speedTarget = Array.from({ length: weekCount }, (_, i) => {
                const phase = getTrainingPhaseForWeek(i, weekCount);
                return getTargetPaceDecimal("Speed", goalPace, phase);
            });

            // Summary
            const total = weekly.reduce((a, b) => a + b, 0);
            const easy = typeCounts['Easy Run'] || 0;
            const speed = typeCounts['Speed Workout'] || 0;
            const long = typeCounts['Long Run'] || 0;
            const denom = Math.max(total, 1);

            this.analyticsSummary.totalMileage = total;
            this.analyticsSummary.typePercents = {
                easy: Math.round((easy / denom) * 100),
                speed: Math.round((speed / denom) * 100),
                long: Math.round((long / denom) * 100),
            };
            this.analyticsSummary.peakWeekMileage = weekly.reduce((m, v) => Math.max(m, v), 0);

            // Calculate data for new charts
            const cumulativeVolume = this._getCumulativeVolumeData(weekly);
            const phaseBreakdown = this._getTrainingPhaseData(weekly, weekCount);
            const easyQualityRatio = this._getEasyVsQualityData(workouts);

            return {
                labels,
                weekly,
                typeCounts,
                longRun,
                longRunPct,
                tempoPace,
                speedPace,
                tempoTarget,
                speedTarget,
                cumulativeVolume,
                phaseBreakdown,
                easyQualityRatio
            };
        },

        // Render the Analytics tab charts
        loadAnalyticsCharts(opts = {}) {
            if (!this.currentWorkouts || this.currentWorkouts.length === 0) {
                this.destroyAnalyticsCharts();
                this._chartsRetryCount = 0;
                return;
            }

            const render = () => {
                this.destroyAnalyticsCharts();
                const {
                    labels,
                    weekly,
                    typeCounts,
                    longRun,
                    longRunPct,
                    tempoPace,
                    speedPace,
                    tempoTarget,
                    speedTarget,
                    cumulativeVolume,
                    phaseBreakdown,
                    easyQualityRatio
                } = this._buildAnalyticsData();

                const sizing = this._getChartSizingOptions(opts.forceMobileSizing);

                // Weekly Mileage + Long Run (dual-axis) + Long Run % (line)
                const t1 = document.getElementById('weeklyMileageTrend');
                if (!t1) {
                    if (this._retryChartsIfMissing(opts)) return;
                } else {
                    this.analyticsCharts.weeklyTrend = new Chart(t1, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [
                                {
                                    label: 'Weekly Mileage',
                                    data: weekly,
                                    yAxisID: 'y',
                                    borderWidth: 2,
                                    tension: 0.25,
                                    borderColor: '#60a5fa', // blue-400
                                    backgroundColor: 'rgba(96,165,250,0.15)',
                                    pointBackgroundColor: '#93c5fd',
                                    pointBorderColor: '#93c5fd',
                                    pointRadius: 3,
                                    pointHoverRadius: 4
                                },
                                {
                                    label: 'Long Run (mi)',
                                    data: longRun,
                                    yAxisID: 'y1',
                                    borderWidth: 2,
                                    tension: 0.25,
                                    borderColor: '#a78bfa', // violet-300
                                    backgroundColor: 'rgba(167,139,250,0.18)',
                                    pointBackgroundColor: '#c4b5fd',
                                    pointBorderColor: '#c4b5fd',
                                    pointRadius: 3,
                                    pointHoverRadius: 4
                                },
                                {
                                    label: 'Long Run % of Week',
                                    data: longRunPct,
                                    yAxisID: 'y2',
                                    borderWidth: 2,
                                    tension: 0.25,
                                    spanGaps: true,
                                    borderColor: '#f472b6', // pink-400
                                    backgroundColor: 'rgba(244,114,182,0.10)',
                                    pointBackgroundColor: '#f9a8d4',
                                    pointBorderColor: '#f9a8d4',
                                    pointRadius: 2,
                                    pointHoverRadius: 4,
                                    borderDash: [6, 6]
                                }
                            ]
                        },
                        options: {
                            ...sizing,
                            scales: {
                                x: {
                                    ticks: { color: '#cbd5e1' },
                                    grid: { color: 'rgba(255,255,255,0.06)' }
                                },
                                y: {
                                    beginAtZero: true,
                                    position: 'left',
                                    ticks: { color: '#cbd5e1' },
                                    grid: { color: 'rgba(255,255,255,0.06)' }
                                },
                                y1: {
                                    beginAtZero: true,
                                    position: 'right',
                                    ticks: { color: '#cbd5e1' },
                                    grid: { drawOnChartArea: false }
                                },
                                y2: {
                                    beginAtZero: true,
                                    position: 'right',
                                    offset: true,
                                    ticks: {
                                        color: '#cbd5e1',
                                        callback: (v) => `${Math.round(v)}%`
                                    },
                                    min: 0,
                                    max: 100,
                                    grid: { drawOnChartArea: false }
                                }
                            },
                            plugins: {
                                ...(sizing.plugins || {}),
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const label = ctx.dataset.label || '';
                                            const v = ctx.parsed.y;
                                            if (ctx.dataset.yAxisID === 'y2') {
                                                return `${label}: ${Math.round(v)}%`;
                                            }
                                            return `${label}: ${v}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                // Workout Type Breakdown (doughnut)
                const t2 = document.getElementById('workoutTypeBreakdown');
                if (t2) {
                    this.analyticsCharts.typeBreakdown = new Chart(t2, {
                        type: 'doughnut',
                        data: {
                            labels: Object.keys(typeCounts),
                            datasets: [{
                                data: Object.values(typeCounts).map(v => Math.round(v)),
                                backgroundColor: ['#34d399', '#ef4444', '#8b5cf6', '#60a5fa'],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            ...sizing,
                            // Doughnut looks better with a squarer aspect on desktop; mobile sizing handled by maintainAspectRatio=false
                            aspectRatio: sizing.maintainAspectRatio ? 1.6 : undefined,
                            plugins: {
                                ...(sizing.plugins || {})
                            }
                        }
                    });
                }

                // Pace Progression (Tempo & Speed)
                const t4 = document.getElementById('paceProgression');
                if (t4) {
                    this.analyticsCharts.paceProgression = new Chart(t4, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [
                                // Tempo target (continuous line)
                                {
                                    label: 'Tempo Focus Pace',
                                    data: tempoTarget,
                                    borderWidth: 3,
                                    tension: 0.25,
                                    spanGaps: true,
                                    borderColor: '#22d3ee',
                                    backgroundColor: 'rgba(34,211,238,0.10)',
                                    pointRadius: 0
                                },
                                // Tempo actual (points only)
                                {
                                    label: 'Tempo Workout Pace',
                                    data: tempoPace,
                                    showLine: false,
                                    spanGaps: true,
                                    pointRadius: 5,
                                    pointHoverRadius: 7,
                                    borderColor: '#67e8f9',
                                    backgroundColor: 'rgba(103,232,249,0.9)'
                                },
                                // Speed target (continuous line)
                                {
                                    label: 'Speed Focus Pace',
                                    data: speedTarget,
                                    borderWidth: 3,
                                    tension: 0.25,
                                    spanGaps: true,
                                    borderColor: '#facc15',
                                    backgroundColor: 'rgba(250,204,21,0.10)',
                                    pointRadius: 0
                                },
                                // Speed actual (points only)
                                {
                                    label: 'Speed Workout Pace',
                                    data: speedPace,
                                    showLine: false,
                                    spanGaps: true,
                                    pointRadius: 5,
                                    pointHoverRadius: 7,
                                    borderColor: '#fde047',
                                    backgroundColor: 'rgba(253,224,71,0.9)'
                                }
                            ]
                        },
                        options: {
                            ...sizing,
                            // Desktop can keep wider; mobile modal sizing uses maintainAspectRatio=false
                            aspectRatio: sizing.maintainAspectRatio ? 2 : undefined,
                            scales: {
                                y: {
                                    reverse: true,
                                    ticks: {
                                        callback: (v) => formatPaceFromDecimal(v)
                                    }
                                }
                            },
                            plugins: {
                                ...(sizing.plugins || {}),
                                title: {
                                    display: true,
                                    text: 'Pace Progression by Training Focus',
                                    color: '#e5e7eb',
                                    font: { size: 16, weight: '600' },
                                    padding: { bottom: 4 }
                                },
                                subtitle: {
                                    display: true,
                                    text: 'Focus pace shows the intended emphasis for each week. Workout pace appears only when that workout is scheduled.',
                                    color: '#9ca3af',
                                    font: { size: 12 },
                                    padding: { bottom: 12 }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const label = ctx.dataset.label || '';
                                            return `${label}: ${formatPaceFromDecimal(ctx.parsed.y)} /mi`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                // Training Phase Breakdown (stacked bar chart)
                const t6 = document.getElementById('trainingPhaseBreakdown');
                if (t6) {
                    this.analyticsCharts.trainingPhaseBreakdown = new Chart(t6, {
                        type: 'bar',
                        data: {
                            labels: ['Training Phases'],
                            datasets: [
                                {
                                    label: 'Base',
                                    data: [phaseBreakdown.phaseMileage[0]],
                                    backgroundColor: '#10b981' // green-500
                                },
                                {
                                    label: 'Build',
                                    data: [phaseBreakdown.phaseMileage[1]],
                                    backgroundColor: '#3b82f6' // blue-500
                                },
                                {
                                    label: 'Peak',
                                    data: [phaseBreakdown.phaseMileage[2]],
                                    backgroundColor: '#ef4444' // red-500
                                },
                                {
                                    label: 'Taper',
                                    data: [phaseBreakdown.phaseMileage[3]],
                                    backgroundColor: '#f59e0b' // amber-500
                                }
                            ]
                        },
                        options: {
                            indexAxis: 'y',
                            ...sizing,
                            scales: {
                                x: {
                                    stacked: true,
                                    ticks: { color: '#cbd5e1' },
                                    grid: { color: 'rgba(255,255,255,0.06)' }
                                },
                                y: {
                                    stacked: true,
                                    ticks: { color: '#cbd5e1' }
                                }
                            },
                            plugins: {
                                ...(sizing.plugins || {}),
                                tooltip: {
                                    callbacks: {
                                        afterLabel: (ctx) => {
                                            const phaseIndex = ctx.datasetIndex;
                                            const weeks = phaseBreakdown.phaseWeeks[phaseIndex];
                                            return `${weeks} week${weeks !== 1 ? 's' : ''}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                // Easy vs Quality Ratio (doughnut chart)
                const t7 = document.getElementById('easyVsQualityRatio');
                if (t7) {
                    const total = easyQualityRatio.easyCount + easyQualityRatio.qualityCount;
                    this.analyticsCharts.easyVsQualityRatio = new Chart(t7, {
                        type: 'doughnut',
                        data: {
                            labels: ['Easy', 'Tempo/Speed/Long'],
                            datasets: [{
                                data: [easyQualityRatio.easyCount, easyQualityRatio.qualityCount],
                                backgroundColor: ['#86efac', '#fb923c'], // light green, orange
                                borderWidth: 0
                            }]
                        },
                        options: {
                            ...sizing,
                            aspectRatio: sizing.maintainAspectRatio ? 1.6 : undefined,
                            plugins: {
                                ...(sizing.plugins || {}),
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const value = ctx.parsed;
                                            const percent = Math.round((value / total) * 100);
                                            return `${ctx.label}: ${value} (${percent}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                }

                // Cumulative Volume Progression (full-width line chart)
                const t8 = document.getElementById('cumulativeVolume');
                if (t8) {
                    this.analyticsCharts.cumulativeVolume = new Chart(t8, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Cumulative Mileage',
                                data: cumulativeVolume,
                                borderWidth: 3,
                                tension: 0.25,
                                fill: true,
                                borderColor: '#0ea5e9', // cyan-500
                                backgroundColor: 'rgba(14,165,233,0.15)',
                                pointBackgroundColor: '#06b6d4',
                                pointBorderColor: '#06b6d4',
                                pointRadius: 3,
                                pointHoverRadius: 4
                            }]
                        },
                        options: {
                            ...sizing,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { color: '#cbd5e1' },
                                    grid: { color: 'rgba(255,255,255,0.06)' }
                                },
                                x: {
                                    ticks: { color: '#cbd5e1' },
                                    grid: { color: 'rgba(255,255,255,0.06)' }
                                }
                            },
                            plugins: {
                                ...(sizing.plugins || {})
                            }
                        }
                    });
                }

                // Successful render; clear retry counter
                this._chartsRetryCount = 0;
            };

            // Ensure canvases exist (tab just switched). Use Alpine's nextTick if available.
            if (typeof this.$nextTick === 'function') {
                this.$nextTick(() => {
                    requestAnimationFrame(render);
                });
            } else {
                // Fallback: allow the DOM to paint, then render next frame
                setTimeout(() => requestAnimationFrame(render), 0);
            }
        },

        loadBarChart() {
            setTimeout(() => {
                setupBarChart(this.currentWorkouts);
            }, 0);
        }
    };
}
