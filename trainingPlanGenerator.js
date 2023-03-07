const weekdayMap = new Map();
const themeMap = new Map();

let nextRun = "";

(function () {
  weekdayMap.set(0, "Sunday");
  weekdayMap.set(1, "Monday");
  weekdayMap.set(2, "Tuesday");
  weekdayMap.set(3, "Wednesday");
  weekdayMap.set(4, "Thursday");
  weekdayMap.set(5, "Friday");
  weekdayMap.set(6, "Saturday");

  themeMap.set("Easy", "green");
  themeMap.set("Tempo", "blue");
  themeMap.set("Speed", "red");
  themeMap.set("Long", "purple");
})();

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function createTrainingPlan(
  startDay, // Sunday or Monday
  mileageGoal, // 1-100
  raceDate, // Race Date
  workoutMap, // Map<DayOfWeek, WorkoutType>
  numWeeksUntilRace // # weeks for training
) {
  // Set the first day of training to Sun/Mon based on user input and day of the week
  nextRun = setInitialStartDate(startDay);

  // An array of # of miles total for each week
  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, mileageGoal);
  //const daysPerWeekRunning = workoutMap.size;

  // Check which workouts are included in the week
  let uniqueWorkouts = new Set();
  workoutMap.forEach((valueArray) => {
    valueArray.forEach((value) => {
      uniqueWorkouts.add(value);
    });
  });
  const selectedWorkouts = Array.from(uniqueWorkouts);
  const workoutRatio = createWorkoutPercentileMap(selectedWorkouts);
  const workoutCount = countUniqueValuesInMap(workoutMap);

  return generateRuns(
    nextRun,
    milesPerWeek,
    workoutMap,
    workoutRatio,
    workoutCount,
    raceDate
  );
}

function generateRuns(
  nextRun,
  milesPerWeek,
  workoutMap,
  workoutRatio,
  workoutCount,
  raceDate
) {
  let allRuns = [];

  for (let i = 0; i < milesPerWeek.length; i++) {
    for (let x = 0; x < 7; x++) {
      let dayOfWeek = weekdayMap.get(nextRun.getDay());

      if (nextRun == raceDate) {
        
        // create event for the race

      } else if (workoutMap.has(dayOfWeek)) {
        
        let workoutType = workoutMap.get(dayOfWeek)[0];
        
        let numMiles = Math.ceil(
          (milesPerWeek[i] * workoutRatio.get(workoutType)) /
          workoutCount.get(workoutType)
        );

        let workout = createWorkout(nextRun, numMiles, workoutType);
  
        allRuns.push(workout);
      }
      nextRun = nextRun.addDays(1);
    }
  }
  return allRuns;
}

function createWorkout(dateOfWorkout, numberOfMiles, workoutType) {
  return {
    event_date: dateOfWorkout,
    event_title: `${workoutType} - ${numberOfMiles} miles`,
    event_workout: workoutType,
    event_distance: numberOfMiles,
    event_notes: "",
    event_theme: themeMap.get(workoutType)
  };
}

function createWorkoutPercentileMap(workouts) {
  let workoutRatio = new Map();
  workouts.sort(); // => Easy, Long, Speed, Tempo
  const selectedWorkouts = workouts.join(", ");

  switch (selectedWorkouts) {
    /* All possibilities for 2 options */
    case "Easy, Long":
      workoutRatio.set("Easy", 0.7);
      workoutRatio.set("Long", 0.3);
      break;
    case "Easy, Speed":
      workoutRatio.set("Easy", 0.8);
      workoutRatio.set("Speed", 0.2);
      break;
    case "Easy, Tempo":
      workoutRatio.set("Easy", 0.8);
      workoutRatio.set("Tempo", 0.2);
      break;
    case "Long, Speed":
      workoutRatio.set("Long", 0.8);
      workoutRatio.set("Speed", 0.2);
      break;
    case "Long, Tempo":
      workoutRatio.set("Long", 0.8);
      workoutRatio.set("Tempo", 0.2);
      break;
    case "Speed, Tempo":
      workoutRatio.set("Speed", 0.5);
      workoutRatio.set("Tempo", 0.5);
      break;

    /* All possibilities for 3 options */
    case "Easy, Long, Speed":
      workoutRatio.set("Easy", 0.56);
      workoutRatio.set("Long", 0.3);
      workoutRatio.set("Speed", 0.14);
      break;
    case "Easy, Long, Tempo":
      workoutRatio.set("Easy", 0.56);
      workoutRatio.set("Long", 0.3);
      workoutRatio.set("Tempo", 0.14);
      break;
    case "Long, Speed, Tempo":
      workoutRatio.set("Long", 0.3);
      workoutRatio.set("Speed", 0.14);
      workoutRatio.set("Tempo", 0.56);
      break;

    /* Only possibility for 4 options */
    case "Easy, Long, Speed, Tempo":
      workoutRatio.set("Easy", 0.6);
      workoutRatio.set("Long", 0.25);
      workoutRatio.set("Speed", 0.05);
      workoutRatio.set("Tempo", 0.1);
      break;

    /* Only 1 workout type is selected */
    default:
      workoutRatio.set(workouts[0], 100);
  }

  return workoutRatio;
}

function countUniqueValuesInMap(map) {
  const count = new Map();

  map.forEach((valueArray) => {
    valueArray.forEach((value) => {
      const currentValueCount = count.get(value) || 0;
      count.set(value, currentValueCount + 1);
    });
  });

  return count;
}

function createWeeklyMileage(numOfWeeks, maxMileage) {
  let milesPerWeek = [];
  const startingMileage = Number(Math.ceil(0.65 * maxMileage));
  const diff = maxMileage - startingMileage;
  const timespan = numOfWeeks - 2; // Allows for a 2 week taper
  const weeklyIncrement = Number(diff / timespan); // Increments of weekly mileage to increase each week
  const taper = numOfWeeks - 2;

  for (let i = 1; i <= taper; i++) {
    if (i == taper) {
      milesPerWeek.push(parseInt(maxMileage));
    } else {
      milesPerWeek.push(
        Number(Math.ceil(startingMileage + weeklyIncrement * i + 1))
      );
    }
  }

  // These are the two weeks of tapering before the race
  milesPerWeek.push(Number(Math.ceil(0.4 * maxMileage)));
  milesPerWeek.push(Number(Math.ceil(0.2 * maxMileage)));

  return milesPerWeek;
}

function setInitialStartDate(startPreference) {
  const dayOfWeek = weekdayMap.get(new Date().getDay());
  const startOnSunday = startPreference === "Sunday" ? true : false;
  let startDay;

  switch (dayOfWeek) {
    case "Sunday":
      startDay = startOnSunday ? new Date() : new Date().addDays(1);
      break;
    case "Monday":
      startDay = startOnSunday ? new Date().addDays(-1) : new Date();
      break;
    case "Tuesday":
      startDay = startOnSunday
        ? new Date().addDays(-2)
        : new Date().addDays(-1);
      break;
    case "Wednesday":
      startDay = startOnSunday ? new Date().addDays(4) : new Date().addDays(-2);
      break;
    case "Thursday":
      startDay = startOnSunday ? new Date().addDays(3) : new Date().addDays(-3);
      break;
    case "Friday":
      startDay = startOnSunday ? new Date().addDays(2) : new Date().addDays(3);
      break;
    case "Saturday":
      startDay = startOnSunday ? new Date().addDays(1) : new Date().addDays(2);
      break;
    default:
      return null;
      break;
  }
  return startDay;
}

function startOfWeek(date) {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export { createTrainingPlan };
