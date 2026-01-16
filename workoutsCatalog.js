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
 * @property {string[]=} sessions
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
    const session = pickByProgress(recipe.sessions, weekIndex, totalWeeks);
    const note = pickByProgress(recipe.notes, weekIndex, totalWeeks);

    let description = workoutType.name;

    const wuCdText = recipe.includeWarmupCooldown
        ? "Warm-up 10–15 min easy + drills/strides; Cool-down 10 min easy"
        : "";

    switch (workoutType.id) {
        case "tempo":
            description = session
                ? session
                : (minutes ? `Tempo ${minutes} min (comfortably hard)` : "Tempo run");
            break;
        case "intervals":
            description = session
                ? session
                : (reps && repMinutes
                    ? `${reps} x ${repMinutes} min hard w/ equal easy jog recoveries`
                    : "Intervals: hard reps w/ jog recoveries");
            break;
        case "progression":
            description = minutes ? `Progression ${minutes} min (finish fast)` : "Progression run";
            break;
        case "hills":
            description = session
                ? session
                : (reps ? `${reps} x short hill reps` : "Hill repeats");
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

    const notes = [wuCdText, note]
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
            beginner: {
                label: "Tempo",
                sessions: [
                    "Tempo: 10 min comfortably hard (WU 10 / CD 10)",
                    "Tempo: 2 x 8 min comfortably hard, 2 min easy (WU/CD)",
                    "Tempo: 15 min comfortably hard (WU/CD)",
                    "Tempo: 3 x 6 min comfortably hard, 2 min easy (WU/CD)",
                    "Tempo: 20 min comfortably hard (WU/CD)"
                ],
                notes: ["Stay controlled; finish feeling strong."],
                includeWarmupCooldown: true
            },
            intermediate: {
                label: "Tempo",
                sessions: [
                    "Tempo: 20 min @ LT effort (WU 12–15 / CD 10)",
                    "Cruise: 3 x 8 min @ LT, 2 min easy (WU/CD)",
                    "Tempo: 25 min @ LT effort (WU/CD)",
                    "Cruise: 4 x 6 min @ LT, 90s easy (WU/CD)",
                    "Tempo: 30 min @ LT effort (WU/CD)"
                ],
                notes: ["Think comfortably hard—no straining."],
                includeWarmupCooldown: true
            },
            advanced: {
                label: "Tempo",
                sessions: [
                    "Tempo: 25 min @ LT effort (WU 15 / CD 10)",
                    "Cruise: 5 x 6 min @ LT, 60–90s easy (WU/CD)",
                    "Tempo: 30 min @ LT effort (WU/CD)",
                    "Cruise: 3 x 10 min @ LT, 2 min easy (WU/CD)",
                    "Tempo: 40 min @ strong LT effort (WU/CD)"
                ],
                notes: ["Relax shoulders, quick cadence."],
                includeWarmupCooldown: true
            }
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
            beginner: {
                label: "Intervals",
                sessions: [
                    "Intervals: 6 x 1 min hard, 2 min easy (WU/CD)",
                    "Intervals: 8 x 1 min hard, 90s easy (WU/CD)",
                    "Intervals: 5 x 2 min hard, 2 min easy (WU/CD)",
                    "Intervals: 6 x 2 min hard, 2 min easy (WU/CD)",
                    "Intervals: 4 x 3 min hard, 2–3 min easy (WU/CD)"
                ],
                notes: ["Hard but repeatable effort."],
                includeWarmupCooldown: true
            },
            intermediate: {
                label: "Intervals",
                sessions: [
                    "Track: 6 x 400m @ 5K pace w/ 90s jog (WU/CD)",
                    "Track: 8 x 400m @ 5K pace w/ 75–90s jog (WU/CD)",
                    "Track: 5 x 800m @ 10K pace w/ 2:00 jog (WU/CD)",
                    "Track: 6 x 800m @ 10K pace w/ 2:00 jog (WU/CD)",
                    "VO2: 5 x 3 min hard w/ 2 min easy jog (WU/CD)"
                ],
                notes: ["Even splits, smooth form."],
                includeWarmupCooldown: true
            },
            advanced: {
                label: "Intervals",
                sessions: [
                    "Track: 10 x 400m @ 5K pace w/ 60–75s jog (WU/CD)",
                    "Track: 8 x 600m @ 5K–10K pace w/ 90s jog (WU/CD)",
                    "Track: 6 x 800m @ 10K pace w/ 90–120s jog (WU/CD)",
                    "VO2: 6 x 3 min hard w/ 2 min easy jog (WU/CD)",
                    "Ladder: 400/800/1200/800/400 @ 5K–10K effort w/ 2 min jog (WU/CD)"
                ],
                notes: ["Fast but controlled—stop before form fades."],
                includeWarmupCooldown: true
            }
        }
    },
    {
        id: "hills",
        name: "Hill Repeats",
        category: "quality",
        intensity: 2,
        orderWeight: 65,
        placement: { dayPreference: ["Tue", "Thu"] },
        variantsByLevel: {
            beginner: {
                label: "Hills",
                sessions: [
                    "Hills: 6 x 30s uphill strong, jog/walk down recovery (WU/CD)",
                    "Hills: 8 x 30s uphill strong, jog/walk down recovery (WU/CD)",
                    "Hills: 6 x 45s uphill strong, jog/walk down recovery (WU/CD)",
                    "Hills: 8 x 45s uphill strong, jog/walk down recovery (WU/CD)",
                    "Hills: 10 x 30s uphill strong, jog/walk down recovery (WU/CD)"
                ],
                notes: ["Focus on form, not speed."],
                includeWarmupCooldown: true
            },
            intermediate: {
                label: "Hills",
                sessions: [
                    "Hills: 10 x 45s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 8 x 60s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 12 x 30s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 6 x 90s uphill strong, jog down recovery (WU/CD)",
                    "Hills: 10 x 60s uphill hard, jog down recovery (WU/CD)"
                ],
                notes: ["Drive knees, quick cadence."],
                includeWarmupCooldown: true
            },
            advanced: {
                label: "Hills",
                sessions: [
                    "Hills: 12 x 60s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 10 x 90s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 16 x 30s uphill hard, jog down recovery (WU/CD)",
                    "Hills: 8 x 2 min uphill strong, jog down recovery (WU/CD)",
                    "Hills: 10 x 60s uphill hard + 4 x 20s strides flat w/ full recovery (WU/CD)"
                ],
                notes: ["Explosive uphill, relaxed downhill."],
                includeWarmupCooldown: true
            }
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
    intermediate: ["tempo", "intervals", "hills", "progression", "long_run"],
    advanced: ["tempo", "intervals", "hills", "progression", "long_run"]
};

export function getWorkoutTypeById(id) {
    return WORKOUT_CATALOG.find((w) => w.id === id);
}