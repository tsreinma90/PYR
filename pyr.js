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
    { label: '8 Week Training Plan', value: 8 },
    { label: '10 Week Training Plan', value: 10},
    { label: '12 Week Training Plan', value: 12 },
    { label: '14 Week Training Plan', value: 14 },
    { label: '16 Week Training Plan', value: 16 },
    { label: '20 Week Training Plan', value: 20 },
];

window.addEventListener("load", function () {
    setTimeout(function () {
        configureSlider();
        // preventRightClickOnPage();
    }, 0);
});

let init = false;

function configureSlider() {
    const weeklyMileageSlider = document.getElementById("weeklyMileageSlider");
    if (!weeklyMileageSlider) {
        console.error("Slider element not found!");
        return;
    }

    // Destroy existing slider instance if it exists
    if (weeklyMileageSlider.noUiSlider) {
        weeklyMileageSlider.noUiSlider.destroy();
    }

    // Generate pace values from 4:00 to 13:00 (5-second increments)
    const paceValues = Array.from({ length: ((13 - 4) * 60) / 5 + 1 }, (_, i) => {
        const totalSeconds = (4 * 60) + (i * 5);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    });

    const paceFormat = {
        to: value => paceValues[Math.round(value)],
        from: value => paceValues.indexOf(value)
    };

    noUiSlider.create(weeklyMileageSlider, {
        start: [paceValues.indexOf("9:00")], // Default to 9:00 min/mile
        connect: [true, true],
        tooltips: [{ to: paceFormat.to, from: paceFormat.from }],
        format: paceFormat,
        range: { min: 0, max: paceValues.length - 1 },
        step: 1
    });

    // Ensure it sets correctly to 9:00
    weeklyMileageSlider.noUiSlider.set(paceValues.indexOf("9:00"));

    // Move tooltip below slider
    document.querySelectorAll(".noUi-tooltip").forEach(tooltip => {
        tooltip.style.bottom = "-40px"; // Adjust this value as needed
    });
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
        
                // Define the cutoffs for each training plan
                if (weeksUntilRace < 10) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value === 8);
                } else if (weeksUntilRace < 12) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 10);
                } else if (weeksUntilRace < 14) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 12);
                } else if (weeksUntilRace < 16) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 14);
                } else if (weeksUntilRace <= 20) {
                    return PLAN_LENGTH_OPTIONS.filter(option => option.value <= 16);
                } else {
                    return PLAN_LENGTH_OPTIONS; // Show all options if race is 20+ weeks away
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
        confirmation: {},
        currentTab: 'Calendar',
        tabs: [
            //{ name: 'Overview' },
            { name: 'Calendar' },
            { name: 'Training Load Summary' }
        ],

        // master-list of all workouts
        currentWorkouts: [
            { date: "2025-01-05", title: "Rest day", notes: "Take it easy.", theme: "red", event_type: "" },
            { date: "2025-01-06", title: "5 miles easy run", notes: "Focus on breathing and steady pace.", theme: "blue", event_type: "" },
            { date: "2025-01-07", title: "4 miles tempo run", notes: "Warm-up: 1 mile\nTempo: 2 miles @ 8:00 min/mile\nCool-down: 1 mile", theme: "blue", event_type: "" },
            { date: "2025-01-08", title: "5 miles recovery run", notes: "Keep heart rate low.", theme: "green", event_type: "" },
            { date: "2025-01-09", title: "Rest day", notes: "Optional yoga or light stretching.", theme: "red", event_type: "" },
            { date: "2025-01-10", title: "7 miles long run", notes: "Progressive pace, finish strong.", theme: "blue", event_type: "" },
            { date: "2025-01-11", title: "8 miles trail run", notes: "Practice uphill strides.", theme: "purple", event_type: "" }
        ],

        validateField(fieldName) {
            this.errors[fieldName] = ''; // Clear existing errors
            this.confirmation[fieldName] = ''; // Clear existing confirmations
            
            if (fieldName === 'raceDate') {
                const raceDate = new Date(this.raceDate);
                const today = new Date();
                
                // Ensure time is set to midnight for proper comparison
                today.setHours(0, 0, 0, 0);
                raceDate.setHours(0, 0, 0, 0);
        
                // Calculate the min and max allowed race dates
                const minRaceDate = new Date(today);
                minRaceDate.setDate(today.getDate() + 56); // 8 weeks
        
                const maxRaceDate = new Date(today);
                maxRaceDate.setDate(today.getDate() + 140); // 20 weeks
                
                // Validate race date
                if (isNaN(raceDate.getTime())) {
                    this.errors.raceDate = 'Please enter a valid race date.';
                } else if (raceDate < minRaceDate) {
                    this.errors.raceDate = `Race date must be at least 8 weeks from today (${minRaceDate.toLocaleDateString()}).`;
                    console.log('too short');
                } else if (raceDate > maxRaceDate) {
                    this.errors.raceDate = `Race date cannot be more than 20 weeks from today (${maxRaceDate.toLocaleDateString()}).`;
                    console.log('too long');
                } else {
                    this.confirmation.raceDate = 'Race date saved successfully!';
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
                } else {
                    this.confirmation.raceTime = 'Race time saved successfully!';
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
                } else {
                    this.confirmation.weeklyMileage = 'Mileage saved successfully!';
                }
            }
        },
        
        // not being used currently.
        /* editableTable() {
            const self = this;
            return {
                // Days of the week
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                weeks: [],
                init() {
                    this.weeks = self.mapWorkoutsToWeeks();
                },
                // Cell editing state
                editingCell: { index: null, field: null },
                // Function to edit a cell
                editCell(index, field) {
                    this.editingCell = { index, field };
                },
                // Function to save a cell
                saveCell() {
                    this.editingCell = { index: null, field: null };
                    self.updateWorkoutsFromWeeks(this.weeks);
                },
                // Function to cancel editing
                cancelEdit() {
                    this.editingCell = { index: null, field: null };
                },
            }
        }, */

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
                },
        
                // Load workouts from `currentWorkouts`
                loadWorkouts() {
                    this.workouts = self.currentWorkouts.map((workout) => ({
                        event_date: workout.date,
                        event_title: workout.title,
                        event_notes: workout.notes,
                        event_theme: workout.theme,
                        event_type: workout.event_type
                    }));
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
                        this.eventToEdit = {
                            event_date: new Date(this.year, this.month, date).toISOString().split("T")[0],
                            event_title: "",
                            event_notes: "",
                            event_theme: "blue", // Default theme
                            date,
                        };
                    }
        
                    this.isModalOpen = true;
                },
        
                // Save Event and Sync to `currentWorkouts`
                saveEvent() {
                    const eventDate = new Date(this.year, this.month, this.eventToEdit.date).toDateString();
                    const index = self.currentWorkouts.findIndex(
                        (e) => new Date(e.date).toDateString() === eventDate
                    );
                
                    if (index !== -1) {
                        // Update existing event
                        self.currentWorkouts[index] = {
                            date: this.eventToEdit.event_date,
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: this.eventToEdit.event_theme,
                            event_type: this.eventToEdit.event_type, // Include event type
                        };
                    } else {
                        // Add new event
                        self.currentWorkouts.push({
                            date: this.eventToEdit.event_date,
                            title: this.eventToEdit.event_title,
                            notes: this.eventToEdit.event_notes,
                            theme: this.eventToEdit.event_theme,
                            event_type: this.eventToEdit.event_type, // Include event type
                        });
                    }
                
                    // Reload workouts for the calendar view
                    this.loadWorkouts();
                    this.isModalOpen = false;
                },
            };
        },
    };
}