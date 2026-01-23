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
 * @property {number[]=} totalMinutes  // optional: total session duration (including WU/CD if applicable)
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

/**
 * @typedef {Object} WorkoutInstance
 * @property {string} title
 * @property {string} titleDetail
 * @property {"easy"|"quality"|"long"|"strength"|"mobility"} category
 * @property {0|1|2|3} intensity
 * @property {string} description
 * @property {string} notes
 * @property {number=} estimatedMinutesTotal
 * @property {number=} estimatedMiles
 */

/**
 * @typedef {Object} WorkoutInstanceContext
 * @property {RunnerLevel} level
 * @property {number} weekIndex
 * @property {number} totalWeeks
 * @property {{ easy?: number, long?: number, tempo?: number, speed?: number }=} pacesMinPerMile
 */

export function createWorkoutInstance(/** @type {WorkoutType} */ workoutType, /** @type {WorkoutInstanceContext} */ ctx) {
    const { level, weekIndex, totalWeeks } = ctx;
    const recipe = workoutType.variantsByLevel[level];

    function estimateTotalMinutes(fallbackText) {
        const totalM = pickByProgress(recipe.totalMinutes, weekIndex, totalWeeks);
        if (typeof totalM === "number" && Number.isFinite(totalM)) return totalM;

        const mainM = pickByProgress(recipe.minutes, weekIndex, totalWeeks);
        if (typeof mainM === "number" && Number.isFinite(mainM)) {
            const wuCd = recipe.includeWarmupCooldown ? 20 : 0;
            return mainM + wuCd;
        }

        // Fallback: parse "35 min" or "10–15 min" from generated text.
        if (!fallbackText) return undefined;
        const s = String(fallbackText);

        // Prefer ranges like 10–15 min (take midpoint)
        const mRange = s.match(/(\d{1,3})\s*(?:–|-|—)\s*(\d{1,3})\s*min/i);
        if (mRange) {
            const a = Number(mRange[1]);
            const b = Number(mRange[2]);
            if (Number.isFinite(a) && Number.isFinite(b)) {
                return Math.round(((a + b) / 2) * 10) / 10;
            }
        }

        // Otherwise first single "NN min"
        const mSingle = s.match(/(\d{1,3})\s*min/i);
        if (mSingle) {
            const n = Number(mSingle[1]);
            if (Number.isFinite(n)) return n;
        }

        return undefined;
    }

    function paceForWorkoutType() {
        const p = ctx.pacesMinPerMile || {};
        // Default pace mapping by workout id/category.
        if (workoutType.id === "tempo" || workoutType.id === "progression") return p.tempo ?? p.easy;
        if (workoutType.id === "intervals" || workoutType.id === "hills") return p.speed ?? p.tempo ?? p.easy;
        if (workoutType.id === "long_run") return p.long ?? p.easy;
        if (workoutType.id === "easy") return p.easy;
        return p.easy;
    }

    // --- Distance parsing for track-style prescriptions ---
    const METERS_PER_MILE = 1609.34;

    function metersToMiles(m) {
        return m / METERS_PER_MILE;
    }

    function kmToMiles(km) {
        return km * 0.621371;
    }

    // Parse common distance patterns from session text.
    // Returns miles for the MAIN SET only (not including WU/CD unless we add it separately).
    function parseMainSetMilesFromText(text) {
        if (!text) return undefined;
        const s = String(text);

        // Ladder: 400/800/1200/800/400 (assume meters)
        // Example: "Ladder: 400/800/1200/800/400 @ ..."
        const ladder = s.match(/Ladder\s*:\s*([0-9\s\/]+)\s*/i);
        if (ladder && ladder[1]) {
            const parts = ladder[1]
                .split('/')
                .map(p => Number(String(p).trim()))
                .filter(n => Number.isFinite(n) && n > 0);
            if (parts.length) {
                const totalMeters = parts.reduce((a, b) => a + b, 0);
                return metersToMiles(totalMeters);
            }
        }

        // Repeats: "6 x 400m" or "6x400m"
        let m = s.match(/(\d+)\s*x\s*(\d+)\s*m\b/i);
        if (m) {
            const reps = Number(m[1]);
            const meters = Number(m[2]);
            if (Number.isFinite(reps) && Number.isFinite(meters)) {
                return metersToMiles(reps * meters);
            }
        }

        // Repeats in km: "5 x 1km" or "5 x 2 km"
        m = s.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*km\b/i);
        if (m) {
            const reps = Number(m[1]);
            const km = Number(m[2]);
            if (Number.isFinite(reps) && Number.isFinite(km)) {
                return kmToMiles(reps * km);
            }
        }

        // Repeats in miles: "3 x 1 mi" or "4 x 0.5mi"
        m = s.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*mi\b/i);
        if (m) {
            const reps = Number(m[1]);
            const mi = Number(m[2]);
            if (Number.isFinite(reps) && Number.isFinite(mi)) {
                return reps * mi;
            }
        }

        // Single distance mention like "10K" or "5k" is too ambiguous here; skip.
        return undefined;
    }

    // Parse explicit WU/CD minutes if present (e.g., "WU 12–15 / CD 10" or "WU 10 / CD 10").
    function parseWarmupCooldownMinutes(text) {
        if (!text) return undefined;
        const s = String(text);

        // Capture WU range or single
        const wuRange = s.match(/WU\s*(\d{1,3})\s*(?:–|-|—)\s*(\d{1,3})/i);
        const wuSingle = s.match(/WU\s*(\d{1,3})\b/i);

        // Capture CD range or single
        const cdRange = s.match(/CD\s*(\d{1,3})\s*(?:–|-|—)\s*(\d{1,3})/i);
        const cdSingle = s.match(/CD\s*(\d{1,3})\b/i);

        let wu = undefined;
        let cd = undefined;

        if (wuRange) {
            const a = Number(wuRange[1]);
            const b = Number(wuRange[2]);
            if (Number.isFinite(a) && Number.isFinite(b)) wu = (a + b) / 2;
        } else if (wuSingle) {
            const a = Number(wuSingle[1]);
            if (Number.isFinite(a)) wu = a;
        }

        if (cdRange) {
            const a = Number(cdRange[1]);
            const b = Number(cdRange[2]);
            if (Number.isFinite(a) && Number.isFinite(b)) cd = (a + b) / 2;
        } else if (cdSingle) {
            const a = Number(cdSingle[1]);
            if (Number.isFinite(a)) cd = a;
        }

        if (wu == null && cd == null) return undefined;
        return { wuMinutes: wu, cdMinutes: cd };
    }

    function estimateWarmupCooldownMilesFromText(text) {
        const p = ctx.pacesMinPerMile || {};
        const easyPace = p.easy;
        if (typeof easyPace !== 'number' || !Number.isFinite(easyPace) || easyPace <= 0) return 0;

        const parsed = parseWarmupCooldownMinutes(text);
        if (parsed) {
            const wu = (typeof parsed.wuMinutes === 'number' && Number.isFinite(parsed.wuMinutes)) ? parsed.wuMinutes : 0;
            const cd = (typeof parsed.cdMinutes === 'number' && Number.isFinite(parsed.cdMinutes)) ? parsed.cdMinutes : 0;
            return (wu + cd) / easyPace;
        }

        // Fallback default if recipe says WU/CD included.
        if (recipe.includeWarmupCooldown) {
            return 20 / easyPace; // 10 WU + 10 CD
        }

        return 0;
    }

    function estimateMiles(totalMinutes) {
        // Prefer distance-based estimation when the workout prescription includes explicit distances (e.g., 6 x 400m).
        const mainSetMiles = parseMainSetMilesFromText(estimationText);
        if (typeof mainSetMiles === 'number' && Number.isFinite(mainSetMiles) && mainSetMiles > 0) {
            const wuCdMiles = estimateWarmupCooldownMilesFromText(estimationText);
            const miles = mainSetMiles + wuCdMiles;
            return Math.round(miles * 10) / 10;
        }

        // Fallback: time-based estimation
        const pace = paceForWorkoutType();
        if (typeof totalMinutes !== "number" || !Number.isFinite(totalMinutes)) return undefined;
        if (typeof pace !== "number" || !Number.isFinite(pace) || pace <= 0) return undefined;
        const miles = totalMinutes / pace;
        return Math.round(miles * 10) / 10;
    }

    const minutes = pickByProgress(recipe.minutes, weekIndex, totalWeeks);
    const reps = pickByProgress(recipe.reps, weekIndex, totalWeeks);
    const repMinutes = pickByProgress(recipe.repMinutes, weekIndex, totalWeeks);
    const session = pickByProgress(recipe.sessions, weekIndex, totalWeeks);
    const note = pickByProgress(recipe.notes, weekIndex, totalWeeks);

    let description = workoutType.name;

    // const wuCdText = recipe.includeWarmupCooldown
    //     ? "Warm-up 10–15 min easy + drills/strides; Cool-down 10 min easy"
    //     : "";

    // Create a short title detail for calendar tiles (keeps the name clean but adds the workout prescription)
    function toTitleDetail(s) {
        if (!s) return "";
        return String(s)
            .replace(/\(WU\s*[^)]*\)/gi, "")
            .replace(/\(WU\/CD\)/gi, "")
            .replace(/WU\s*\d+[^)]*\/?\s*CD\s*\d+[^)]*/gi, "")
            .trim();
    }

    // If a session string includes recoveries/rest, keep it; otherwise we’ll add generic recovery guidance in notes.
    function sessionHasRecovery(s) {
        if (!s) return false;
        return /(w\/|recovery|recoveries|rest|jog|walk down)/i.test(String(s));
    }

    // Format the free-text session/description into a more “workout card” style prescription.
    // This improves UX without changing the underlying catalog data.
    function formatWorkoutPrescription(mainText) {
        const lines = [];

        // Warm-up / Cool-down: prefer explicit tokens in the text; otherwise use the generic WU/CD hint.
        const text = String(mainText || '').trim();

        // Strip common WU/CD parentheticals for the main set display.
        const mainSet = String(text)
            .replace(/\(WU\s*[^)]*\)/gi, '')
            .replace(/\(WU\/CD\)/gi, '')
            .replace(/\(WU\s*\d+\s*(?:–|-|—)?\s*\d*\s*\/?\s*CD\s*\d+[^)]*\)/gi, '')
            .trim();

        // Warm-up line
        if (recipe.includeWarmupCooldown) {
            // If the session already specifies WU/CD times, keep the generic template but it’s still useful.
            lines.push(`Warm-up: 10–15 min easy + drills/strides`);
        }

        // Main set label based on workout type
        const prefix = (() => {
            if (workoutType.id === 'tempo') return 'Main set (Tempo)';
            if (workoutType.id === 'intervals') return 'Main set (Intervals)';
            if (workoutType.id === 'hills') return 'Main set (Hills)';
            if (workoutType.id === 'progression') return 'Main set (Progression)';
            if (workoutType.id === 'long_run') return 'Main set (Long)';
            if (workoutType.id === 'easy') return 'Easy run';
            return 'Main set';
        })();

        // For readability, remove leading labels like "Track:" / "VO2:" / "Tempo:" from the start of the line.
        const cleaned = mainSet
            .replace(/^(Track|VO2|Intervals|Hills|Tempo|Cruise|Progression|Ladder)\s*:\s*/i, '')
            .trim();

        if (cleaned) {
            lines.push(`${prefix}: ${cleaned}`);
        }

        // Recovery guidance (only if the session doesn’t already include recovery text)
        if (workoutType.category === 'quality' && !sessionHasRecovery(text)) {
            lines.push('Recovery: jog easy between reps; keep recoveries truly easy.');
        }

        // Fueling guidance for long runs
        if (workoutType.id === 'long_run') {
            lines.push('Fueling: bring water; consider carbs every 30–40 min on longer runs.');
        }

        // Cool-down line
        if (recipe.includeWarmupCooldown) {
            lines.push('Cool-down: 10 min easy jog');
        }

        return {
            mainSetText: cleaned || mainSet,
            lines
        };
    }

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
            description = session
                ? session
                : (minutes ? `Progression ${minutes} min (finish steady)` : "Progression run");
            break;
        case "hills":
            description = session
                ? session
                : (reps ? `${reps} x short hill reps` : "Hill repeats");
            break;
        case "long_run":
            description = session
                ? session
                : "Long run (easy to steady)";
            break;
        case "easy":
            description = "Easy run";
            break;
        case "rest":
            description = "Rest day";
            break;
    }

    // Build a structured prescription-style notes field.
    const pres = formatWorkoutPrescription(description);

    // Preserve any authored notes from the catalog (these are usually coaching cues).
    const coachingCues = [note].filter(Boolean);

    // Notes: structured prescription + coaching cues (multi-line so it reads like a real workout).
    const notes = [...pres.lines, ...coachingCues]
        .filter(Boolean)
        .join("\n");

    const estimationText = [pres.mainSetText, description, session, notes]
        .filter(Boolean)
        .join(' | ');

    const estimatedMinutesTotal = estimateTotalMinutes(estimationText);
    const estimatedMiles = estimateMiles(estimatedMinutesTotal);

    return {
        title: workoutType.name,
        // UI can show: `${title} — ${titleDetail}`
        titleDetail: toTitleDetail(pres.mainSetText || description),
        category: workoutType.category,
        intensity: recipe.intensity ?? workoutType.intensity,
        description,
        notes,
        estimatedMinutesTotal,
        estimatedMiles
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
            beginner: {
                label: "Progression",
                sessions: [
                    "Progression: 20 min easy → last 5 min steady",
                    "Progression: 25 min easy → last 8 min steady",
                    "Progression: 30 min easy → last 10 min steady"
                ],
                notes: ["Start relaxed; finish controlled (no sprinting)."],
                includeWarmupCooldown: false
            },
            intermediate: {
                label: "Progression",
                sessions: [
                    "Progression: 35 min easy → last 10 min steady",
                    "Progression: 40 min easy → last 12 min steady",
                    "Progression: 45 min easy → last 15 min steady (near tempo)"
                ],
                notes: ["Smooth build—aim for a strong, aerobic finish."],
                includeWarmupCooldown: false
            },
            advanced: {
                label: "Progression",
                sessions: [
                    "Progression: 45 min easy → last 15 min steady",
                    "Progression: 50 min easy → last 15 min steady (near tempo)",
                    "Progression: 60 min easy → last 20 min steady"
                ],
                notes: ["Finish strong but controlled; keep form tall."],
                includeWarmupCooldown: false
            }
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
            beginner: {
                label: "Long",
                sessions: [
                    "Long run: easy effort (conversational)",
                    "Long run: easy effort + 5 min steady finish",
                    "Long run: easy effort (stay relaxed)"
                ],
                notes: ["Keep it easy; walk breaks are fine."],
                includeWarmupCooldown: false
            },
            intermediate: {
                label: "Long",
                sessions: [
                    "Long run: easy effort (conversational)",
                    "Long run: easy → last 10–15 min steady",
                    "Long run: easy effort (practice fueling)"
                ],
                notes: ["Fuel & hydrate; keep most of it easy."],
                includeWarmupCooldown: false
            },
            advanced: {
                label: "Long",
                sessions: [
                    "Long run: easy effort (conversational)",
                    "Long run: easy → last 20 min steady",
                    "Long run: easy effort w/ steady finish (practice fueling)"
                ],
                notes: ["Mostly easy; steady finish occasionally."],
                includeWarmupCooldown: false
            }
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

/**
 * Convenience helper for UI:
 * Given a workoutTypeId and context, returns a WorkoutInstance with estimatedMiles.
 */
export function createWorkoutInstanceById(workoutTypeId, ctx) {
    const wt = getWorkoutTypeById(workoutTypeId);
    if (!wt) return null;
    return createWorkoutInstance(wt, ctx);
}