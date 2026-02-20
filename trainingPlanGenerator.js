import { WORKOUT_DICTIONARY } from "./workoutDictionary.js";
import { TEMPLATE_REGISTRY } from "./templates/templateRegistry.js";

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

  // Handle rounding edge case (e.g. 7:60 → 8:00)
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }

  if (seconds < 10) seconds = "0" + seconds;
  return `${minutes}:${seconds}`;
}

// Helper: compute a pace range (min/max) in "mm:ss" format given a center decimal and range in seconds
function getPaceRange(centerDecimal, rangeSeconds) {
  const minDecimal = centerDecimal - rangeSeconds / 60;
  const maxDecimal = centerDecimal + rangeSeconds / 60;
  return {
    min: decimalToPace(minDecimal),
    max: decimalToPace(maxDecimal),
    min_decimal: minDecimal,
    max_decimal: maxDecimal
  };
}

function getTrainingPhase(weekNumber, totalWeeks) {
  const progress = weekNumber / totalWeeks;

  if (progress < 0.4) return "base";
  if (progress < 0.7) return "build";
  if (progress < 0.9) return "peak";
  return "taper";
}

// Determine progression level based on training phase
function getProgressionLevel(trainingPhase, progressionArray) {
  if (!Array.isArray(progressionArray) || progressionArray.length === 0) {
    return null;
  }

  // Sort levels ascending just in case
  const sorted = [...progressionArray].sort((a, b) => a.level - b.level);

  if (trainingPhase === "base") {
    return sorted[0]; // easiest level
  }

  if (trainingPhase === "build") {
    return sorted[Math.min(1, sorted.length - 1)]; // level 2 if exists
  }

  if (trainingPhase === "peak") {
    return sorted[sorted.length - 1]; // hardest available
  }

  if (trainingPhase === "taper") {
    return sorted[0]; // reduce back down
  }

  return sorted[0];
}

// Helper: Derive Long Run Type and Effort (RPE) guidance from training phase
function getLongRunProfile(trainingPhase) {
  switch (trainingPhase) {
    case "base":
      return {
        label: "Aerobic",
        effort: "RPE 2–3 (easy, conversational)"
      };
    case "build":
      return {
        label: "Progressive",
        effort: "RPE 3 → 5 (easy to steady)"
      };
    case "peak":
      return {
        label: "Race-Specific",
        effort: "RPE 3 → 6–7 (easy to race effort)"
      };
    case "taper":
      return {
        label: "Reduced",
        effort: "RPE 2–3 (relaxed, freshening up)"
      };
    default:
      return null;
  }
}

function getRecommendedPace(workoutType, goalPace, trainingPhase) {
  const goalDecimal = convertPaceToDecimal(goalPace);

  // Define phase-based offsets (seconds per mile)
  const PACE_OFFSETS = {
    Easy: { base: 90, build: 75, peak: 60, taper: 60 },
    Tempo: { base: 35, build: 25, peak: 15, taper: 10 },
    Speed: { base: -10, build: -20, peak: -30, taper: -20 },
    Long: { base: 90, build: 75, peak: 60, taper: 60 }
  };

  // Default to 0 if workout type not found
  const offset = (PACE_OFFSETS[workoutType] && PACE_OFFSETS[workoutType][trainingPhase]) || 0;

  const recommendedDecimal = goalDecimal + offset / 60; // convert seconds to minutes

  // Easy & Long runs use pace ranges; Tempo & Speed stay precise
  if (workoutType === "Easy" || workoutType === "Long") {
    const rangeSeconds = workoutType === "Easy" ? 20 : 30;
    const range = getPaceRange(recommendedDecimal, rangeSeconds);
    return {
      pace: `${range.min}–${range.max}`,
      pace_decimal: recommendedDecimal,
      pace_min: range.min,
      pace_max: range.max,
      pace_min_decimal: range.min_decimal,
      pace_max_decimal: range.max_decimal
    };
  }

  return {
    pace: decimalToPace(recommendedDecimal),
    pace_decimal: recommendedDecimal
  };
}

/*
  Maps structured workout dictionary intensity → existing workoutType
  This lets us keep the current pace engine intact while supporting
  the new structured workout system.
*/
const INTENSITY_TO_WORKOUTTYPE = {
  easy: "Easy",
  threshold: "Tempo",
  vo2: "Speed",
  hill: "Speed",
  stride: "Speed",
  progression: "Long",
  marathon: "Long"
};

function getRecommendedPaceByIntensity(intensity, goalPace, trainingPhase) {
  const workoutType = INTENSITY_TO_WORKOUTTYPE[intensity] || "Easy";
  return getRecommendedPace(workoutType, goalPace, trainingPhase);
}


function createTrainingPlan(
  startDay,
  mileageGoal,
  raceDate,
  goalPace,
  numWeeksUntilRace,
  raceDistance,
  preferences = null
) {
  console.log('*** top of method');
  nextRun = parseLocalDate(startDay);
  raceDate = parseLocalDate(raceDate);
  globalGoalPace = goalPace; // Save the goal pace globally

  // mileageGoal is already the computed numeric peak mileage
  const peakMileage = mileageGoal;

  console.log('*** peakMileage:', peakMileage);

  const milesPerWeek = createWeeklyMileage(numWeeksUntilRace, peakMileage);
  const experienceLevel = determineExperienceLevel(peakMileage, goalPace);

  console.log('*** experienceLevel:', milesPerWeek, experienceLevel);

  // Normalize race distance to match template keys
  let normalizedDistance = null;
  if (typeof raceDistance === "string") {
    const lower = raceDistance.toLowerCase();

    if (lower.includes("half")) {
      normalizedDistance = "half-marathon";
    } else if (lower.includes("marathon") && !lower.includes("half")) {
      normalizedDistance = "marathon";
    } else if (lower.includes("10")) {
      normalizedDistance = "10k";
    } else if (lower.includes("5")) {
      normalizedDistance = "5k";
    }
  }

  console.log("🔥 ENTERED createTrainingPlan");

  // Attempt multiple key fallbacks to avoid silent template misses
  let template =
    TEMPLATE_REGISTRY?.[normalizedDistance] ||
    TEMPLATE_REGISTRY?.[raceDistance] ||
    TEMPLATE_REGISTRY?.[String(raceDistance).toLowerCase()] ||
    null;

  console.log("Normalized distance:", normalizedDistance);
  console.log("Available template keys:", Object.keys(TEMPLATE_REGISTRY || {}));
  console.log("Template found:", !!template);

  return generateRuns(
    nextRun,
    milesPerWeek,
    template,
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
  template,
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
    let weeklyTemplate = null;
    console.log('*** TEMPLATE:', JSON.stringify(template));
    if (template?.structure) {
      const phase = getTrainingPhase(week, milesPerWeek.length);
      weeklyTemplate = template.structure[phase] || null;
    } else if (template?.weeks) {
      weeklyTemplate = template.weeks?.[week] || null;
    }
    // For legacy fallback, we could use createWeeklyWorkoutMap, but per instructions, remove its usage here.
    const longRunIncluded = false; // No weeklyMap, so we can't check; safe placeholder for now.

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
      const dayKey = dayOfWeek;
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

      if (weeklyTemplate && weeklyTemplate.workouts[dayKey]) {
        let workoutConfig = weeklyTemplate.workouts[dayKey];
        let workoutType = workoutConfig.type || null;
        let note = workoutConfig.note || "";

        if (workoutConfig.id) {
          const id = workoutConfig.id;
          if (id.includes("THRESHOLD")) workoutType = "Tempo";
          else if (id.includes("VO2")) workoutType = "Speed";
          else if (id.includes("LONG")) workoutType = "Long";
        }
        // ---- Structured Threshold Workout Injection (Phase 1) ----
        if (workoutType === "Tempo") {
          const thresholdWorkout = WORKOUT_DICTIONARY.THRESHOLD_MILE_REPEATS;

          // Determine tier using weekly mileage
          const weeklyMileage = milesPerWeek[week];
          let tier = "beginner";
          if (weeklyMileage > 60) tier = "advanced";
          else if (weeklyMileage > 35) tier = "intermediate";

          // Determine week position within phase for smarter progression
          const totalWeeks = milesPerWeek.length;
          const phaseStartIndex = milesPerWeek.findIndex((_, i) =>
            getTrainingPhase(i, totalWeeks) === trainingPhase
          );

          const phaseWeeks = milesPerWeek
            .map((_, i) => i)
            .filter(i => getTrainingPhase(i, totalWeeks) === trainingPhase);

          const weekInPhase = phaseWeeks.indexOf(week);
          const phaseLength = phaseWeeks.length;

          // Determine progression index based on phase + position
          const sorted = [...thresholdWorkout.progression].sort((a, b) => a.level - b.level);
          let progressionLevel;

          if (trainingPhase === "base") {
            progressionLevel = weekInPhase % 2 === 0
              ? sorted[0]
              : sorted[Math.min(1, sorted.length - 1)];
          }
          else if (trainingPhase === "build") {
            const midPoint = Math.floor(phaseLength / 2);
            progressionLevel = weekInPhase < midPoint
              ? sorted[Math.min(1, sorted.length - 1)]
              : sorted[sorted.length - 1];
          }
          else if (trainingPhase === "peak") {
            progressionLevel = sorted[sorted.length - 1];
          }
          else { // taper
            progressionLevel = sorted[0];
          }

          const variant = progressionLevel.variants[tier];

          // Calculate rep distance (convert meters → miles if needed)
          const repDistanceMiles =
            variant.unit === "mile"
              ? variant.distance * variant.reps
              : (variant.distance * variant.reps) / 1609.34;

          const warmupMiles = thresholdWorkout.warmup?.distance || 0;
          const cooldownMiles = thresholdWorkout.cooldown?.distance || 0;

          const totalMiles = parseFloat(
            (warmupMiles + repDistanceMiles + cooldownMiles).toFixed(1)
          );

          const restLabel = `${variant.rest.value}${variant.rest.unit}`;
          const structuredNote =
            `${variant.reps} x ${variant.distance} ${variant.unit} @ threshold (rest ${restLabel})`;

          const workout = createWorkout(
            nextRun,
            totalMiles,
            "Tempo",
            null,
            structuredNote,
            trainingPhase,
            {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey
            }
          );

          allRuns.push(workout);
          nextRun = nextRun.addDays(1);
          continue;
        }

        // ---- Structured VO2 Workout Injection (Phase + Week Aware) ----
        if (workoutType === "Speed") {
          const vo2Workout = WORKOUT_DICTIONARY.VO2_800_REPEATS;

          // Determine tier using weekly mileage
          const weeklyMileage = milesPerWeek[week];
          let tier = "beginner";
          if (weeklyMileage > 60) tier = "advanced";
          else if (weeklyMileage > 35) tier = "intermediate";

          const totalWeeks = milesPerWeek.length;

          // Determine all week indices for this phase
          const phaseWeeks = milesPerWeek
            .map((_, i) => i)
            .filter(i => getTrainingPhase(i, totalWeeks) === trainingPhase);

          const weekInPhase = phaseWeeks.indexOf(week);
          const phaseLength = phaseWeeks.length;

          const sorted = [...vo2Workout.progression].sort((a, b) => a.level - b.level);
          let progressionLevel;

          if (trainingPhase === "base") {
            progressionLevel = sorted[0];
          }
          else if (trainingPhase === "build") {
            const midPoint = Math.floor(phaseLength / 2);
            progressionLevel = weekInPhase < midPoint
              ? sorted[Math.min(1, sorted.length - 1)]
              : sorted[sorted.length - 1];
          }
          else if (trainingPhase === "peak") {
            progressionLevel = sorted[sorted.length - 1];
          }
          else { // taper
            progressionLevel = sorted[0];
          }

          const variant = progressionLevel.variants[tier];

          const repDistanceMiles =
            (variant.distance * variant.reps) / 1609.34;

          const warmupMiles = vo2Workout.warmup?.distance || 0;
          const cooldownMiles = vo2Workout.cooldown?.distance || 0;

          const totalMiles = parseFloat(
            (warmupMiles + repDistanceMiles + cooldownMiles).toFixed(1)
          );

          const restLabel = `${variant.rest.value}${variant.rest.unit}`;
          const structuredNote =
            `${variant.reps} x ${variant.distance} ${variant.unit} @ VO2 (rest ${restLabel})`;

          const workout = createWorkout(
            nextRun,
            totalMiles,
            "Speed",
            null,
            structuredNote,
            trainingPhase,
            {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey
            }
          );

          allRuns.push(workout);
          nextRun = nextRun.addDays(1);
          continue;
        }
        // ---- Structured Long Run Injection (Phase + Tier Aware) ----
        if (workoutType === "Long") {
          const id = workoutConfig.id || "LONG_RUN_PROGRESSIVE";
          const longWorkout = WORKOUT_DICTIONARY[id] || WORKOUT_DICTIONARY.LONG_RUN_PROGRESSIVE;

          // Determine tier using weekly mileage
          const weeklyMileage = milesPerWeek[week];
          let tier = "beginner";
          if (weeklyMileage > 60) tier = "advanced";
          else if (weeklyMileage > 35) tier = "intermediate";

          const progressionLevel = getProgressionLevel(trainingPhase, longWorkout.progression);
          const variant = progressionLevel?.variants?.[tier] || {};

          // Base long run distance = ~20% of weekly mileage
          const baseLongMiles = Math.round(milesPerWeek[week] * 0.2) || 1;

          let structuredNote = "";

          // ---- Progressive Long Run ----
          if (variant.finishDistance) {
            const finishMiles = Math.min(
              variant.finishDistance,
              Math.floor(baseLongMiles * 0.5)
            );
            structuredNote =
              `Long run with final ${finishMiles} mile(s) at ${variant.finishMilesAt} pace`;
          }

          // ---- Race Specific Long Run ----
          else if (variant.racePaceSegments) {
            const segments = variant.racePaceSegments
              .map(seg => `${seg.distance} ${seg.unit}`)
              .join(" + ");
            structuredNote =
              `Long run including ${segments} at goal race pace`;
          }

          // ---- Sharpening Long Run ----
          else if (variant.pickups) {
            structuredNote =
              `Long run with ${variant.pickups.reps} x ${variant.pickups.duration}${variant.pickups.unit} pickups`;
          }

          const workout = createWorkout(
            nextRun,
            baseLongMiles,
            "Long",
            null,
            structuredNote,
            trainingPhase,
            {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey,
              structuredLong: true
            }
          );

          allRuns.push(workout);
          nextRun = nextRun.addDays(1);
          continue;
        }
        // For non-structured types, assign a placeholder mileage (since no workoutRatio/workoutCount).
        let numMiles = Math.round(milesPerWeek[week] / 7) || 1;
        let workout = createWorkout(nextRun, numMiles, workoutType, null, note, trainingPhase, {
          week_index: week,
          day_index: dayIndex,
          day_name: dayOfWeek,
          order_in_day: 1,
          date_key: dateKey
        });
        allRuns.push(workout);
      }
      else if (weeklyTemplate) {
        // Default fill logic: inject rest days for beginner/intermediate tiers
        const weeklyMileage = milesPerWeek[week];

        let tier = "beginner";
        if (weeklyMileage > 60) tier = "advanced";
        else if (weeklyMileage > 35) tier = "intermediate";

        const isSunday = dayIndex === 0; // Sunday = 0

        // Beginner & Intermediate get Sunday rest
        if ((tier === "beginner" || tier === "intermediate") && isSunday) {
          const workout = createWorkout(
            nextRun,
            0,
            "Rest",
            null,
            "Rest day",
            trainingPhase,
            {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey
            }
          );

          allRuns.push(workout);
        } else {
          // Distribute mileage across 6 days if one rest day exists
          const divisor = (tier === "advanced") ? 7 : 6;
          const numMiles = Math.round(weeklyMileage / divisor) || 1;

          const workout = createWorkout(
            nextRun,
            numMiles,
            "Easy",
            null,
            "",
            trainingPhase,
            {
              week_index: week,
              day_index: dayIndex,
              day_name: dayOfWeek,
              order_in_day: 1,
              date_key: dateKey
            }
          );

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

  // Start at 55% instead of 60% for smoother ramp
  const startingMileage = Math.ceil(0.55 * maxMileage);

  // Dynamic taper length
  let taperWeeks;
  if (numOfWeeks <= 5) taperWeeks = 1;
  else if (numOfWeeks <= 8) taperWeeks = 2;
  else taperWeeks = 3;

  const buildWeeks = numOfWeeks - taperWeeks;
  const increaseRate = (maxMileage - startingMileage) / Math.max(buildWeeks - 1, 1);

  // ----- BUILD PHASE -----
  for (let i = 0; i < buildWeeks; i++) {
    let weeklyMileage = startingMileage + increaseRate * i;

    // Every 4th week is a slight deload (~10% drop)
    if ((i + 1) % 4 === 0) {
      weeklyMileage *= 0.9;
    }

    milesPerWeek.push(Math.ceil(weeklyMileage));
  }

  // Ensure we actually hit peak before taper
  milesPerWeek[buildWeeks - 1] = maxMileage;

  // ----- TAPER PHASE -----
  if (taperWeeks === 3) {
    milesPerWeek.push(Math.ceil(maxMileage * 0.85));
    milesPerWeek.push(Math.ceil(maxMileage * 0.65));
  } else if (taperWeeks === 2) {
    milesPerWeek.push(Math.ceil(maxMileage * 0.75));
  }

  // Final race week (~40% but capped at 10 for half/short races)
  milesPerWeek.push(Math.min(Math.ceil(maxMileage * 0.4), 10));

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
    // For now, workoutType doubles as intensity until structured workouts are wired in.
    const recommended = getRecommendedPace(
      workoutType,
      globalGoalPace,
      trainingPhase
    );
    pace = recommended.pace;
    pace_decimal = recommended.pace_decimal;
    if (eventNote && eventNote.length > 0) {
      eventNote += " | ";
    }
    eventNote += `Recommended pace: ${pace} per mile${workoutType === "Long" ? " (average)" : ""}`;
    // Insert Long Run Type and Effort (RPE) guidance for Long runs
    if (workoutType === "Long" && !meta.structuredLong) {
      const profile = getLongRunProfile(trainingPhase);
      if (profile) {
        eventNote = (eventNote ? eventNote + " | " : "") +
          `Long Run Type: ${profile.label}`;
        eventNote = (eventNote ? eventNote + " | " : "") +
          `Effort: ${profile.effort}`;
      }
      // Keep existing finish-fast notes as-is
      if (trainingPhase === "build") {
        eventNote = (eventNote ? eventNote + " | " : "") +
          "Finish last 20–30% at steady / moderate effort";
      } else if (trainingPhase === "peak") {
        eventNote = (eventNote ? eventNote + " | " : "") +
          "Finish last 20–30% at race-specific pace";
      }
    }
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