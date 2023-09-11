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
  zonePreferences, // The % of mileage specified for each workout type
  numWeeksUntilRace // # weeks for training
) {

  nextRun = new Date(startDay); //(startDay);
  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, mileageGoal); // [10, 15, 20, etc., taper]
  const workoutRatio = createWorkoutPercentileMap(zonePreferences);
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
        let raceShakeout = createWorkout(nextRun);
        allRuns.push(raceShakeout);

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
  return numMilesForWorkout < longRunMiles ? false : true;
}

function splitRun(numMiles) {
  const largerNum = Math.floor(numMiles * 0.6);
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

function createWorkoutPercentileMap(zonePreferences) {
  let workoutRatio = new Map();

  if (zonePreferences[0] > 0) workoutRatio.set("Easy", zonePreferences[0]);
  if (zonePreferences[1] > 0) workoutRatio.set("Tempo", zonePreferences[1]);
  if (zonePreferences[2] > 0) workoutRatio.set("Speed", zonePreferences[2]);
  if (zonePreferences[3] > 0) workoutRatio.set("Long", zonePreferences[3]);

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
