const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

jQuery(window).on("load", function () {
  setTimeout(function () {
    //loadComponent("workoutSelector", "./playground.html");
    setupBarChart(null);
    configureSlider(null);
  }, 100);
});

function toggleSetupWizard(flipToBuilder) {
  const card = document.querySelector(".relative");
  card.classList.toggle("flip-card-active");
  let front = document.querySelector("#front");
  let back = document.querySelector("#back");
  
  if (!flipToBuilder) {
    setTimeout(() => {
      front.style.display = front.style.display === "none" ? "block" : "none";
      back.style.display = back.style.display === "none" ? "block" : "none";
    }, 450);
  } else {
    front.style.display = front.style.display === "none" ? "block" : "none";
    back.style.display = back.style.display === "none" ? "block" : "none";
  }
}

function getMonthName(dateString) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const date = new Date(dateString);
  return months[date.getMonth()];
}

var myChart;

function setupBarChart(workoutEvents) {
  if (workoutEvents) {
    let aggregatedData = {};
    // Iterate over events to aggregate data
    workoutEvents.forEach(w => {
      const month = getMonthName(w.event_date);
      if (!aggregatedData[month]) {
        aggregatedData[month] = {
          "Easy": 0,
          "Tempo": 0,
          "Speed": 0,
          "Long": 0
        };
      }
      aggregatedData[month][w.event_workout] += w.event_distance;
    });

    var ctx = document.getElementById("myChart").getContext("2d");
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
            backgroundColor: "rgba(167, 243, 208, .2)",
            borderColor: "rgba(167,243,208,2)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Easy),
          },
          {
            label: "Tempo",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Tempo),
          },
          {
            label: "Speed",
            backgroundColor: "rgba(216, 4, 4, 0.2)",
            borderColor: "rgba(216, 4, 4, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Speed),
          },
          {
            label: "Long",
            backgroundColor: "rgba(118, 1, 168, 0.2)",
            borderColor: "rgba(118, 1, 168, 1)",
            borderWidth: 1,
            data: Object.values(aggregatedData).map(monthData => monthData.Long),
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
  }
}

let init = false;
activeSliderListeners = [];

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
      },
    };

    for (let i = 0; i < 100; i++) {
      valuesForSlider.push(i);
    }

    /* Single Weekly Mileage Slider */
    noUiSlider.create(weeklyMileageSlider, {
      start: [20],
      connect: [true, true],
      tooltips: true,
      format: format,
      range: {
        min: [1],
        max: [100],
      },
    });

    /* Multiple Workout % Slider */
    noUiSlider.create(workoutPercentSlider, {
      start: [100],
      connect: [true, true],
      range: { min: [0], max: [100] },
      disabled: true,
      classes:[]
    },
    );
    let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
    connect[0].classList.add("c-1-color");

  } else if (details) {

    // Workout % Slider should re-render*/
    workoutPercentSlider.noUiSlider.off('update', activeSliderListeners[0]);
    workoutPercentSlider.noUiSlider.destroy();
    noUiSlider.create(workoutPercentSlider, details);
    details?.disabled === true
      ? workoutPercentSlider.noUiSlider.disable()
      : workoutPercentSlider.noUiSlider.enable();
    let connect = workoutPercentSlider.querySelectorAll(".noUi-connect");
    for (var i = 0; i < details.classes.length; i++) {
      connect[i].classList.add(details.classes[i]);
    }

    const sliderUpdate = workoutPercentSlider.noUiSlider.on('update', function (values, handle) {
      updateSliderLegend(details, values, handle);
    });

    activeSliderListeners.push(sliderUpdate);
  }
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
    Long: false,
  };

  for (const key in selectedWorkouts) {
    const value = selectedWorkouts[key];
    if (value > 0) conditions[key] = true;
  }

  const trueConditions = Object.keys(conditions).filter(
    (key) => conditions[key]
  );
  const key = trueConditions.join("+");
  return window.slider.getOptions(key);
}

function app() {
  return {
    /* Properties used for the calendar and events */
    month: "",
    year: "",
    no_of_days: [],
    blankdays: [],
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

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
      Long: 0,
    },

    numOfWeeksInTraining : 0,

    handleWorkoutSelection(addSelection, selection) {
      if (addSelection) {
        this.uniqueWorkoutTracker[selection] =
          this.uniqueWorkoutTracker[selection] + 1;
        let sliderPresets = calculateDefaults(this.uniqueWorkoutTracker);
        configureSlider(sliderPresets);
      } else {
        if (this.uniqueWorkoutTracker[selection] > 0)
          this.uniqueWorkoutTracker[selection] =
            this.uniqueWorkoutTracker[selection] - 1;
      }
    },

    workoutColorPairs: [
      {
        value: "green",
        label: "Easy",
      },
      {
        value: "blue",
        label: "Tempo",
      },
      {
        value: "red",
        label: "Speed",
      },
      {
        value: "purple",
        label: "Long",
      },
    ],

    miles: [
      {
        value: 1,
        label: 1,
      },
      {
        value: 2,
        label: 2,
      },
      {
        value: 3,
        label: 3,
      },
      {
        value: 4,
        label: 4,
      },
      {
        value: 5,
        label: 5,
      },
      {
        value: 6,
        label: 6,
      },
      {
        value: 7,
        label: 7,
      },
      {
        value: 8,
        label: 8,
      },
      {
        value: 9,
        label: 9,
      },
      {
        value: 10,
        label: 10,
      },
      {
        value: 11,
        label: 11,
      },
      {
        value: 12,
        label: 12,
      },
      {
        value: 13,
        label: 13,
      },
      {
        value: 14,
        label: 14,
      },
      {
        value: 15,
        label: 15,
      },
      {
        value: 16,
        label: 16,
      },
      {
        value: 17,
        label: 17,
      },
      {
        value: 18,
        label: 18,
      },
      {
        value: 19,
        label: 19,
      },
      {
        value: 20,
        label: 20,
      },
      {
        value: 21,
        label: 21,
      },
      {
        value: 22,
        label: 22,
      },
      {
        value: 23,
        label: 23,
      },
      {
        value: 24,
        label: 24,
      },
      {
        value: 25,
        label: 25,
      },
      {
        value: 26,
        label: 26,
      },
      {
        value: 27,
        label: 27,
      },
      {
        value: 28,
        label: 28,
      },
      {
        value: 29,
        label: 29,
      },
      {
        value: 30,
        label: 30,
      },
    ],

    workoutThemeMap: new Map([
      ["Easy", "green"],
      ["Tempo", "blue"],
      ["Speed", "red"],
      ["Long", "purple"],
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
          this.start_date,
          this.weekly_mileage_goal,
          this.race_date,
          this.workout_map,
          this.zonePreferences,
          numWeeksUntilRace,
        );
        let totalMileage = 0;
        allRuns.forEach((run) => {
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
        console.log(e);
      }
    },

    validateFormInput() {
      this.weekly_mileage_goal = document.querySelector("#weeklyMileageSlider > div > div.noUi-origin > div > div.noUi-tooltip").textContent;
      this.start_date = document.querySelector("#startDate").value;
      this.race_date = document.querySelector("#dateInput").value;
      this.workout_map = new Map();

      const days = document.querySelectorAll(".dayOfWeek");
      const workouts = document.querySelectorAll(".workout");

      for (let i = 0; i < 7; i++) {
        let key = days[i].textContent;
        let value = workouts[i].textContent;

        if (this.workout_map.has(key)) {
          let currentValue = this.workout_map.get(key);
          currentValue.push(value);
          this.workout_map.set(key, currentValue);
        } else {
          this.workout_map.set(key, [value]);
        }
      }

      let percent_easy = parseInt(document.querySelector("#easy").textContent) / 100.0;
      let percent_tempo = parseInt(document.querySelector("#tempo").textContent) / 100.0;
      let percent_speed = parseInt(document.querySelector("#speed").textContent) / 100.0;
      let percent_long = parseInt(document.querySelector("#long").textContent) / 100.0;

      let zonePreferenceSet = (percent_easy != 0 || percent_tempo != 0 || percent_speed != 0 || percent_long != 0);

      const formComplete =
        this.start_date &&
        this.weekly_mileage_goal &&
        this.race_date &&
        this.workout_map && 
        zonePreferenceSet;

      const numWeeksUntilRace = parseInt(
        this.numberOfWeeksUntilDate(this.start_date, this.race_date)
      );

      if (!formComplete) {
        this.showErrorToast("All fields are required", 5000);
        return false;
      } else if (numWeeksUntilRace < 4) {
        this.showErrorToast(
          "Training Plan Must Be 4 Weeks Long Minimum",
          12000
        );
        return false;
      } else if (numWeeksUntilRace > 20) {
        this.showErrorToast(
          "Training Plan Must Be 20 Weeks Long or Less",
           12000
        );
      }
       else {
        this.workouts = [];
        this.zonePreferences = [];
        this.zonePreferences.push(percent_easy);
        this.zonePreferences.push(percent_tempo);
        this.zonePreferences.push(percent_speed);
        this.zonePreferences.push(percent_long);
        this.numOfWeeksInTraining = numWeeksUntilRace;
        return numWeeksUntilRace;
      }
    },

    numberOfWeeksUntilDate(startingDate, futureDate) {
      const now = this.formatDate(new Date());

      // Create two Date objects from the given date strings
      const date1 = startingDate
        ? new Date(startingDate)
        : new Date(this.formatDate(new Date()));
      const date2 = new Date(futureDate);

      // Calculate the difference in milliseconds between the two dates
      const diffInMs = Math.abs(date1 - date2);

      // Calculate the number of weeks between the two dates
      const weeksApart = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
      return weeksApart;
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
      this.datepickerValue = new Date(
        this.year,
        this.month,
        today.getDate()
      ).toDateString();
    },

    /*inputSliderInit() {
      const slider = document.querySelector(".slider");
      const value = document.querySelector(".value");
      slider.addEventListener("input", function () {
        value.textContent = this.value;
      });
    },*/

    isToday(date) {
      const today = new Date();
      const d = new Date(this.year, this.month, date);

      return today.toDateString() === d.toDateString() ? true : false;
    },

    showEventModal(date, dateIndex, eventTitle) {
      // open the modal
      let dIndx = this.fetchCalendarEventByDateIndex(dateIndex + 1);
      if (dIndx != -1) {
        if (!eventTitle) {
          let selectedWorkout = this.workouts[dIndx];
          this.event_title = selectedWorkout.event_title;
          this.event_workout = selectedWorkout.event_workout;
          this.event_distance = selectedWorkout.event_distance;
          this.event_notes = selectedWorkout.event_notes;
          this.event_theme = selectedWorkout.event_theme;
        } else {
          let selectedWorkout =
            this.workouts[dIndx].event_title == eventTitle
              ? this.workouts[dIndx]
              : this.workouts[dIndx + 1];
          this.event_title = selectedWorkout.event_title;
          this.event_workout = selectedWorkout.event_workout;
          this.event_distance = selectedWorkout.event_distance;
          this.event_notes = selectedWorkout.event_notes;
          this.event_theme = selectedWorkout.event_theme;
        }
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
    },

    addEvent(findExisting) {
      if (!this.event_title || !this.event_distance || !this.event_workout) {
        return;
      } else {
        let eventIndex = this.findIndex(
          this.workouts,
          "event_date",
          this.event_date
        );
        let workoutEvent = {
          event_date: this.event_date,
          event_title: this.event_title,
          event_theme: this.event_theme,
          event_workout: this.event_workout,
          event_distance: this.event_distance,
          event_notes: this.event_notes,
        };

        if (findExisting && eventIndex != -1) {
          this.workouts[eventIndex] = workoutEvent;
        } else {
          this.workouts.push(workoutEvent);
        }
      }

      // clear the form data
      this.event_title = "";
      this.event_date = "";
      this.event_theme = "";
      this.event_workout = "";
      this.event_distance = 1;
      this.event_notes = "";

      //close the modal
      this.openEventModal = false;
    },

    deleteEvent() {
      let eventIndex = this.findIndex(
        this.workouts,
        "event_date",
        this.event_date
      );

      if (eventIndex != -1) {
        this.workouts.splice(eventIndex, 1);
        this.event_title = "";
        this.event_date = "";
        this.event_theme = this.workoutThemeMap.get(this.event_workout); // 'blue';
        this.event_workout = "Easy";
        this.event_distance = 1;
        this.event_notes = "";
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
      // this.workouts will contain events that look like this:
      /*{
        \"event_date\": \"2024-04-04T23:00:00.000Z\",
        \"event_title\": \"Speed - 4 miles\",
        \"event_theme\": \"red\",
        \"event_workout\": \"Speed\",
        \"event_distance\": 4,
        \"event_notes\": \"\"
      },*/

      // so we need the total distance from each event per month, by workout type. each should have a bar graph within the month
      
      /*parseInt(
        this.numberOfWeeksUntilDate(this.start_date, this.race_date)
      );*/
    },

    getNoOfDays(increment) {
      if (increment) {
        this.month += increment;

        // Adjust the year if necessary
        if (this.month == 12) {
            this.month = 0;
            this.year++;
        } else if (this.month <= 0) {
            this.month = 12;
            this.year--;
        }
      }

      let daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      // find where to start calendar day of week
      let dayOfWeek = new Date(this.year, this.month).getDay();
      let blankdaysArray = [];
      for (var i = 1; i <= dayOfWeek; i++) {
        blankdaysArray.push(i);
      }

      let daysArray = [];
      for (var i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
      }

      this.blankdays = blankdaysArray;
      this.no_of_days = daysArray;
    },

    findIndex(array, property, value) {
      return array.findIndex((item) => item[property] == value);
    },

    fetchCalendarEventByDateIndex(dateIndex) {
      return this.workouts.findIndex((item) =>
        JSON.stringify(item["event_date"]).includes(dateIndex)
      );
    },

    setWorkoutType(event) {
      var select = event.target;
      var selectedOptionIndex = select.selectedIndex;
      var selectedOption = select.options[selectedOptionIndex];
      var label = selectedOption.text;
      this.event_theme = selectedOption.value;
      this.event_workout = label;
    },

    setSelectedOption(selectId, optionValue) {
      var select = document.getElementById(selectId);

      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text === optionValue) {
          select.options[i].selected = true;
          break;
        }
      }
    },

    formatDate(date) {
      const initialDate = new Date(date);

      // Extract the year, month, and day from the date object
      const year = initialDate.getFullYear();
      const month = ("0" + (initialDate.getMonth() + 1)).slice(-2);
      const day = ("0" + initialDate.getDate()).slice(-2);

      // Create the formatted date string using the extracted components
      const formattedDate = `${year}-${month}-${day}`;
      return formattedDate;
    },

    async downloadCalendar(event) {
      const downloadHelper = await import("./calendarDownload.js");
      downloadHelper.downloadCalendarFile(this.workouts);
    },
  };
}

function resizeListener(elementId) {
  var $element = $("#" + elementId);
  var $children = $element.children();
  var initial = false;
  $(window)
    .on("resize", function () {
      if (initial) {
        var width = $(window).width() / $element.width();
        var height = $(window).height() / $element.height();
        var scale = "scale(" + Math.min(width, height) + ")";

        $element.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale,
        });
        $children.css({
          "-webkit-transform": scale,
          "-moz-transform": scale,
          "-ms-transform": scale,
          "-o-transform": scale,
          transform: scale,
        });
      } else {
        initial = true;
      }
    })
    .trigger("resize");
}
