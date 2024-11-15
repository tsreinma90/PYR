const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

jQuery(window).on("load", function () {
  setTimeout(function () {
    setupBarChart(null);
    configureSlider(null);
    preventRightClickOnPage();
    // callOpenAI(null);
  }, 100);
});

/*async function callOpenAI(userInput) {
  const response = await fetch('https://devpro-dev-ed.my.salesforce.com/services/apexrest/openai/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userInput: userInput })
  });
  
  const data = await response.json();
  console.log('***', data); // Process the response
}*/

function toggleSetupWizard(flipToBuilder) {
  const card = document.querySelector(".relative");
  card.classList.toggle("flip-card-active");
  let front = document.querySelector("#front");
  let back = document.querySelector("#back");

  setTimeout(() => {
    front.style.display = front.style.display === "none" ? "block" : "none";
    back.style.display = back.style.display === "none" ? "block" : "none";
  }, flipToBuilder ? 0 : 450);
}

function getMonthName(dateString) {
  const date = new Date(dateString);
  return MONTH_NAMES[date.getMonth()];
}

var myChart;

function setupBarChart(workoutEvents) {
  if (workoutEvents) {
    let aggregatedData = {};

    workoutEvents.forEach(w => {
      const month = getMonthName(w.event_date);
      if (!aggregatedData[month]) {
        aggregatedData[month] = {
          "Easy": 0, "Tempo": 0, "Speed": 0, "Long": 0
        };
      }
      aggregatedData[month][w.event_workout] += w.event_distance;
    });

    const ctx = document.getElementById("myChart").getContext("2d");
    if (myChart) {
      myChart.destroy();
    }

    myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(aggregatedData),
        datasets: [
          {
            label: "Easy",
            backgroundColor: "rgba(167, 243, 208, 0.2)",
            borderColor: "rgba(167, 243, 208, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Easy)
          },
          {
            label: "Tempo",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Tempo)
          },
          {
            label: "Speed",
            backgroundColor: "rgba(216, 4, 4, 0.2)",
            borderColor: "rgba(216, 4, 4, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Speed)
          },
          {
            label: "Long",
            backgroundColor: "rgba(118, 1, 168, 0.2)",
            borderColor: "rgba(118, 1, 168, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Long)
          }
        ]
      },
      options: {
        scales: {
          xAxes: [{
            ticks: {
              beginAtZero: true
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }
}

let init = false;
let activeSliderListeners = [];

function configureSlider(details) {
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
}

function preventRightClickOnPage() {
  //document.addEventListener('contextmenu', event => event.preventDefault());
}

function updateSliderLegend(details, values, handle) {
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
          second.innerHTML = Math.round(values[handle+1] - values[handle]) + '%';
          return null;
        } else if (handle === 1) {
          third.innerHTML = Math.round(100 - values[handle]) + '%';
          second.innerHTML = Math.round(100 - (Math.round(values[0]) + Math.round(100 - values[handle]))) + '%';
          return null;
        }

        case 3:
          if (handle === 0) {
            first.innerHTML = Math.round(values[handle]) + '%';
            second.innerHTML = Math.round(values[handle+1] - values[handle]) + '%';
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

function app() {
  return {
    /* Properties used for the calendar and events */
    month: "",
    year: "",
    no_of_days: [],
    blankdays: [],
    days: DAYS,

    /* Properties used for a single calendar event */
    workouts: [],
    event_title: "",
    event_date: "",
    event_theme: "blue",
    event_workout: "Easy",
    event_distance: 1,
    event_notes: "",

    /* Weekly Summary Modal */
    showWeeklySummaryModal: false,

    /* Properties used to calculate a training plan based on user input */
    weekly_mileage_goal: 50,
    start_day: "",
    start_date: "",
    race_date: "",
    workout_map: new Map(),
    zonePreferences: [],
    average_mileage_weekly: 0,
    average_mileage_daily: 0,

    uniqueWorkoutTracker: {
      Rest: 0,
      Easy: 0,
      Tempo: 0,
      Speed: 0,
      Long: 0
    },

    numOfWeeksInTraining: 0,

    selectPlan(planType) {
      switch (planType) {  
        case 'beginner':
          this.weekly_mileage_goal = 25;
          document.querySelector("#weeklyMileageSlider .noUi-tooltip").textContent = 25;
          document.querySelector('.noUi-origin').style = 'transform: translate(-75.0000%, 0px)';
          document.querySelector('.noUi-handle noUi-handle-lower').setAttribute('aria-valuenow', 25);
          break;
        case 'intermediate':
          this.weekly_mileage_goal = 50;
          document.querySelector("#weeklyMileageSlider .noUi-tooltip").textContent = 50;
          document.querySelector('.noUi-origin').style = 'transform: translate(-50.000%, 0px)';
          document.querySelector('.noUi-handle noUi-handle-lower').setAttribute('aria-valuenow', 50);
          break;
        case 'advanced':
          this.weekly_mileage_goal = 75;
          document.querySelector("#weeklyMileageSlider .noUi-tooltip").textContent = 75;
          document.querySelector('.noUi-origin').style = 'transform: translate(-25.000%, 0px)';
          document.querySelector('.noUi-handle noUi-handle-lower').setAttribute('aria-valuenow', 75);
          break;
        case 'custom':
          break;
        default:
          break;
      }
    },

    handleWorkoutSelection(addSelection, selection) {
      if (addSelection) {
        this.uniqueWorkoutTracker[selection] += 1;
        const sliderPresets = calculateDefaults(this.uniqueWorkoutTracker);
        configureSlider(sliderPresets);
      } else {
        if (this.uniqueWorkoutTracker[selection] > 0)
          this.uniqueWorkoutTracker[selection] -= 1;
      }
    },

    workoutColorPairs: [
      { value: "green", label: "Easy" },
      { value: "blue", label: "Tempo" },
      { value: "red", label: "Speed" },
      { value: "purple", label: "Long" }
    ],

    miles: Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: i + 1 })),

    workoutThemeMap: new Map([
      ["Easy", "green"],
      ["Tempo", "blue"],
      ["Speed", "red"],
      ["Long", "purple"]
    ]),

    openEventModal: false,

    generatePlan() {
      const numWeeksUntilRace = this.validateFormInput();
      if (numWeeksUntilRace) {
        this.calculateTrainingPlan(numWeeksUntilRace).then(totalMileage => {
          this.average_mileage_weekly = Math.ceil(totalMileage / numWeeksUntilRace);
          let daysPerWeekRunning = Array.from(this.workout_map.values()).filter(val => val[0] !== 'Rest').length;
          this.average_mileage_daily = Math.ceil(this.average_mileage_weekly / daysPerWeekRunning);
          toggleSetupWizard(false);
        });
      }
    },

    async calculateTrainingPlan(numWeeksUntilRace) {
      try {
        const trainingController = await import("./trainingPlanGenerator.js");
        const allRuns = trainingController.createTrainingPlan(
          this.start_date, this.weekly_mileage_goal, this.race_date, this.workout_map, this.zonePreferences, numWeeksUntilRace
        );
        let totalMileage = 0;
        allRuns.forEach(run => {
          this.event_date = run.event_date;
          this.event_title = run.event_title;
          this.event_workout = run.event_workout;
          this.event_distance = run.event_distance;
          this.event_notes = run.event_notes;
          this.event_theme = run.event_theme;
          this.addEvent(false);
          if (!isNaN(run.event_distance)) totalMileage += run.event_distance;
        });
        return totalMileage;
      } catch (e) {
        console.error(e);
      }
    },

    validateFormInput() {
      this.weekly_mileage_goal = parseInt(document.querySelector("#weeklyMileageSlider .noUi-tooltip").textContent);
      this.start_date = document.querySelector("#startDate").value;
      this.race_date = document.querySelector("#dateInput").value;
      this.workout_map = new Map();

      const days = document.querySelectorAll(".dayOfWeek");
      const workouts = document.querySelectorAll(".workout");

      for (let i = 0; i < 7; i++) {
        let key = days[i].textContent;
        let value = workouts[i].textContent;
        if (this.workout_map.has(key)) {
          this.workout_map.get(key).push(value);
        } else {
          this.workout_map.set(key, [value]);
        }
      }

      let percent_easy = parseInt(document.querySelector("#easy").textContent) / 100.0;
      let percent_tempo = parseInt(document.querySelector("#tempo").textContent) / 100.0;
      let percent_speed = parseInt(document.querySelector("#speed").textContent) / 100.0;
      let percent_long = parseInt(document.querySelector("#long").textContent) / 100.0;

      const zonePreferenceSet = percent_easy || percent_tempo || percent_speed || percent_long;

      const formComplete = this.start_date && this.weekly_mileage_goal && this.race_date && this.workout_map.size > 0 && zonePreferenceSet;
      const numWeeksUntilRace = parseInt(this.numberOfWeeksUntilDate(this.start_date, this.race_date));

      if (!formComplete) {
        this.showErrorToast("All fields are required", 5000);
        return false;
      } else if (numWeeksUntilRace < 4) {
        this.showErrorToast("Training Plan Must Be 4 Weeks Long Minimum", 12000);
        return false;
      } else if (numWeeksUntilRace > 20) {
        this.showErrorToast("Training Plan Must Be 20 Weeks Long or Less", 12000);
        return false;
      } else {
        this.workouts = [];
        this.zonePreferences = [percent_easy, percent_tempo, percent_speed, percent_long];
        this.numOfWeeksInTraining = numWeeksUntilRace;
        return numWeeksUntilRace;
      }
    },

    numberOfWeeksUntilDate(startingDate, futureDate) {
      const date1 = startingDate ? new Date(startingDate) : new Date();
      const date2 = new Date(futureDate);
      const diffInMs = Math.abs(date1 - date2);
      return Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
    },

    showErrorToast(message, duration) {
      const toast = document.getElementById("error-toast");
      const toastMessage = toast.querySelector(".bg-red-500");
      toastMessage.textContent = message;
      toast.classList.remove("hidden");
      setTimeout(() => {
        toast.classList.add("hidden");
      }, duration);
    },

    initDate() {
      let today = new Date();
      this.month = today.getMonth();
      this.year = today.getFullYear();
      this.datepickerValue = new Date(this.year, this.month, today.getDate()).toDateString();
    },

    isToday(date) {
      const today = new Date();
      const d = new Date(this.year, this.month, date);
      return today.toDateString() === d.toDateString();
    },

    /*showEventModal(date, dateIndex, eventTitle) {
      let dIndx = this.fetchCalendarEventByDateIndex(dateIndex + 1);
      if (dIndx != -1) {
        let selectedWorkout = !eventTitle
          ? this.workouts[dIndx]
          : this.workouts[dIndx].event_title == eventTitle
            ? this.workouts[dIndx]
            : this.workouts[dIndx + 1];
        this.event_title = selectedWorkout.event_title;
        this.event_workout = selectedWorkout.event_workout;
        this.event_distance = selectedWorkout.event_distance;
        this.event_notes = selectedWorkout.event_notes;
        this.event_theme = selectedWorkout.event_theme;
      } else {
        this.event_title = "";
        this.event_workout = "Easy";
        this.event_distance = 1;
        this.event_notes = "";
        this.event_theme = "green";
      }

      this.setSelectedOption("workoutSelect", this.event_workout);
      this.openEventModal = true;
      this.event_date = new Date(this.year, this.month, date).toDateString();
    },*/

    showEventModal(date, dateIndex, eventTitle) {
      // Fetch the index of the calendar event by date
      let eventIndex = this.workouts.findIndex((workout) => {
        const eventDate = new Date(workout.event_date).toDateString();
        const selectedDate = new Date(this.year, this.month, date).toDateString();
        return eventDate === selectedDate;
      });
    
      // Check if the event exists on the selected date
      if (eventIndex !== -1) {
        const selectedWorkout = this.workouts[eventIndex];
    
        // If the title matches (if provided), assign the workout details
        if (!eventTitle || selectedWorkout.event_title === eventTitle) {
          this.event_title = selectedWorkout.event_title;
          this.event_workout = selectedWorkout.event_workout;
          this.event_distance = selectedWorkout.event_distance;
          this.event_notes = selectedWorkout.event_notes;
          this.event_theme = selectedWorkout.event_theme;
        } else {
          // If no matching eventTitle is found, reset to default
          this.resetWorkoutDetails();
        }
      } else {
        // If no workout found for the selected date, reset to default
        this.resetWorkoutDetails();
      }
    
      // Set the selected workout type in the dropdown
      this.setSelectedOption("workoutSelect", this.event_workout);
    
      // Open the modal and set the event date
      this.openEventModal = true;
      this.event_date = new Date(this.year, this.month, date).toDateString();
    },
    
    resetWorkoutDetails() {
      this.event_title = "";
      this.event_workout = "Easy";
      this.event_distance = 1;
      this.event_notes = "";
      this.event_theme = "green";
    },
    
    addEvent(findExisting) {
      if (!this.event_title || !this.event_distance || !this.event_workout) {
        return;
      }

      let eventIndex = this.findIndex(this.workouts, "event_date", this.event_date);
      let workoutEvent = {
        event_date: this.event_date,
        event_title: this.event_title,
        event_theme: this.event_theme,
        event_workout: this.event_workout,
        event_distance: this.event_distance,
        event_notes: this.event_notes
      };

      if (findExisting && eventIndex != -1) {
        this.workouts[eventIndex] = workoutEvent;
      } else {
        this.workouts.push(workoutEvent);
      }

      this.clearFormData();
      this.openEventModal = false;
    },

    clearFormData() {
      this.event_title = "";
      this.event_date = "";
      this.event_theme = "";
      this.event_workout = "";
      this.event_distance = 1;
      this.event_notes = "";
    },

    deleteEvent() {
      let eventIndex = this.findIndex(this.workouts, "event_date", this.event_date);
      if (eventIndex != -1) {
        this.workouts.splice(eventIndex, 1);
        this.clearFormData();
        this.event_theme = this.workoutThemeMap.get(this.event_workout);
        this.openEventModal = false;
      }
    },

    deleteAllEvents() {
      this.workouts = [];
    },

    toggleWeeklySummaryModal() {
      setupBarChart(this.workouts);
      setTimeout(() => {
        this.showWeeklySummaryModal = !this.showWeeklySummaryModal;
      }, 500);
    },

    getNoOfDays(increment) {
      if (increment) {
        this.month += increment;
        if (this.month == 12) {
          this.month = 0;
          this.year++;
        } else if (this.month <= 0) {
          this.month = 12;
          this.year--;
        }
      }

      let daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      let dayOfWeek = new Date(this.year, this.month).getDay();

      this.blankdays = Array.from({ length: dayOfWeek }, (_, i) => i + 1);
      this.no_of_days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    },

    findIndex(array, property, value) {
      return array.findIndex(item => item[property] == value);
    },

    fetchCalendarEventByDateIndex(dateIndex) {
      return this.workouts.findIndex(item => JSON.stringify(item["event_date"]).includes(dateIndex));
    },

    setWorkoutType(event) {
      const select = event.target;
      const selectedOption = select.options[select.selectedIndex];
      this.event_theme = selectedOption.value;
      this.event_workout = selectedOption.text;
    },

    setSelectedOption(selectId, optionValue) {
      const select = document.getElementById(selectId);
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text === optionValue) {
          select.options[i].selected = true;
          break;
        }
      }
    },

    formatDate(date) {
      const initialDate = new Date(date);
      const year = initialDate.getFullYear();
      const month = ("0" + (initialDate.getMonth() + 1)).slice(-2);
      const day = ("0" + initialDate.getDate()).slice(-2);
      return `${year}-${month}-${day}`;
    },

    async downloadCalendar(event) {
      const downloadHelper = await import("./calendarDownload.js");
      downloadHelper.downloadCalendarFile(this.workouts);
    }
  };
}

function resizeListener(elementId) {
  var $element = $("#" + elementId);
  var $children = $element.children();
  var initial = false;
  $(window)
    .on("resize", function () {
      if (initial) {
        const width = $(window).width() / $element.width();
        const height = $(window).height() / $element.height();
        const scale = `scale(${Math.min(width, height)})`;
        $element.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale
        });
        $children.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale
        });
      } else {
        initial = true;
      }
    })
    .trigger("resize");
}
