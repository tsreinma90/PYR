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
  startDay, // Start date user selects
  mileageGoal, // 1-100 miles
  raceDate, // Race date user selects
  workoutMap, // Day of the Week => Workout Selection
  numWeeksUntilRace // # weeks for training
) {
  // Set the first day of training to the date which the user selected
  nextRun = new Date(startDay); //(startDay);

  // Create an array storing the total weekly number of miles for each week of training
  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, mileageGoal);

  // Check which workouts are included in the week (we only care about unique values)
  let uniqueWorkouts = new Set();
  workoutMap.forEach((val) => {
      uniqueWorkouts.add(val[0]);
  });
  const selectedWorkouts = Array.from(uniqueWorkouts);
  const workoutRatio = createWorkoutPercentileMap(selectedWorkouts);
  const workoutCount = countUniqueValuesInMap(workoutMap);

  // An array of calendar events up until the race date
  return generateRuns(nextRun, milesPerWeek, workoutMap, workoutRatio, workoutCount, raceDate);
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
  let longRunIncluded = longRunIncludedInPlan(workoutMap);
  for (let i = 0; i < milesPerWeek.length; i++) {
    for (let x = 0; x < 7; x++) {
      let dayOfWeek = weekdayMap.get(nextRun.getDay());

      if (nextRun == raceDate) {
        
        // create event for the race
        let raceShakeout = createWorkout(nextRun)

      } else if (workoutMap.has(dayOfWeek)) {
        
        let workoutType = workoutMap.get(dayOfWeek)[0];
        
        let numMiles = Math.ceil(
          (milesPerWeek[i] * workoutRatio.get(workoutType)) /
          workoutCount.get(workoutType)
        );
          
        if (longRunIncluded && workoutType != 'Long') {
          let doDoubleDay = splitRunIntoTwo(numMiles, milesPerWeek[i], workoutRatio, workoutCount);
          if (doDoubleDay) {
            let result = splitRun(numMiles);
            let morningRun = createWorkout(nextRun, result[0], workoutType, `Morning ${workoutType} - ${result[0]} miles`);
            let eveningRun = createWorkout(nextRun, result[1], workoutType, `Evening ${workoutType} - ${result[1]} miles`);
            allRuns.push(morningRun);
            allRuns.push(eveningRun);
          } else {
            let workout = createWorkout(nextRun, numMiles, workoutType, null);
            allRuns.push(workout);
          }
        } else {
          let workout = createWorkout(nextRun, numMiles, workoutType, null);
          allRuns.push(workout);
        }
      }
      nextRun = nextRun.addDays(1);
    }
  }
  return allRuns;
}

function longRunIncludedInPlan(workoutMap) {
  let longRunIncluded = false;
  for (const workout of workoutMap.values()) {
    if (workout[0] === 'Long') { 
      longRunIncluded = true;
    }
  }
  return longRunIncluded;
}

function splitRunIntoTwo(numMilesForWorkout, numMilesForWeek, workoutRatioMap, workoutCountMap) {
  let longRunMiles = Math.ceil(
    (numMilesForWeek * workoutRatioMap.get('Long')) /
    workoutCountMap.get('Long')
  );
  //console.log(longRunMiles, numMilesForWorkout);
  return numMilesForWorkout < longRunMiles ? false : true;
}

function splitRun(numMiles) {
  const largerNum = Math.ceil(numMiles * 0.7);
  const smallerNum = numMiles - largerNum;

  return [largerNum, smallerNum];
}

function createWorkout(dateOfWorkout, numberOfMiles, workoutType, eventTitle) {
  return {
    event_date: dateOfWorkout,
    event_title: eventTitle != null ? eventTitle : `${workoutType} - ${numberOfMiles} miles`,
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
      workoutRatio.set(workouts[0], 1);
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

function isEven(num) {
  if(num % 2 === 0) {
    return true; // even
  } else {
    return false; // odd
  }
}

export { createTrainingPlan };
