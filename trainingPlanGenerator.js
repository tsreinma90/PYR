import {
  WORKOUT_CATALOG,
  getWorkoutTypeById,
  getQualityDays,
  isBackToBackHardDays,
  createWorkoutInstance
} from "./workoutsCatalog.js";

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


// Helper to pad numbers to 2 digits
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Always use a stable local date (set to noon) to avoid DST boundary issues.
function normalizeLocalNoon(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

// Parse inputs like "YYYY-MM-DD" as a LOCAL date (not UTC) and normalize to noon.
function parseLocalDate(input) {
  if (input instanceof Date) {
    return normalizeLocalNoon(input);
  }
  if (typeof input === "string") {
    // Prefer YYYY-MM-DD if present.
    const m = input.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      return new Date(y, mo, d, 12, 0, 0, 0);
    }
  }
  // Fallback: let Date parse, then normalize.
  return normalizeLocalNoon(new Date(input));
}

function formatLocalDateKey(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

Date.prototype.addDays = function (days) {
  // Construct a new local date at noon to prevent DST from shifting the calendar day.
  return new Date(this.getFullYear(), this.getMonth(), this.getDate() + days, 12, 0, 0, 0);
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

function getTrainingPhase(weekNumber, totalWeeks) {
  const progress = weekNumber / totalWeeks;

  if (progress < 0.4) return "base";
  if (progress < 0.7) return "build";
  if (progress < 0.9) return "peak";
  return "taper";
}

function getRecommendedPace(workoutType, goalPace, trainingPhase) {
  const goalDecimal = convertPaceToDecimal(goalPace);

  // Define phase-based offsets (seconds per mile)
  const PACE_OFFSETS = {
    Easy:   { base: 75, build: 60, peak: 45, taper: 45 },
    Tempo:  { base: 35, build: 25, peak: 15, taper: 10 },
    Speed:  { base: -10, build: -20, peak: -30, taper: -20 },
    Long:   { base: 90, build: 60, peak: 45, taper: 45 }
  };

  // Default to 0 if workout type not found
  const offset = (PACE_OFFSETS[workoutType] && PACE_OFFSETS[workoutType][trainingPhase]) || 0;

  const recommendedDecimal = goalDecimal + offset / 60; // convert seconds to minutes
  return {
    pace: decimalToPace(recommendedDecimal),
    pace_decimal: recommendedDecimal
  };
}


function createTrainingPlan(
  startDay,
  mileageGoal,
  raceDate,
  goalPace,
  numWeeksUntilRace,
  preferences = null
) {
  nextRun = parseLocalDate(startDay);
  raceDate = parseLocalDate(raceDate);
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
    raceDate,
    preferences
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

function allowedWorkoutFamilies(preferences) {
  const ids = preferences?.selectedWorkoutTypeIds;
  if (!Array.isArray(ids)) return { tempo: true, speed: true };

  const joined = ids.map(String).join(" ").toLowerCase();
  return {
    tempo: joined.includes("tempo") || joined.includes("threshold") || joined.includes("progression") || joined.includes("cruise"),
    speed: joined.includes("speed") || joined.includes("interval") || joined.includes("repeat") || joined.includes("hill") || joined.includes("fartlek")
  };
}

/* 
  createWeeklyWorkoutMap now:
  - In non-final weeks, assigns workouts with variation.
  - In the final week, only light, easy runs (max 10 miles overall) are scheduled.
  - Schedules quality days on Tuesday + Thursday (spreads intensity; avoids Tue/Wed back-to-back quality).
*/
function createWeeklyWorkoutMap(experienceLevel, weekNumber, totalWeeks, preferences = null) {
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

  // Step 1 fix: always spread quality workouts across Tuesday + Thursday.
  // This prevents back-to-back quality sessions on Tue/Wed.
  const qualityDays = ["Tuesday", "Thursday"];

  const tempoVariations = ["Steady state", "Progression", "Cruise intervals"];
  const speedVariations = ["400m repeats", "800m intervals", "Fartlek", "Hill repeats"];

  const allowed = allowedWorkoutFamilies(preferences);

  function chooseQualityWorkout() {
    if (!allowed.tempo && !allowed.speed) return "Easy";
    if (!allowed.tempo) return "Speed";
    if (!allowed.speed) return "Tempo";
    return Math.random() < 0.75 ? "Tempo" : "Speed";
  }

  for (let i = 0; i < 7; i++) {
    const dayName = weekdayMap.get(i);
    if (dayName === restDay) {
      map.set(dayName, { type: "Rest", note: "" });
      continue;
    }

    if (dayName === longRunDay) {
      map.set(dayName, { type: "Long", note: "" });
      continue;
    }

    // Quality days (Tue/Thu). In taper weeks, keep these easy.
    if (qualityDays.includes(dayName)) {
      if (isTaper) {
        map.set(dayName, { type: "Easy", note: "Taper: Recovery run" });
      } else {
        const chosenType = chooseQualityWorkout();
        if (chosenType === "Easy") {
          map.set(dayName, { type: "Easy", note: "" });
        } else {
          const notePool = chosenType === "Tempo" ? tempoVariations : speedVariations;
          const note = notePool[Math.floor(Math.random() * notePool.length)];
          map.set(dayName, { type: chosenType, note });
        }
      }
      continue;
    }

    // Default: easy day
    map.set(dayName, { type: "Easy", note: "" });
  }
  return map;
}

function generateRuns(
  nextRun,
  milesPerWeek,
  baseWorkoutMap,
  workoutRatio,
  workoutCount,
  raceDate,
  preferences = null
) {
  let allRuns = [];
  let experienceLevel = determineExperienceLevel(
    milesPerWeek[milesPerWeek.length - 1],
    "8:00" // default pace (adjustable)
  );

  for (let week = 0; week < milesPerWeek.length; week++) {
    const trainingPhase = getTrainingPhase(week, milesPerWeek.length);
    const weeklyMap = createWeeklyWorkoutMap(experienceLevel, week, milesPerWeek.length, preferences);
    const longRunIncluded = longRunIncludedInPlan(weeklyMap);

    for (let x = 0; x < 7; x++) {
      // When we reach race day, schedule a dedicated race event and stop further run generation.
      if (nextRun.getTime() === raceDate.getTime()) {
        const meta = {
          week_index: week,
          day_index: nextRun.getDay(),
          day_name: weekdayMap.get(nextRun.getDay()),
          order_in_day: 1,
          date_key: formatLocalDateKey(nextRun)
        };
        let raceEvent = createWorkout(nextRun, 3, "Race", "Race Day!", "", trainingPhase, meta);
        allRuns.push(raceEvent);
        return allRuns;
      }

      let dayOfWeek = weekdayMap.get(nextRun.getDay());
      const dayIndex = nextRun.getDay();
      const dateKey = formatLocalDateKey(nextRun);
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
              note,
              trainingPhase,
              {
                week_index: week,
                day_index: dayIndex,
                day_name: dayOfWeek,
                order_in_day: 1,
                date_key: dateKey
              }
            );
            let eveningRun = createWorkout(
              nextRun,
              result[1],
              workoutType,
              `Evening ${workoutType} - ${result[1]} miles`,
              note,
              trainingPhase,
              {
                week_index: week,
                day_index: dayIndex,
                day_name: dayOfWeek,
                order_in_day: 2,
                date_key: dateKey
              }
            );
            allRuns.push(morningRun);
            allRuns.push(eveningRun);
          } else {
            let workout = createWorkout(nextRun, numMiles, workoutType, null, note, trainingPhase, {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey
            });
            allRuns.push(workout);
          }
        } else {
          let workout = createWorkout(nextRun, numMiles, workoutType, null, note, trainingPhase, {
            week_index: week,
            day_index: dayIndex,
            day_name: dayOfWeek,
            order_in_day: 1,
            date_key: dateKey
          });
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

// Progressive mileage builder with adaptive taper.
function createWeeklyMileage(numOfWeeks, maxMileage) {
  let milesPerWeek = [];
  const startingMileage = Math.ceil(0.6 * maxMileage);

  // Dynamic taper length
  let taperWeeks;
  if (numOfWeeks <= 5) taperWeeks = 1;
  else if (numOfWeeks <= 7) taperWeeks = 2;
  else taperWeeks = 3;

  const buildWeeks = numOfWeeks - taperWeeks;
  const increaseRate = (maxMileage - startingMileage) / Math.max(buildWeeks - 1, 1);

  // Build phase
  for (let i = 0; i < buildWeeks; i++) {
    milesPerWeek.push(Math.ceil(startingMileage + increaseRate * i));
  }

  // Taper phase
  for (let t = taperWeeks; t > 1; t--) {
    milesPerWeek.push(Math.ceil(maxMileage * (0.5 + 0.2 * (t - 1)))); 
  }

  // Final (race) week: cap at 10 miles
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
function createWorkout(
  dateOfWorkout,
  numberOfMiles,
  workoutType,
  eventTitle,
  eventNote = "",
  trainingPhase = "",
  meta = {}
) {
  let pace = null;
  let pace_decimal = null;
  // For applicable workouts, append recommended pace information.
  if (workoutType !== "Rest" && workoutType !== "Race" && globalGoalPace) {
    const recommended = getRecommendedPace(workoutType, globalGoalPace, trainingPhase);
    pace = recommended.pace;
    pace_decimal = recommended.pace_decimal;
    if (eventNote && eventNote.length > 0) {
      eventNote += " | ";
    }
    eventNote += `Recommended pace: ${pace} per mile`;
  }
  // Attach stable placement metadata so the UI can render multiple runs on the same day
  // without shifting subsequent workouts by array index.
  const dayIndex = meta.day_index != null ? meta.day_index : dateOfWorkout.getDay();
  const dayName = meta.day_name != null ? meta.day_name : weekdayMap.get(dayIndex);
  const dateKey = meta.date_key != null ? meta.date_key : formatLocalDateKey(dateOfWorkout);
  const orderInDay = meta.order_in_day != null ? meta.order_in_day : 1;
  const weekIndex = meta.week_index != null ? meta.week_index : null;
  return {
    event_date: dateOfWorkout,
    event_date_key: dateKey,
    event_day_index: dayIndex,
    event_day_name: dayName,
    event_order_in_day: orderInDay,
    event_week_index: weekIndex,
    event_title: eventTitle != null ? eventTitle : `${workoutType} - ${numberOfMiles} miles`,
    event_workout: workoutType,
    event_distance: numberOfMiles,
    event_notes: eventNote,
    event_theme: themeMap.get(workoutType),
    event_pace: pace,
    event_pace_decimal: pace_decimal,
    event_phase: trainingPhase
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