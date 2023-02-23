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

window.onload = function () { 
  loadComponent("workoutSelector", "./workoutSelector.html"); 
};

function loadComponent(domId, pathToFile) {
  $("#" + domId).load(pathToFile);
}

function toggleSetupWizard() {
  const card = document.querySelector(".relative");
  card.classList.toggle("flip-card-active");
  setTimeout(() => {
    let front = document.querySelector("#front");
    let back = document.querySelector("#back");
    front.style.display = front.style.display === "none" ? "block" : "none";
    back.style.display = back.style.display === "none" ? "block" : "none";
  }, 600);
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
    events: [],
    event_title: "",
    event_date: "",
    event_theme: "blue",
    event_workout: "Easy",
    event_distance: 1,
    event_notes: "",

    /* Properties used to calculate a training plan based on user input */
    weekly_mileage_goal: 50,
    start_day: "",
    race_date: "",
    workout_map: new Map(),

    workouts: [
      {
        value: "green",
        label: "Easy",
      },
      {
        value: "blue",
        label: "Steady",
      },
      {
        value: "yellow",
        label: "Tempo",
      },
      {
        value: "red",
        label: "Track / Repeats",
      },
      {
        value: "purple",
        label: "Long Run",
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
      ["Easy", "Green"],
      ["Steady", "Blue"],
      ["Tempo", "Yellow"],
      ["Track/Repeats", "Red"],
      ["Long Run", "Purple"],
    ]),

    openEventModal: false,

    generatePlan() {
      this.start_day = document.querySelector('[data-name="startOnSunday"]').checked ? "Sunday" : "Monday";
      this.weekly_mileage_goal = document.querySelector(".value").textContent;
      this.race_date = document.getElementById("dateInput").value;
      const workouts = document.querySelectorAll('[data-name="workout"]');

      for (const element of workouts) {
        if (element.checked) {
          let keyPair = element.name.split("_");
          let key = keyPair[0];
          let value = keyPair[1];

          if (this.workout_map.has(key)) {
            let currentValue = this.workout_map.get(key);
            currentValue.push(value);
            this.workout_map.set(key, currentValue);
          } else {
            this.workout_map.set(key, [value]);
          }
        }
      }
      const formComplete = this.start_day && this.weekly_mileage_goal && this.race_date && this.workout_map;
      const validRaceDate = this.isAtLeast4WeeksInFuture(this.race_date);
      this.calculateTrainingPlan(); 
      if (!formComplete) {
        this.showErrorToast("All fields are required", 5000);
      } else if (!validRaceDate) {
        this.showErrorToast("Race date must be 4 weeks minimum from today's date", 5000);
      } else {
        this.calculateTrainingPlan(); 
      }
    },

    async calculateTrainingPlan() {
      /*console.log(
        "Start Date: ",
        this.start_day,
        "Weekly Mileage: ",
        this.weekly_mileage_goal,
        "Race Date: ",
        this.race_date,
        "Workout Map: ",
        this.workout_map
      );*/
      const utils = await import("./trainingPlanGenerator.js");
      console.log(utils.greet("Scaler"));
    },

    isAtLeast4WeeksInFuture(date) {
      const now = new Date();
      // Calculate the difference in milliseconds between the input date and today's date
      const diffInMs = date - now;
      console.log(date, now, diffInMs);
      // Convert the difference to weeks
      const diffInWeeks = diffInMs / (1000 * 60 * 60 * 24 * 7);
      // Return true if the difference is at least 4 weeks
      return diffInWeeks >= 4;
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

    inputSliderInit() {
      const slider = document.querySelector(".slider");
      const value = document.querySelector(".value");
      slider.addEventListener("input", function () {
        value.textContent = this.value;
      });
    },

    isToday(date) {
      const today = new Date();
      const d = new Date(this.year, this.month, date);

      return today.toDateString() === d.toDateString() ? true : false;
    },

    showEventModal(date, dateIndex) {
      // open the modal
      let dIndx = this.fetchCalendarEventByDateIndex(dateIndex + 1);
      if (dIndx != -1) {
        let selectedWorkout = this.events[dIndx];
        this.event_title = selectedWorkout.event_title;
        this.event_workout = selectedWorkout.event_workout;
        this.event_distance = selectedWorkout.event_distance;
        this.event_notes = selectedWorkout.event_notes;
        this.event_theme = selectedWorkout.event_theme;
      }

      this.setSelectedOption("workoutSelect", this.event_workout);
      this.openEventModal = true;
      this.event_date = new Date(this.year, this.month, date).toDateString();
    },

    addEvent() {
      if (!this.event_title || !this.event_distance || !this.event_workout) {
        return;
      } else {
        let eventIndex = this.findIndex(
          this.events,
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
        if (eventIndex != -1) {
          this.events[eventIndex] = workoutEvent;
        } else {
          this.events.push(workoutEvent);
        }
      }

      // clear the form data
      this.event_title = "";
      this.event_date = "";
      this.event_theme = this.workoutThemeMap.get(this.event_workout); // 'blue';
      this.event_workout = "Easy";
      this.event_distance = 1;
      this.event_notes = "";

      //close the modal
      this.openEventModal = false;
    },

    deleteEvent() {
      let eventIndex = this.findIndex(
        this.events,
        "event_date",
        this.event_date
      );

      if (eventIndex != -1) {
        this.events.splice(eventIndex, 1);
        this.event_title = "";
        this.event_date = "";
        this.event_theme = this.workoutThemeMap.get(this.event_workout); // 'blue';
        this.event_workout = "Easy";
        this.event_distance = 1;
        this.event_notes = "";
        this.openEventModal = false;
      }
    },

    getNoOfDays() {
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
      return this.events.findIndex((item) =>
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
  };
}

/*function resizeListener(elementId) {
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
}*/
