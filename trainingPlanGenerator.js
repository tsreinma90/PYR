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

function convertPaceToDecimal(pace) {
  // Trim to the first 4 characters (e.g., "9:05" → "9:0")
  pace = pace.trim().slice(0, 4);

  let [minutes, seconds] = pace.split(":").map(Number);
  return minutes + (seconds / 60);
}

function createTrainingPlan(
  startDay,
  mileageGoal,
  raceDate,
  goalPace,
  numWeeksUntilRace
) {
  nextRun = new Date(startDay);
  raceDate = new Date(raceDate); // Ensure raceDate is a Date object

  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, mileageGoal);
  const experienceLevel = determineExperienceLevel(mileageGoal, goalPace);
  const workoutMap = createDynamicWorkoutMap(experienceLevel, raceDate);
  const workoutRatio = calculateWorkoutPercentiles(workoutMap);
  const workoutCount = countUniqueValuesInMap(workoutMap);

  return generateRuns(nextRun, milesPerWeek, workoutMap, workoutRatio, workoutCount, raceDate);
}

// Determine experience level based on mileage and pace
function determineExperienceLevel(mileageGoal, goalPace) {
  let pace = convertPaceToDecimal(goalPace);

  if (mileageGoal > 50 || pace <= 7) {
    return 'advanced';
  } else if (mileageGoal >= 25 || pace <= 9) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

function createDynamicWorkoutMap(experienceLevel, raceDistance) {
  let workoutMap = new Map();

  // Frequency and type of runs based on experience + race distance
  if (experienceLevel === 'beginner') {
    workoutMap.set("Monday", ["Easy"]);
    workoutMap.set("Tuesday", ["Easy"]);
    workoutMap.set("Wednesday", ["Rest"]);
    workoutMap.set("Thursday", ["Easy"]);
    workoutMap.set("Friday", ["Rest"]);
    workoutMap.set("Saturday", ["Long"]);
    workoutMap.set("Sunday", ["Easy"]);
  } else if (experienceLevel === 'intermediate') {
    workoutMap.set("Monday", ["Easy"]);
    workoutMap.set("Tuesday", ["Tempo"]);
    workoutMap.set("Wednesday", ["Easy"]);
    workoutMap.set("Thursday", ["Speed"]);
    workoutMap.set("Friday", ["Rest"]);
    workoutMap.set("Saturday", ["Long"]);
    workoutMap.set("Sunday", ["Easy"]);
  } else if (experienceLevel === 'advanced') {
    workoutMap.set("Monday", ["Easy"]);
    workoutMap.set("Tuesday", ["Tempo"]);
    workoutMap.set("Wednesday", ["Speed"]);
    workoutMap.set("Thursday", ["Easy"]);
    workoutMap.set("Friday", ["Rest"]);
    workoutMap.set("Saturday", ["Long"]);
    workoutMap.set("Sunday", ["Speed"]);
  }

  // Adjust by race type:
  if (raceDistance === "5k" || raceDistance === "10k") {
    // Focus more on speed work
    workoutMap.set("Wednesday", ["Speed"]);
  } else if (raceDistance === "half" || raceDistance === "marathon") {
    // Focus more on long/tempo work
    workoutMap.set("Wednesday", ["Tempo"]);
  }

  return workoutMap;
}

// Adjust workout percentiles based on dynamic map
function calculateWorkoutPercentiles(workoutMap) {
  let workoutCount = countUniqueValuesInMap(workoutMap);
  let totalWorkouts = Array.from(workoutCount.values()).reduce((a, b) => a + b, 0);

  let workoutRatio = new Map();
  workoutCount.forEach((count, type) => {
    workoutRatio.set(type, count / totalWorkouts);
  });

  return workoutRatio;
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

      if (nextRun.getTime() === raceDate.getTime()) {
        // Create race day event
        let raceShakeout = createWorkout(nextRun, 3, "Race", "Race Day!");
        allRuns.push(raceShakeout);
      } else if (workoutMap.has(dayOfWeek)) {
        let workoutType = workoutMap.get(dayOfWeek)[0];
        /*if (workoutType === "Rest") {
          console.log(`Skipping ${dayOfWeek} (Rest Day)`);
          continue;
        }*/

        // Adjust distance based on workout type
        let numMiles = calculateWorkoutDistance(
          milesPerWeek[i],
          workoutType,
          workoutRatio,
          workoutCount
        );

        if (longRunIncluded && workoutType !== 'Long' && numMiles >= 12) {
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

// Adjust distance based on type + weekly total
function calculateWorkoutDistance(
  weeklyMileage,
  workoutType,
  workoutRatio,
  workoutCount
) {
  let baseMiles = Math.ceil(
    (weeklyMileage * workoutRatio.get(workoutType)) / workoutCount.get(workoutType)
  );

  // Distance modifiers based on workout type
  const distanceModifiers = {
    "Easy": 0.9,     // ~90% of calculated mileage
    "Tempo": 0.7,    // Shorter than easy
    "Speed": 0.6,    // Shorter, higher intensity
    "Long": 1.4,     // Long runs should be significantly longer
    "Race": 1.0
  };

  let adjustedMiles = Math.round(baseMiles * (distanceModifiers[workoutType] || 1.0));

  // Ensure runs are at least 3 miles, but not more than 40% of weekly mileage
  return Math.max(3, Math.min(adjustedMiles, Math.ceil(weeklyMileage * 0.4)));
}

// Progressive mileage builder
function createWeeklyMileage(numOfWeeks, maxMileage) {
  let milesPerWeek = [];
  
  const startingMileage = Math.ceil(0.6 * maxMileage); // Start at 60% of max mileage
  const increaseRate = (maxMileage - startingMileage) / (numOfWeeks - 3); // Spread increase over plan, save room for taper
  
  for (let i = 1; i <= numOfWeeks - 3; i++) {
    milesPerWeek.push(Math.ceil(startingMileage + increaseRate * i));
  }

  // Taper phase (reduce mileage over last 3 weeks)
  milesPerWeek.push(Math.ceil(maxMileage * 0.7)); // 3 weeks out
  milesPerWeek.push(Math.ceil(maxMileage * 0.5)); // 2 weeks out
  milesPerWeek.push(Math.ceil(maxMileage * 0.3)); // Race week

  return milesPerWeek;
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

/*function createWeeklyMileage(numOfWeeks, maxMileage) {
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
}*/

function isEven(num) {
  if(num % 2 === 0) {
    return true; // even
  } else {
    return false; // odd
  }
}

export { createTrainingPlan };
