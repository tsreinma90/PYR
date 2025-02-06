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

/* const TRAINING_PLANS = [
    { id: 1, name: '5K Beginner Plan', description: 'Perfect for new runners aiming to complete their first 5K.', race: '5K', level: 'Beginner' },
    { id: 2, name: '5K Intermediate Plan', description: 'For experienced runners improving their 5K time.', race: '5K', level: 'Intermediate' },
    { id: 3, name: '10K Beginner Plan', description: 'Great for runners tackling their first 10K.', race: '10K', level: 'Beginner' },
    { id: 4, name: '10K Advanced Plan', description: 'Push your limits and achieve a PR.', race: '10K', level: 'Advanced' },
]; */

// 0 = rest, 1 = easy, 2 = tempo, 3 = speed, 4 = long
/* const PLANS = new Map([
    ['beginner', [1, 1, 0, 1, 0, 4, 1]],
    ['intermediate', [1, 2, 1, 3, 0, 4, 1]],
    ['advanced', [1, 2, 1, 3, 1, 4, 1]]
]); */

/* const WORKOUT_INDEX_MAP = new Map([
    [0, 'Rest'],
    [1, 'Easy'],
    [2, 'Tempo'],
    [3, 'Speed'],
    [4, 'Long']
]); */

window.addEventListener("load", function () {
    setTimeout(function () {
        // configureSlider(null);
        // preventRightClickOnPage();
    }, 0);
});

// let init = false;
// let activeSliderListeners = [];

/* function configureSlider(details) {
    var weeklyMileageSlider = document.getElementById("weeklyMileageSlider");
    var workoutPercentSlider = document.getElementById("workoutPercentSlider");

    if (!details && !init) {
        init = true;
        let valuesForSlider = [];
        const format = {
            to: function (value) {
                return valuesForSlider[Math.round(value)];
            },
            from: function (value) {
                return valuesForSlider.indexOf(Number(value));
            }
        };

        for (let i = 0; i < 100; i++) {
            valuesForSlider.push(i);
        }

        noUiSlider.create(weeklyMileageSlider, {
            start: [20],
            connect: [true, true],
            tooltips: true,
            format: format,
            range: {
                min: [1],
                max: [100]
            }
        });

        noUiSlider.create(workoutPercentSlider, {
            start: [100],
            connect: [true, true],
            range: { min: [0], max: [100] },
            disabled: true
        });

        let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
        connect[0].classList.add("c-1-color");
    } else if (details) {
        workoutPercentSlider.noUiSlider.off('update', activeSliderListeners[0]);
        workoutPercentSlider.noUiSlider.destroy();

        noUiSlider.create(workoutPercentSlider, details);
        details.disabled === true
            ? workoutPercentSlider.noUiSlider.disable()
            : workoutPercentSlider.noUiSlider.enable();

        let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
        details.classes.forEach((className, i) => {
            connect[i].classList.add(className);
        });

        const sliderUpdate = workoutPercentSlider.noUiSlider.on('update', function (values, handle) {
            updateSliderLegend(details, values, handle);
        });

        activeSliderListeners.push(sliderUpdate);
    }
} */

/* function updateSliderLegend(details, values, handle) {
    const selectedWorkouts = details["classes"];
    const numSelections = values.length;
    const oneHundred =
        details["start"].length === 1 && details["start"][0] === 100 && selectedWorkouts.length > 0;

    let legendMap = new Map();
    legendMap.set('c-1-color', document.getElementById('easy'));
    legendMap.set('c-2-color', document.getElementById('tempo'));
    legendMap.set('c-3-color', document.getElementById('speed'));
    legendMap.set('c-4-color', document.getElementById('long'));

    let first = legendMap.get(selectedWorkouts[0]);
    let second = legendMap.get(selectedWorkouts[1]);
    let third = legendMap.get(selectedWorkouts[2]);
    let fourth = legendMap.get(selectedWorkouts[3]);

    for (const [key] of legendMap) {
        if (!selectedWorkouts.includes(key)) {
            legendMap.get(key).innerHTML = 0 + '%';
        }
    }

    if (oneHundred) {
        legendMap.get(selectedWorkouts[0]).innerHTML = 100 + '%';
    } else if (selectedWorkouts.length) {
        switch (numSelections) {
            case 1:
                first.innerHTML = Math.round(values[handle]) + '%';
                second.innerHTML = Math.round(100 - values[handle]) + '%';
                return null;

            case 2:
                if (handle === 0) {
                    first.innerHTML = Math.round(values[handle]) + '%';
                    second.innerHTML = Math.round(values[handle + 1] - values[handle]) + '%';
                    return null;
                } else if (handle === 1) {
                    third.innerHTML = Math.round(100 - values[handle]) + '%';
                    second.innerHTML = Math.round(100 - (Math.round(values[0]) + Math.round(100 - values[handle]))) + '%';
                    return null;
                }

            case 3:
                if (handle === 0) {
                    first.innerHTML = Math.round(values[handle]) + '%';
                    second.innerHTML = Math.round(values[handle + 1] - values[handle]) + '%';
                    return null;

                } else if (handle === 1) {
                    second.innerHTML = Math.round(values[1] - values[0]) + '%';
                    third.innerHTML = Math.round(values[2] - values[1]) + '%';
                    return null;

                } else if (handle === 2) {
                    third.innerHTML = Math.round(values[2] - values[1]) + '%';
                    fourth.innerHTML = Math.round(100 - (Math.round(values[0]) + Math.round(values[1] - values[0]) + Math.round(values[2] - values[1]))) + '%';
                }

            default:
                return null;
        }
    }
} */

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
        //raceDateOptions: planLengthOptions(this.raceDate),//PLAN_LENGTH_OPTIONS,

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
        // plans: TRAINING_PLANS,

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
            
        // used for controlling which knobs and defaults are displayed on the slider
        /* uniqueWorkoutTracker: {
            Rest: 0,
            Easy: 0,
            Tempo: 0,
            Speed: 0,
            Long: 0
        }, */

        /* handleWorkoutSelection(addSelection, selection) {
            if (addSelection) {
                this.uniqueWorkoutTracker[selection] += 1;
                const sliderPresets = calculateDefaults(this.uniqueWorkoutTracker);
                configureSlider(sliderPresets);
            } else {
                if (this.uniqueWorkoutTracker[selection] > 0)
                    this.uniqueWorkoutTracker[selection] -= 1;
            }
        }, */

        /*  trainingPlanTabs() {
            return {
                selectedTab: 'Pre-Made',
                openModal: false,
                raceType: '5K', // Example: dynamically set based on user input
                skillLevel: 'Beginner', // Example: dynamically set based on user input
                plans: [
                    { id: 1, name: '5K Beginner Plan', description: 'Perfect for new runners aiming to complete their first 5K.', race: '5K', level: 'Beginner' },
                    { id: 2, name: '5K Intermediate Plan', description: 'For experienced runners improving their 5K time.', race: '5K', level: 'Intermediate' },
                    { id: 3, name: '10K Beginner Plan', description: 'Great for runners tackling their first 10K.', race: '10K', level: 'Beginner' },
                    { id: 4, name: '10K Advanced Plan', description: 'Push your limits and achieve a PR.', race: '10K', level: 'Advanced' },
                    // Add more plans here...
                ],
                filteredPlans: [],

                // Methods
                selectTab(tab) {
                    this.selectedTab = tab;
                    this.filterPlans();
                },
                filterPlans() {
                    this.filteredPlans = this.plans.filter(plan => plan.race === this.raceType && plan.level === this.skillLevel);
                },
                selectPlan(plan) {
                    alert(`You selected: ${plan.name}`);
                },
            };
        }, */

        // plans are filtered based on the selections made by user
        /* filterPlans() {
            this.filteredPlans = this.plans.filter(
                (plan) => plan.race === this.selectedRaceDistance && plan.level === this.selectedWeeklyMileage
            );
        }, */
        
    
        /* handleGoalChange(event) {
            this.selectedGoal = event.target.value;

            // Hide all inputs initially
            document.querySelectorAll('.conditional-input').forEach((input) => {
                input.classList.add('hidden');
            });

            // Show the relevant input for the selected goal
            const targetInput = document.querySelector(`#input-${this.selectedGoal}`);
            if (targetInput) {
                targetInput.classList.remove('hidden');
            }

            // Clear errors when switching goals
            this.errors = {};
        }, */

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
        
        /* mapWorkoutsToWeeks() {
            const weeks = [];
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
            // Align to the nearest Sunday for the first week
            let currentStartDate = new Date(this.currentWorkouts[0]?.date);
            currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay()); // Adjust to the nearest Sunday
        
            let currentWeek = {};
        
            this.currentWorkouts.forEach((workout) => {
                const workoutDate = new Date(workout.date);
                const dayName = days[workoutDate.getDay()];
        
                // Check if the workout falls within the current week
                if (workoutDate - currentStartDate >= 7 * 24 * 60 * 60 * 1000) {
                    weeks.push(currentWeek);
                    currentWeek = {};
                    currentStartDate.setDate(currentStartDate.getDate() + 7); // Move to the next Sunday
                }
        
                // Add the workout to the current week
                currentWeek[dayName] = `${workout.title}\n${workout.notes}`;
            });
        
            // Push the last week if it has data
            if (Object.keys(currentWeek).length) {
                weeks.push(currentWeek);
            }
        
            return weeks;
        }, */

        /* updateWorkoutsFromWeeks(weeks) {
            const flatWorkouts = [];
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
            weeks.forEach((week, weekIndex) => {
                days.forEach((day, dayIndex) => {
                    if (week[day]) {
                        const [title, ...notes] = week[day].split('\n');
                        const workoutDate = new Date(2025, 0, weekIndex * 7 + dayIndex + 1).toISOString().split("T")[0];
        
                        flatWorkouts.push({
                            date: workoutDate,
                            title: title.trim(),
                            notes: notes.join('\n').trim(),
                            theme: title.toLowerCase().includes("rest") ? "red" : "blue", // Example logic
                        });
                    }
                });
            });
        
            this.currentWorkouts = flatWorkouts;
        } */
    };
}