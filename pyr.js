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

// 0 = rest, 1 = easy, 2 = tempo, 3 = speed, 4 = long
const PLANS = new Map([
    ['beginner', [1, 1, 0, 1, 0, 4, 1]], 
    ['intermediate', [1, 2, 1, 3, 0, 4, 1]], 
    ['advanced', [1, 2, 1, 3, 1, 4, 1]]
]);

const WORKOUT_INDEX_MAP = new Map([
    [0, 'Rest'],
    [1, 'Easy'],
    [2, 'Tempo'],
    [3, 'Speed'],
    [4, 'Long']
]);

function sharedState() {
  return {
    selectedRaceDistance: '',
    selectedRaceDate: '',
    start_date: '',
    selectedTab: 'Overview',
    selectedExperienceLevel: 'Beginner',
    filteredPlans: [],
    currentWorkouts: [],
    editingCell: { index: null, field: null },

    raceDistanceOptions: [
      { label: '5K', value: '5k' },
      { label: '10K', value: '10k' },
      { label: 'Half Marathon', value: 'half-marathon' },
      { label: 'Marathon', value: 'marathon' },
    ],
    raceDateOptions: [
      { label: '4 Week Training Plan', value: '4-weeks' },
      { label: '8 Week Training Plan', value: '8-weeks' },
      { label: '12 Week Training Plan', value: '12-weeks' },
      { label: '16 Week Training Plan', value: '16-weeks' },
      { label: '20 Week Training Plan', value: '20-weeks' },
    ],

    // Training plans
    plans: [
      { id: 1, name: '5K Beginner Plan', description: 'Perfect for new runners aiming to complete their first 5K.', race: '5K', level: 'Beginner' },
      { id: 2, name: '5K Intermediate Plan', description: 'For experienced runners improving their 5K time.', race: '5K', level: 'Intermediate' },
      { id: 3, name: '10K Beginner Plan', description: 'Great for runners tackling their first 10K.', race: '10K', level: 'Beginner' },
      { id: 4, name: '10K Advanced Plan', description: 'Push your limits and achieve a PR.', race: '10K', level: 'Advanced' },
    ],

    // Calendar and table state
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    workouts: [
      { event_date: "2024-12-28", event_title: "Rest day", event_notes: "Take it easy.", event_theme: "red" },
      { event_date: "2024-12-27", event_title: "5 miles run", event_notes: "Moderate pace.", event_theme: "blue" },
    ],
    blankdays: [],
    no_of_days: [],
    weeks: [
      {
        Monday: '5 miles easy run\nFocus on breathing and steady pace.',
        Tuesday: '4 miles tempo run\nWarm-up: 1 mile\nTempo: 2 miles @ 8:00 min/mile\nCool-down: 1 mile',
        Wednesday: '5 miles recovery run\nKeep heart rate low.',
        Thursday: 'Rest day\nOptional yoga or light stretching.',
        Friday: '7 miles long run\nProgressive pace, finish strong.',
        Saturday: '8 miles trail run\nPractice uphill strides.',
        Sunday: '3 miles recovery run\nSlow pace, enjoy the scenery.',
      },
    ],

    trainingPlanTabs() {
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
  },

  editableTable() {
    return {
      // Days of the week
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      // Weekly training plan with sample data
      weeks: [
        {
          Monday: '5 miles easy run\nFocus on breathing and steady pace.',
          Tuesday: '4 miles tempo run\nWarm-up: 1 mile\nTempo: 2 miles @ 8:00 min/mile\nCool-down: 1 mile',
          Wednesday: '5 miles recovery run\nKeep heart rate low.',
          Thursday: 'Rest day\nOptional yoga or light stretching.',
          Friday: '7 miles long run\nProgressive pace, finish strong.',
          Saturday: '8 miles trail run\nPractice uphill strides.',
          Sunday: '3 miles recovery run\nSlow pace, enjoy the scenery.',
        },
        {
          Monday: '6 miles interval run\nWarm-up: 1 mile\n5x800m @ 7:30 min/mile\nCool-down: 1 mile',
          Tuesday: '4 miles easy run\nRelaxed pace, focus on form.',
          Wednesday: 'Cross-training\n30 minutes cycling or swimming.',
          Thursday: '5 miles tempo run\nWarm-up: 1 mile\nTempo: 3 miles @ 7:45 min/mile\nCool-down: 1 mile',
          Friday: 'Rest day\nFocus on hydration and nutrition.',
          Saturday: '10 miles long run\nEasy pace, conversational effort.',
          Sunday: '4 miles recovery run\nShake out the legs, stay loose.',
        },
        // Add more rows to simulate 8, 12, 16, or 20 total rows as needed
      ],
      // Cell editing state
      editingCell: { index: null, field: null },
      // Function to edit a cell
      editCell(index, field) {
        this.editingCell = { index, field };
      },
      // Function to save a cell
      saveCell() {
        this.editingCell = { index: null, field: null };
      },
      // Function to cancel editing
      cancelEdit() {
        this.editingCell = { index: null, field: null };
      },
    }
  },

    racePlanner() {
      return {
        selectedRaceDistance: '',
        selectedRaceDate: '',
        raceDistanceOptions: [
          { label: '5K', value: '5k' },
          { label: '10K', value: '10k' },
          { label: 'Half Marathon', value: 'half-marathon' },
          { label: 'Marathon', value: 'marathon' },
        ],
        raceDateOptions: [
          { label: '4 Week Training Plan', value: '4-weeks' },
          { label: '8 Week Training Plan', value: '8-weeks' },
          { label: '12 Week Training Plan', value: '12-weeks' },
          { label: '16 Week Training Plan', value: '16-weeks' },
          { label: '20 Week Training Plan', value: '20-weeks' },
        ],
      };
    },

    filterPlans() {
      this.filteredPlans = this.plans.filter(
        (plan) => plan.race === this.selectedRaceDistance && plan.level === this.selectedExperienceLevel
      );
    },

    changeTab(tab) {
      this.selectedTab = tab;
    },

    calculateDays() {
      const firstDay = new Date(this.year, this.month, 1).getDay();
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

      this.blankdays = Array(firstDay).fill(null);
      this.no_of_days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    },

    calendarComponent() {
      return {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        workouts: [
          { event_date: "2024-12-28", event_title: "Rest day", event_notes: "Take it easy.", event_theme: "red" },
          { event_date: "2024-12-27", event_title: "5 miles run", event_notes: "Moderate pace.", event_theme: "blue" },
        ],
        blankdays: [],
        no_of_days: [],
        isModalOpen: false,
        eventToEdit: null,

        MONTH_NAMES,
        DAYS,

        // Initialize Calendar
        init() {
          this.calculateDays();
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
          const firstDay = new Date(this.year, this.month, 1).getDay();
          const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

          this.blankdays = Array(firstDay).fill(null);
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

        // Save Event
        saveEvent() {
          const index = this.workouts.findIndex(
            (e) =>
              new Date(e.event_date).toDateString() ===
              new Date(this.year, this.month, this.eventToEdit.date).toDateString()
          );
          if (index !== -1) {
            this.workouts[index] = { ...this.eventToEdit };
          }
          this.isModalOpen = false;
        },
      }
    },

    tabsComponent() {
      return {
        // Initialize the tabs data
        currentTab: 'Overview',
        tabs: [
          { name: 'Overview' },
          { name: 'Calendar View' },
          { name: 'Training Load Summary' }
        ],
      }
    },

    editCell(index, field) {
      this.editingCell = { index, field };
    },

    saveCell() {
      this.editingCell = { index: null, field: null };
    },

    cancelEdit() {
      this.editingCell = { index: null, field: null };
    },
  };
}