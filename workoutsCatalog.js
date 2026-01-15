/**
 * workoutsCatalog.js
 *
 * Single source of truth for workout TYPES (not week-by-week instances).
 * Used by:
 *  - Advanced configuration modal (drag & drop)
 *  - Training plan generator (scheduling + scaling)
 */

// ---------------------------------------------------------------------------
// Types (JSDoc for editor + future TypeScript migration)
// ---------------------------------------------------------------------------

/** @typedef {"Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat"|"Sun"} Weekday */
/** @typedef {"beginner"|"intermediate"|"advanced"} RunnerLevel */
/** @typedef {"base"|"build"|"peak"|"taper"} TrainingPhase */

/**
 * @typedef {Object} WorkoutPlacementRules
 * @property {Weekday[]=} dayPreference
 * @property {number=} minWeeksBetween
 * @property {{base?: boolean, build?: boolean, peak?: boolean, taper?: boolean}=} phaseAllowed
 */

/**
 * @typedef {Object} WorkoutVariantRecipe
 * @property {string} label
 * @property {number[]=} minutes
 * @property {number[]=} reps
 * @property {number[]=} repMinutes
 * @property {string[]=} notes
 * @property {boolean=} includeWarmupCooldown
 * @property {0|1|2|3=} intensity
 */

/**
 * @typedef {Object} WorkoutType
 * @property {string} id
 * @property {string} name
 * @property {"easy"|"quality"|"long"|"strength"|"mobility"} category
 * @property {0|1|2|3} intensity
 * @property {number} orderWeight
 * @property {WorkoutPlacementRules} placement
 * @property {{beginner: WorkoutVariantRecipe, intermediate: WorkoutVariantRecipe, advanced: WorkoutVariantRecipe}} variantsByLevel
 */

// ---------------------------------------------------------------------------
// Scheduling helpers (THIS fixes Tue/Wed → Tue/Thu)
// ---------------------------------------------------------------------------

/**
 * Preferred quality workout days.
 * Use this instead of hardcoding Tue/Wed.
 */
export function getQualityDays(level) {
  if (level === "intermediate" || level === "advanced") {
    return {
      qualityDays: ["Tue", "Thu"],
      longRunDay: "Sun",
      mediumLongDay: "Sat"
    };
  }

  return {
    qualityDays: ["Tue", "Thu"],
    longRunDay: "Sun"
  };
}

/**
 * Guardrail: prevent consecutive hard days (intensity >= 2)
 */
export function isBackToBackHardDays(prevWorkout, nextWorkout) {
  if (!prevWorkout || !nextWorkout) return false;
  return prevWorkout.intensity >= 2 && nextWorkout.intensity >= 2;
}

/**
 * Map week index → training phase
 */
export function inferPhase(weekIndex, totalWeeks) {
  const pct = (weekIndex + 1) / totalWeeks;
  if (pct <= 0.4) return "base";
  if (pct <= 0.7) return "build";
  if (pct <= 0.9) return "peak";
  return "taper";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function pickByProgress(arr, weekIndex, totalWeeks) {
  if (!arr || arr.length === 0) return undefined;
  const pct = (weekIndex + 1) / totalWeeks;
  const idx = Math.min(arr.length - 1, Math.floor(pct * arr.length));
  return arr[idx];
}

// ---------------------------------------------------------------------------
// Create a concrete workout instance (generator-facing)
// ---------------------------------------------------------------------------

export function createWorkoutInstance(workoutType, ctx) {
  const { level, weekIndex, totalWeeks } = ctx;
  const recipe = workoutType.variantsByLevel[level];

  const minutes = pickByProgress(recipe.minutes, weekIndex, totalWeeks);
  const reps = pickByProgress(recipe.reps, weekIndex, totalWeeks);
  const repMinutes = pickByProgress(recipe.repMinutes, weekIndex, totalWeeks);
  const note = pickByProgress(recipe.notes, weekIndex, totalWeeks);

  let description = workoutType.name;

  switch (workoutType.id) {
    case "tempo":
      description = minutes ? `Tempo ${minutes} min (comfortably hard)` : "Tempo run";
      break;
    case "intervals":
      description =
        reps && repMinutes
          ? `${reps} x ${repMinutes} min hard (jog recoveries)`
          : "Interval session";
      break;
    case "progression":
      description = minutes ? `Progression ${minutes} min (finish fast)` : "Progression run";
      break;
    case "hills":
      description = reps ? `${reps} x short hill reps` : "Hill repeats";
      break;
    case "long_run":
      description = "Long run (easy to steady)";
      break;
    case "easy":
      description = "Easy run";
      break;
    case "rest":
      description = "Rest day";
      break;
  }

  const notes = [recipe.includeWarmupCooldown ? "WU + CD included" : null, note]
    .filter(Boolean)
    .join(". ");

  return {
    title: workoutType.name,
    category: workoutType.category,
    intensity: recipe.intensity ?? workoutType.intensity,
    description,
    notes
  };
}

// ---------------------------------------------------------------------------
// Workout catalog (INITIAL SET)
// ---------------------------------------------------------------------------

/** @type {WorkoutType[]} */
export const WORKOUT_CATALOG = [
  {
    id: "rest",
    name: "Rest",
    category: "mobility",
    intensity: 0,
    orderWeight: 0,
    placement: { dayPreference: ["Mon", "Fri"] },
    variantsByLevel: {
      beginner: { label: "Rest", notes: ["Take the day off"] },
      intermediate: { label: "Rest", notes: ["Optional mobility"] },
      advanced: { label: "Rest", notes: ["Optional mobility"] }
    }
  },
  {
    id: "easy",
    name: "Easy Run",
    category: "easy",
    intensity: 1,
    orderWeight: 10,
    placement: { dayPreference: ["Mon", "Wed", "Fri", "Sat"] },
    variantsByLevel: {
      beginner: { label: "Easy", minutes: [20, 25, 30], notes: ["Keep it easy"] },
      intermediate: { label: "Easy", minutes: [30, 40, 45], notes: ["Conversational pace"] },
      advanced: { label: "Easy", minutes: [40, 50, 60], notes: ["Relaxed aerobic"] }
    }
  },
  {
    id: "tempo",
    name: "Tempo Run",
    category: "quality",
    intensity: 2,
    orderWeight: 60,
    placement: { dayPreference: ["Tue", "Thu"] },
    variantsByLevel: {
      beginner: { label: "Tempo", minutes: [10, 15, 20], includeWarmupCooldown: true },
      intermediate: { label: "Tempo", minutes: [20, 25, 30], includeWarmupCooldown: true },
      advanced: { label: "Tempo", minutes: [25, 30, 40], includeWarmupCooldown: true }
    }
  },
  {
    id: "intervals",
    name: "Intervals",
    category: "quality",
    intensity: 3,
    orderWeight: 80,
    placement: { dayPreference: ["Tue", "Thu"] },
    variantsByLevel: {
      beginner: { label: "Intervals", reps: [4, 5], repMinutes: [1, 2], includeWarmupCooldown: true },
      intermediate: { label: "Intervals", reps: [5, 6], repMinutes: [2, 3], includeWarmupCooldown: true },
      advanced: { label: "Intervals", reps: [6, 8], repMinutes: [3, 4], includeWarmupCooldown: true }
    }
  },
  {
    id: "progression",
    name: "Progression Run",
    category: "quality",
    intensity: 2,
    orderWeight: 55,
    placement: { dayPreference: ["Thu", "Sat"] },
    variantsByLevel: {
      beginner: { label: "Progression", minutes: [20, 25, 30] },
      intermediate: { label: "Progression", minutes: [30, 40, 45] },
      advanced: { label: "Progression", minutes: [40, 50, 60] }
    }
  },
  {
    id: "long_run",
    name: "Long Run",
    category: "long",
    intensity: 1,
    orderWeight: 70,
    placement: { dayPreference: ["Sun"] },
    variantsByLevel: {
      beginner: { label: "Long", notes: ["Easy effort"] },
      intermediate: { label: "Long", notes: ["Fuel & hydrate"] },
      advanced: { label: "Long", notes: ["Mostly easy"] }
    }
  }
];

// ---------------------------------------------------------------------------
// Defaults for Advanced Configuration UI
// ---------------------------------------------------------------------------

export const DEFAULT_WORKOUT_SELECTION_BY_LEVEL = {
  beginner: ["tempo", "long_run"],
  intermediate: ["tempo", "intervals", "progression", "long_run"],
  advanced: ["tempo", "intervals", "progression", "long_run"]
};

export function getWorkoutTypeById(id) {
  return WORKOUT_CATALOG.find((w) => w.id === id);
}