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
    { label: '20 Week Training Plan', value: 20 }
];

const EVENT_COLOR_MAP = new Map([
    ["Easy Run", "green"],
    ["Speed Workout", "red"],
    ["Long Run", "purple"],
    ["Race", "blue"]
]);

function exportToCSV(events) {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Group events by week number
    const grouped = {};

    events.forEach(event => {
        const dateObj = new Date(event.event_date);
        const monday = getMonday(dateObj);
        const weekKey = monday.toISOString().split('T')[0];

        if (!grouped[weekKey]) {
            grouped[weekKey] = Array(7).fill('');
        }

        const dayIndex = (dateObj.getDay() + 6) % 7; // Convert Sun–Sat => 6–5
        grouped[weekKey][dayIndex] = event.event_distance || '';
    });

    const header = ['Week', ...daysOfWeek, 'Total'];
    const rows = Object.entries(grouped).map(([weekStart, distances], i) => {
        const total = distances.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        return [i + 1, ...distances, total.toFixed(1)];
    });

    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
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
    const grouped = {};

    events.forEach(event => {
        const dateObj = new Date(event.event_date);
        const monday = getMonday(dateObj);
        const weekKey = monday.toISOString().split('T')[0];

        if (!grouped[weekKey]) {
            grouped[weekKey] = Array(7).fill('');
        }

        // Calculate day index: Monday=0, Sunday=6
        const dayIndex = (dateObj.getDay() + 6) % 7;
        grouped[weekKey][dayIndex] = event.event_distance || '';
    });

    const rows = Object.entries(grouped).map(([weekStart, distances], i) => {
        const total = distances.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        return [i + 1, ...distances, total.toFixed(1)];
    });

    const header = ['Week', ...daysOfWeek, 'Total'];

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
            fontSize: 10,
            cellPadding: 3,
        },
        columnStyles: {
            0: { halign: 'center' },
            8: { fontStyle: 'bold' }
        }
    });

    doc.save("training_plan.pdf");
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

function transformEvent(event) {
    // Map event_workout to event_type
    const workoutTypeMap = {
        "Easy": "Easy Run",
        "Speed": "Speed Workout",
        "Tempo": "Speed Workout",
        "Long": "Long Run",
        "Race": "Race"
    };

    // Ensure event_date is properly formatted
    const date = new Date(event.event_date).toISOString().split("T")[0];

    return {
        date: date, // Extract YYYY-MM-DD
        title: `${event.event_distance} miles ${event.event_workout.toLowerCase()} run`,
        event_distance: event.event_distance,
        notes: event.event_notes,
        theme: "", // Leaving this empty as per your request
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

function exportToPDF(events) {
    // Using the jsPDF library (ensure it's loaded)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 10;

    events.forEach((event, index) => {
        const dateStr = new Date(event.event_date).toLocaleDateString();
        doc.text(`Date: ${dateStr}`, 10, y);
        y += 6;
        doc.text(`Title: ${event.event_title}`, 10, y);
        y += 6;
        doc.text(`Workout: ${event.event_workout}`, 10, y);
        y += 6;
        doc.text(`Distance: ${event.event_distance} miles`, 10, y);
        y += 6;
        doc.text(`Notes: ${event.event_notes}`, 10, y);
        y += 10;

        // Add a new page if we're near the bottom
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
    });

    doc.save("training_plan.pdf");
}

function triggerPlanGeneratedCustomEvent() {
    const event = new CustomEvent("trainingplangenerated", {
        detail: { message: null, time: new Date() }
    });
    document.dispatchEvent(event);
}

function convertPaceToDecimal(pace) {
    // Trim to the first 4 characters (e.g., "9:05" → "9:0")
    pace = pace.trim().slice(0, 4);

    let [minutes, seconds] = pace.split(":").map(Number);
    return minutes + (seconds / 60);
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
        console.warn("myChart canvas not found; skipping bar chart render for now.");
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
    return Math.min(20, Math.floor((eventDate - startOfWeek1) / msPerWeek) + 1);
}

// **Helper function to get month name from a date**
function getMonthName(date) {
    return date.toLocaleString('default', { month: 'long' });
}

window.addEventListener("load", function () {
    Chart.register(monthLabelPlugin);
    Chart.register(trainingPhasePlugin);
    setTimeout(function () {
        configureSlider();
        window.paceGoal = '9:00 min/mi';
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

function sharedState() {
    return {
        // Constants
        daysOfWeek: DAYS_OF_WEEK,
        raceDistanceOptions: DISTANCE_OPTIONS,

        get raceDateOptions() {
            if (!this.raceDate) {
                return PLAN_LENGTH_OPTIONS; // Show all options when no race date is selected
            } else {
                const today = new Date();
                const raceDay = new Date(this.raceDate);
                const weeksUntilRace = Math.floor((raceDay - today) / (1000 * 60 * 60 * 24 * 7)); // Convert ms to weeks

                // New logic
                if (weeksUntilRace < 6) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value === 4);
                } else if (weeksUntilRace < 8) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 6);
                } else if (weeksUntilRace < 10) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 8);
                } else if (weeksUntilRace < 12) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 10);
                } else if (weeksUntilRace < 14) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 12);
                } else if (weeksUntilRace < 16) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 14);
                } else if (weeksUntilRace <= 20) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 16);
                } else {
                    return PLAN_LENGTH_OPTIONS;
                }
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
        currentTab: 'Calendar',
        tabs: [
            //{ name: 'Overview' },
            { name: 'Calendar' },
            { name: 'Training Load Summary' }
        ],
        miles: Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: i + 1 })),

        // Track the active tab for the new tab state
        activeTab: 'calendar',

        average_mileage_weekly: 0,
        average_mileage_daily: 0,
        numOfWeeksInTraining: 0,

        // Analytics summary and chart refs
        analyticsSummary: {
            totalMileage: 0,
            typePercents: { easy: 0, speed: 0, long: 0 },
            peakWeekMileage: 0,
        },
        analyticsCharts: { weeklyTrend: null, typeBreakdown: null, longRun: null },

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

        // --- AI Coach shared state ---
        userInput: "",
        enhancedOutput: "",
        loading: false,

        // Root Alpine init – wires up listeners for the LWC bridge events
        init() {
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
                maxRaceDate.setDate(today.getDate() + 140); // 20 weeks

                // Validate race date
                if (isNaN(raceDate.getTime())) {
                    this.errors.raceDate = 'Please enter a valid race date.';
                } else if (raceDate < minRaceDate) {
                    this.errors.raceDate = `Race date must be at least 4 weeks from today (${minRaceDate.toLocaleDateString()}).`;
                } else if (raceDate > maxRaceDate) {
                    this.errors.raceDate = `Race date cannot be more than 20 weeks from today (${maxRaceDate.toLocaleDateString()}).`;
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
                const mileage = parseInt(this.weeklyMileage, 10);

                // Validate mileage input
                if (!mileage || isNaN(mileage) || mileage <= 0) {
                    this.errors.weeklyMileage = 'Please enter a valid number greater than 0.';
                    this.selectedWeeklyMileage = null;
                } else if (mileage < 10) {
                    this.errors.weeklyMileage = 'Mileage must be at least 10 miles per week.';
                    this.selectedWeeklyMileage = null;
                } else if (mileage > 130) {
                    this.errors.weeklyMileage = 'Mileage cannot exceed 130 miles per week.';
                    this.selectedWeeklyMileage = null;
                }
            }
        },

        async generatePlan() {
            this.selectedGoal = window.paceGoal?.[0];
            // to-do, strange bug
            if (this.selectedGoal === '9') {
                this.selectedGoal = '9:00 min/mi';
            }

            if (!this.formComplete) {
                this.showErrorToast = true;

                // Make sure the toast disappears every time
                setTimeout(() => {
                    this.showErrorToast = false;
                }, 3000);

                return;
            } else {
                const numberOfWeeksUntilRace = this.selectedTimeframe.substring(0, 2).trim();
                const startDate = this.getTrainingStartDate(this.raceDate, numberOfWeeksUntilRace);
                const mileageTarget = this.getWeeklyMileage(this.selectedWeeklyMileage, this.selectedRaceDistance, this.selectedGoal);
                const trainingController = await import("./trainingPlanGenerator.js");
                const allRuns = trainingController.createTrainingPlan(
                    startDate, mileageTarget, this.raceDate, this.selectedGoal, numberOfWeeksUntilRace
                );
                this.currentWorkouts = [];
                let totalDistance = 0
                for (let i = 0; i < allRuns.length; i++) {
                    if (allRuns[i].event_distance && allRuns[i].event_workout != 'Rest') {
                        this.currentWorkouts.push(transformEvent(allRuns[i]));
                        totalDistance += allRuns[i].event_distance;
                    }
                }
                // Expose the current training plan globally for the AI Coach LWC
                window.currentTrainingPlanJson = this.currentWorkouts;

                this.numOfWeeksInTraining = numberOfWeeksUntilRace;
                this.average_mileage_weekly = Math.ceil(totalDistance / numberOfWeeksUntilRace);
                this.average_mileage_daily = Math.ceil(this.average_mileage_weekly / 6);
                triggerPlanGeneratedCustomEvent();
                if (this.activeTab === 'analytics') {
                    this.loadAnalyticsCharts();
                }
            }
        },

        async enhancePlan() {
            // Clear previous output and show loading state
            this.loading = true;
            this.enhancedOutput = "";

            // Ensure the LWC bridge is ready
            const cmp = window.trainingPlanReviewCmp;
            console.log('*** trainingPlanReviewCmp:', cmp);
            if (!cmp || typeof cmp.reviewPlan !== "function") {
                console.error("trainingPlanReviewCmp is not ready or has no reviewPlan() method.");
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

            console.log('*** events to review:', req.trainingPlanJson.length);

            try {
                // Call the LWC @api method with a single request object
                await cmp.reviewPlan(req);
                // Do not set enhancedOutput here; it will be set when the
                // trainingplanreviewed or trainingplanreviewerror events fire.
            } catch (e) {
                console.error('*** reviewTrainingPlan ERROR raw:', e);

                // LWC / Apex-style errors usually have body.message etc.
                if (e && e.body) {
                    console.error('*** error.body:', e.body);
                    console.error('*** error.body.message:', e.body.message);
                    console.error('*** error.body.exceptionType:', e.body.exceptionType);
                    console.error('*** error.body.stackTrace:', e.body.stackTrace);
                }

                // Some Lightning Out errors show up here instead
                if (e && e.message) {
                    console.error('*** error.message:', e.message);
                }

                try {
                    console.error('*** error as JSON:', JSON.stringify(e));
                } catch (jsonErr) {
                    console.error('*** error could not be stringified:', jsonErr);
                }
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
            return this.selectedRaceDistance &&
                this.selectedTimeframe &&
                this.raceDate &&
                this.selectedGoal &&
                this.selectedWeeklyMileage;
        },

        getTrainingStartDate(raceDate, weeks) {
            // Ensure the input is a valid date
            let raceDay = new Date(raceDate);
            if (isNaN(raceDay)) {
                throw new Error("Invalid race date provided.");
            }

            // Ensure weeks is a valid number (8, 10, 12, 14, or 16)
            const validWeeks = ['4', '6', '8', '10', '12', '14', '16'];
            if (!validWeeks.includes(weeks)) {
                throw new Error("Invalid weeks provided. Must be one of: " + validWeeks.join(", "));
            }

            // Calculate the start date
            let startDate = new Date(raceDay);
            startDate.setDate(raceDay.getDate() - weeks * 7);

            return startDate.toISOString().split('T')[0]; // Return in YYYY-MM-DD format
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

                MONTH_NAMES,
                DAYS,

                // Initialize Calendar
                init() {
                    this.loadWorkouts();
                    this.calculateDays();

                    document.addEventListener("trainingplangenerated", (event) => {
                        this.loadWorkouts();
                    });
                },

                // Load workouts from `currentWorkouts`
                loadWorkouts() {
                    this.workouts = [];
                    this.workouts = self.currentWorkouts.map((workout) => ({
                        event_date: workout.date,
                        event_title: workout.title,
                        event_notes: workout.notes,
                        event_distance: workout.event_distance,
                        event_theme: EVENT_COLOR_MAP.get(workout.event_type),
                        event_type: workout.event_type
                    }));
                    if (this.workouts.length) {
                        let startingMonth = new Date(this.workouts[0].event_date).getMonth();
                        const diff = startingMonth - this.month; // should always be either 0 or 1
                        this.changeMonth(diff);
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
                    const currentDay = new Date(this.year, this.month, date);
                    return today.toDateString() === currentDay.toDateString();
                },

                // Show Edit Modal
                editEvent(event, date) {
                    this.eventToEdit = { ...event, date };
                    this.isModalOpen = true;
                },

                showEventModal(date) {
                    const existingEvent = this.workouts.find(
                        (e) =>
                            new Date(e.event_date).toDateString() ===
                            new Date(this.year, this.month, date).toDateString()
                    );

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

                    this.isModalOpen = true;
                },

                saveEvent() {
                    // Create local date string (avoid UTC conversion)
                    const eventDate = new Date(`${this.eventToEdit.event_date}T12:00:00`).toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format

                    // Normalize comparison dates to avoid drift
                    const index = self.currentWorkouts.findIndex(
                        (e) => new Date(`${e.date}T12:00:00`).toLocaleDateString('en-CA') === eventDate
                    );

                    if (index !== -1) {
                        // Update existing event
                        self.currentWorkouts[index] = {
                            date: eventDate, // Keep in local format
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: EVENT_COLOR_MAP.get(this.eventToEdit.event_type),
                            event_type: this.eventToEdit.event_type,
                            event_distance: this.eventToEdit.event_distance
                        };
                    } else {
                        // Add new event
                        self.currentWorkouts.push({
                            date: eventDate, // Store in consistent format
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: EVENT_COLOR_MAP.get(this.eventToEdit.event_type),
                            event_type: this.eventToEdit.event_type,
                            event_distance: this.eventToEdit.event_distance
                        });
                    }

                    // Keep the global training plan JSON in sync for the AI Coach LWC
                    window.currentTrainingPlanJson = self.currentWorkouts;

                    this.loadWorkouts();
                    this.isModalOpen = false;
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
            this.analyticsCharts = { weeklyTrend: null, typeBreakdown: null, longRun: null };
        },

        // Build analytics data series from currentWorkouts
        _buildAnalyticsData() {
            const workouts = this.currentWorkouts || [];
            if (!workouts.length) {
                return { labels: [], weekly: [], typeCounts: { 'Easy Run': 0, 'Speed Workout': 0, 'Long Run': 0, 'Race': 0 }, longRun: [] };
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

            sorted.forEach(w => {
                const wk = weekIndex(w.date);
                const dist = parseFloat(w.event_distance || 0) || 0;
                weeklyMileage[wk] = (weeklyMileage[wk] || 0) + dist;
                if (w.event_type in typeCounts) typeCounts[w.event_type] += dist;
                if (w.event_type === 'Long Run') {
                    longRunByWeek[wk] = Math.max(longRunByWeek[wk] || 0, dist);
                }
            });

            const weekCount = Math.max(weeklyMileage.length, parseInt(this.numOfWeeksInTraining || weeklyMileage.length || 0, 10));
            const labels = Array.from({ length: weekCount }, (_, i) => `Week ${i + 1}`);
            const weekly = Array.from({ length: weekCount }, (_, i) => weeklyMileage[i] || 0);
            const longRun = Array.from({ length: weekCount }, (_, i) => longRunByWeek[i] || 0);

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

            return { labels, weekly, typeCounts, longRun };
        },

        // Render the Analytics tab charts
        loadAnalyticsCharts() {
            if (!this.currentWorkouts || this.currentWorkouts.length === 0) {
                this.destroyAnalyticsCharts();
                return;
            }

            const render = () => {
                this.destroyAnalyticsCharts();
                const { labels, weekly, typeCounts, longRun } = this._buildAnalyticsData();

                // Weekly Mileage Trend (line)
                const t1 = document.getElementById('weeklyMileageTrend');
                if (t1) {
                    this.analyticsCharts.weeklyTrend = new Chart(t1, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Weekly Mileage',
                                data: weekly,
                                borderWidth: 2,
                                tension: 0.25,
                                borderColor: '#60a5fa', // blue-400
                                backgroundColor: 'rgba(96,165,250,0.15)',
                                pointBackgroundColor: '#93c5fd',
                                pointBorderColor: '#93c5fd',
                                pointRadius: 3,
                                pointHoverRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 2,
                            scales: {
                                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                                y: { beginAtZero: true, ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                            },
                            plugins: { legend: { labels: { color: '#e5e7eb' } } }
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
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 1.6,
                            plugins: { legend: { labels: { color: '#e5e7eb' } } }
                        }
                    });
                }

                // Long Run Progression (line)
                const t3 = document.getElementById('longRunProgression');
                if (t3) {
                    this.analyticsCharts.longRun = new Chart(t3, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [{
                                label: 'Long Run (mi)',
                                data: longRun,
                                borderWidth: 2,
                                tension: 0.25,
                                borderColor: '#a78bfa', // violet-300
                                backgroundColor: 'rgba(167,139,250,0.18)',
                                pointBackgroundColor: '#c4b5fd',
                                pointBorderColor: '#c4b5fd',
                                pointRadius: 3,
                                pointHoverRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            aspectRatio: 2,
                            scales: {
                                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                                y: { beginAtZero: true, ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.06)' } }
                            },
                            plugins: { legend: { labels: { color: '#e5e7eb' } } }
                        }
                    });
                }
            };

            // Ensure canvases exist (tab just switched). Use Alpine's nextTick if available.
            if (typeof this.$nextTick === 'function') {
                this.$nextTick(render);
            } else {
                setTimeout(render, 0);
            }
        },

        loadBarChart() {
            setTimeout(() => {
                setupBarChart(this.currentWorkouts);
            }, 0);
        }
    };
}