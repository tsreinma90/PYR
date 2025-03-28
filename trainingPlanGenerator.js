const weekdayMap = new Map();
const themeMap = new Map();

let nextRun = "";
let globalGoalPace = ""; // New global to store the goal pace

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
  themeMap.set("Race", "gold");
})();

Date.prototype.addDays = function (days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

function convertPaceToDecimal(pace) {
  // Trim to the first 4 characters (e.g., "9:05" → "9:0")
  pace = pace.trim().slice(0, 4);
  let [minutes, seconds] = pace.split(":").map(Number);
  return minutes + seconds / 60;
}

// Helper: convert a decimal pace to "mm:ss" format.
function decimalToPace(decimal) {
  let minutes = Math.floor(decimal);
  let seconds = Math.round((decimal - minutes) * 60);
  if (seconds < 10) seconds = "0" + seconds;
  return `${minutes}:${seconds}`;
}

// Helper: compute a recommended pace for a workout type.
// Adjust these numbers to suit your training philosophy.
function getRecommendedPace(workoutType, goalPace) {
  let goalDecimal = convertPaceToDecimal(goalPace);
  let recommendedDecimal;
  switch (workoutType) {
    case "Easy":
      recommendedDecimal = goalDecimal + 1.0; // 60 sec slower
      break;
    case "Tempo":
      recommendedDecimal = goalDecimal - 0.1; // 6 sec faster
      break;
    case "Speed":
      recommendedDecimal = goalDecimal - 0.2; // 12 sec faster
      break;
    case "Long":
      recommendedDecimal = goalDecimal + 1.5; // 90 sec slower
      break;
    default:
      recommendedDecimal = goalDecimal;
      break;
  }
  return decimalToPace(recommendedDecimal);
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
  globalGoalPace = goalPace; // Save the goal pace globally

  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, mileageGoal);
  const experienceLevel = determineExperienceLevel(mileageGoal, goalPace);
  // Use the dynamic workout map to calculate overall percentiles.
  const workoutMap = createDynamicWorkoutMap(experienceLevel, raceDate);
  const workoutRatio = calculateWorkoutPercentiles(workoutMap);
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

// Determine experience level based on mileage and pace
function determineExperienceLevel(mileageGoal, goalPace) {
  let pace = convertPaceToDecimal(goalPace);
  if (mileageGoal > 50 || pace <= 7) {
    return "advanced";
  } else if (mileageGoal >= 25 || pace <= 9) {
    return "intermediate";
  } else {
    return "beginner";
  }
}

// This map is used only for calculating workout percentiles.
function createDynamicWorkoutMap(experienceLevel, raceDistance) {
  let workoutMap = new Map();
  if (experienceLevel === "beginner") {
    workoutMap.set("Monday", ["Easy"]);
    workoutMap.set("Tuesday", ["Easy"]);
    workoutMap.set("Wednesday", ["Rest"]);
    workoutMap.set("Thursday", ["Easy"]);
    workoutMap.set("Friday", ["Rest"]);
    workoutMap.set("Saturday", ["Long"]);
    workoutMap.set("Sunday", ["Easy"]);
  } else if (experienceLevel === "intermediate") {
    workoutMap.set("Monday", ["Easy"]);
    workoutMap.set("Tuesday", ["Tempo"]);
    workoutMap.set("Wednesday", ["Easy"]);
    workoutMap.set("Thursday", ["Speed"]);
    workoutMap.set("Friday", ["Rest"]);
    workoutMap.set("Saturday", ["Long"]);
    workoutMap.set("Sunday", ["Easy"]);
  } else if (experienceLevel === "advanced") {
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
    workoutMap.set("Wednesday", ["Speed"]);
  } else if (raceDistance === "half" || raceDistance === "marathon") {
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

/* 
  createWeeklyWorkoutMap now:
  - In non-final weeks, assigns workouts with variation.
  - In the final week, only light, easy runs (max 10 miles overall) are scheduled.
  - Alternates quality days week over week to avoid back-to-back similar workouts.
*/
function createWeeklyWorkoutMap(experienceLevel, weekNumber, totalWeeks) {
  let map = new Map();
  const isTaper = weekNumber >= totalWeeks - 3;

  // Final (race) week: limit to only Tuesday and Thursday, and ensure easy runs.
  if (weekNumber === totalWeeks - 1) {
    map.set("Tuesday", { type: "Easy", note: "Final week recovery run" });
    map.set("Thursday", { type: "Easy", note: "Final week recovery run" });
    return map;
  }

  const restDayOptions = ["Friday", "Wednesday", "Monday"];
  const restDay = restDayOptions[weekNumber % restDayOptions.length];
  const longRunDay = "Saturday";
  const easyDays = ["Monday", "Thursday", "Sunday"];
  // Vary quality days: even weeks get Tuesday & Wednesday; odd weeks get Tuesday & Thursday.
  let qualityDays;
  if (weekNumber % 2 === 0) {
    qualityDays = ["Tuesday", "Wednesday"];
  } else {
    qualityDays = ["Tuesday", "Thursday"];
  }

  let qualityTypes;
  if (experienceLevel === "beginner") {
    qualityTypes = ["Tempo"];
  } else if (experienceLevel === "intermediate" || experienceLevel === "advanced") {
    qualityTypes = ["Tempo", "Speed"];
  }
  const tempoVariations = ["Steady state", "Progression", "Cruise intervals"];
  const speedVariations = ["400m repeats", "800m intervals", "Fartlek", "Hill repeats"];

  // Helper: weighted selection favoring Tempo (75% Tempo, 25% Speed)
  function chooseQualityWorkout() {
    if (qualityTypes.length === 1) return qualityTypes[0];
    return Math.random() < 0.75 ? "Tempo" : "Speed";
  }

  for (let i = 0; i < 7; i++) {
    const dayName = weekdayMap.get(i);
    if (dayName === restDay) {
      map.set(dayName, { type: "Rest", note: "" });
    } else if (dayName === longRunDay) {
      map.set(dayName, { type: "Long", note: "" });
    } else if (easyDays.includes(dayName)) {
      map.set(dayName, { type: "Easy", note: "" });
    } else if (qualityDays.includes(dayName)) {
      if (isTaper) {
        map.set(dayName, { type: "Easy", note: "Taper: Recovery run" });
      } else {
        let chosenType = chooseQualityWorkout();
        const notePool = chosenType === "Tempo" ? tempoVariations : speedVariations;
        let note = notePool[Math.floor(Math.random() * notePool.length)];
        map.set(dayName, { type: chosenType, note: note });
      }
    } else {
      map.set(dayName, { type: "Easy", note: "" });
    }
  }
  return map;
}

function generateRuns(
  nextRun,
  milesPerWeek,
  baseWorkoutMap,
  workoutRatio,
  workoutCount,
  raceDate
) {
  let allRuns = [];
  let experienceLevel = determineExperienceLevel(
    milesPerWeek[milesPerWeek.length - 1],
    "8:00" // default pace (adjustable)
  );

  for (let week = 0; week < milesPerWeek.length; week++) {
    const weeklyMap = createWeeklyWorkoutMap(experienceLevel, week, milesPerWeek.length);
    const longRunIncluded = longRunIncludedInPlan(weeklyMap);

    for (let x = 0; x < 7; x++) {
      // When we reach race day, schedule a dedicated race event and stop further run generation.
      if (nextRun.getTime() === raceDate.getTime()) {
        let raceEvent = createWorkout(nextRun, 3, "Race", "Race Day!");
        allRuns.push(raceEvent);
        return allRuns;
      }

      let dayOfWeek = weekdayMap.get(nextRun.getDay());
      // In final week, only schedule runs on Tuesday and Thursday.
      if (week === milesPerWeek.length - 1) {
        const allowedDays = ["Tuesday", "Thursday"];
        if (!allowedDays.includes(dayOfWeek)) {
          nextRun = nextRun.addDays(1);
          continue;
        }
      }

      if (weeklyMap.has(dayOfWeek)) {
        let { type: workoutType, note } = weeklyMap.get(dayOfWeek);
        let numMiles = calculateWorkoutDistance(
          milesPerWeek[week],
          workoutType,
          workoutRatio,
          workoutCount
        );
        if (longRunIncluded && workoutType !== "Long" && numMiles >= 12) {
          let doDoubleDay = splitRunIntoTwo(numMiles, milesPerWeek[week], workoutRatio, workoutCount);
          if (doDoubleDay) {
            let result = splitRun(numMiles);
            let morningRun = createWorkout(
              nextRun,
              result[0],
              workoutType,
              `Morning ${workoutType} - ${result[0]} miles`,
              note
            );
            let eveningRun = createWorkout(
              nextRun,
              result[1],
              workoutType,
              `Evening ${workoutType} - ${result[1]} miles`,
              note
            );
            allRuns.push(morningRun);
            allRuns.push(eveningRun);
          } else {
            let workout = createWorkout(nextRun, numMiles, workoutType, null, note);
            allRuns.push(workout);
          }
        } else {
          let workout = createWorkout(nextRun, numMiles, workoutType, null, note);
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
  const distanceModifiers = {
    "Easy": 0.9,
    "Tempo": 0.7,
    "Speed": 0.6,
    "Long": 1.4,
    "Race": 1.0
  };
  let adjustedMiles = Math.round(baseMiles * (distanceModifiers[workoutType] || 1.0));
  return Math.max(3, Math.min(adjustedMiles, Math.ceil(weeklyMileage * 0.4)));
}

// Progressive mileage builder with recovery taper.
// Final week mileage is capped at 10 miles.
function createWeeklyMileage(numOfWeeks, maxMileage) {
  let milesPerWeek = [];
  const startingMileage = Math.ceil(0.6 * maxMileage);
  const increaseRate = (maxMileage - startingMileage) / (numOfWeeks - 3);
  for (let i = 1; i <= numOfWeeks - 3; i++) {
    milesPerWeek.push(Math.ceil(startingMileage + increaseRate * i));
  }
  // Taper phase: last 3 weeks reduce mileage.
  milesPerWeek.push(Math.ceil(maxMileage * 0.7)); // 3 weeks out
  milesPerWeek.push(Math.ceil(maxMileage * 0.5)); // 2 weeks out
  // Final (race) week: cap total mileage at 10 miles.
  milesPerWeek.push(Math.min(Math.ceil(maxMileage * 0.3), 10));
  return milesPerWeek;
}

function longRunIncludedInPlan(workoutMap) {
  for (const workout of workoutMap.values()) {
    if (workout.type === "Long") {
      return true;
    }
  }
  return false;
}

function splitRunIntoTwo(numMilesForWorkout, numMilesForWeek, workoutRatioMap, workoutCountMap) {
  let longRunMiles = Math.ceil(
    (numMilesForWeek * workoutRatioMap.get("Long")) / workoutCountMap.get("Long")
  );
  return numMilesForWorkout < longRunMiles ? false : true;
}

function splitRun(numMiles) {
  const largerNum = Math.floor(numMiles * 0.6);
  const smallerNum = numMiles - largerNum;
  return [largerNum, smallerNum];
}

// Modified createWorkout now adds recommended pace info based on globalGoalPace.
// For non-Rest and non-Race workouts, it appends "Recommended pace: X per mile" to the event notes.
function createWorkout(dateOfWorkout, numberOfMiles, workoutType, eventTitle, eventNote = "") {
  // For applicable workouts, append recommended pace information.
  if (workoutType !== "Rest" && workoutType !== "Race" && globalGoalPace) {
    const recommended = getRecommendedPace(workoutType, globalGoalPace);
    if (eventNote && eventNote.length > 0) {
      eventNote += " | ";
    }
    eventNote += `Recommended pace: ${recommended} per mile`;
  }
  return {
    event_date: dateOfWorkout,
    event_title: eventTitle != null ? eventTitle : `${workoutType} - ${numberOfMiles} miles`,
    event_workout: workoutType,
    event_distance: numberOfMiles,
    event_notes: eventNote,
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

function isEven(num) {
  return num % 2 === 0;
}

export { createTrainingPlan };