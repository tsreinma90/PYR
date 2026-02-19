export const WORKOUT_DICTIONARY = {

  // =========================
  // THRESHOLD WORKOUTS
  // =========================

  THRESHOLD_MILE_REPEATS: {
    category: "threshold",
    phases: ["build", "peak"],
    raceTypes: ["5k", "10k", "half", "marathon"],
    intensity: "threshold",

    warmup: { distance: 1.5, unit: "mile", intensity: "easy" },
    cooldown: { distance: 1, unit: "mile", intensity: "easy" },

    progression: [
      {
        level: 1,
        variants: {
          beginner: { reps: 3, distance: 1, unit: "mile", rest: { value: 120, unit: "sec" } },
          intermediate: { reps: 4, distance: 1, unit: "mile", rest: { value: 90, unit: "sec" } },
          advanced: { reps: 5, distance: 1, unit: "mile", rest: { value: 60, unit: "sec" } }
        }
      },
      {
        level: 2,
        variants: {
          beginner: { reps: 2, distance: 2, unit: "mile", rest: { value: 120, unit: "sec" } },
          intermediate: { reps: 3, distance: 2, unit: "mile", rest: { value: 90, unit: "sec" } },
          advanced: { reps: 3, distance: 2, unit: "mile", rest: { value: 60, unit: "sec" } }
        }
      }
    ]
  },

  // =========================
  // VO2 MAX WORKOUTS
  // =========================

  VO2_800_REPEATS: {
    category: "vo2",
    phases: ["build", "peak"],
    raceTypes: ["5k", "10k"],
    intensity: "vo2",

    warmup: { distance: 1.5, unit: "mile", intensity: "easy" },
    cooldown: { distance: 1, unit: "mile", intensity: "easy" },

    progression: [
      {
        level: 1,
        variants: {
          beginner: { reps: 4, distance: 800, unit: "meter", rest: { value: 2, unit: "min" } },
          intermediate: { reps: 5, distance: 800, unit: "meter", rest: { value: 2, unit: "min" } },
          advanced: { reps: 6, distance: 800, unit: "meter", rest: { value: 90, unit: "sec" } }
        }
      },
      {
        level: 2,
        variants: {
          beginner: { reps: 5, distance: 800, unit: "meter", rest: { value: 2, unit: "min" } },
          intermediate: { reps: 6, distance: 800, unit: "meter", rest: { value: 90, unit: "sec" } },
          advanced: { reps: 7, distance: 800, unit: "meter", rest: { value: 90, unit: "sec" } }
        }
      }
    ]
  },

  // =========================
  // HILL WORKOUTS
  // =========================

  HILL_60S_REPEATS: {
    category: "hills",
    phases: ["base", "build"],
    raceTypes: ["5k", "10k", "half", "marathon"],
    intensity: "hill",

    warmup: { distance: 1.5, unit: "mile", intensity: "easy" },
    cooldown: { distance: 1, unit: "mile", intensity: "easy" },

    progression: [
      {
        level: 1,
        variants: {
          beginner: { reps: 6, duration: 60, unit: "sec", rest: { value: 90, unit: "sec" } },
          intermediate: { reps: 8, duration: 60, unit: "sec", rest: { value: 90, unit: "sec" } },
          advanced: { reps: 10, duration: 60, unit: "sec", rest: { value: 60, unit: "sec" } }
        }
      },
      {
        level: 2,
        variants: {
          beginner: { reps: 8, duration: 60, unit: "sec", rest: { value: 90, unit: "sec" } },
          intermediate: { reps: 10, duration: 60, unit: "sec", rest: { value: 60, unit: "sec" } },
          advanced: { reps: 12, duration: 60, unit: "sec", rest: { value: 60, unit: "sec" } }
        }
      }
    ]
  },

  // =========================
  // STRIDES
  // =========================

  STRIDES_20S: {
    category: "strides",
    phases: ["base", "build", "peak"],
    raceTypes: ["5k", "10k", "half", "marathon"],
    intensity: "stride",

    warmup: null,
    cooldown: null,

    progression: [
      {
        level: 1,
        variants: {
          beginner: { reps: 6, duration: 20, unit: "sec", rest: { value: 60, unit: "sec" } },
          intermediate: { reps: 8, duration: 20, unit: "sec", rest: { value: 60, unit: "sec" } },
          advanced: { reps: 10, duration: 20, unit: "sec", rest: { value: 45, unit: "sec" } }
        }
      }
    ]
  },

  // =========================
  // LONG RUN PROGRESSIVE
  // =========================

  LONG_RUN_PROGRESSIVE: {
    category: "long_run",
    phases: ["build", "peak"],
    raceTypes: ["half", "marathon"],
    intensity: "progression",

    warmup: null,
    cooldown: null,

    progression: [
      {
        level: 1,
        variants: {
          beginner: { finishMilesAt: "steady", finishDistance: 2 },
          intermediate: { finishMilesAt: "marathon", finishDistance: 3 },
          advanced: { finishMilesAt: "marathon", finishDistance: 4 }
        }
      },
      {
        level: 2,
        variants: {
          beginner: { finishMilesAt: "marathon", finishDistance: 3 },
          intermediate: { finishMilesAt: "marathon", finishDistance: 5 },
          advanced: { finishMilesAt: "marathon", finishDistance: 6 }
        }
      }
    ]
  },

  // =========================
  // LONG RUN RACE SPECIFIC
  // =========================

  LONG_RUN_RACE_SPECIFIC: {
    category: "long_run",
    phases: ["peak"],
    raceTypes: ["half", "marathon"],
    intensity: "race_specific",

    warmup: null,
    cooldown: null,

    progression: [
      {
        level: 1,
        variants: {
          beginner: { racePaceSegments: [{ distance: 2, unit: "mile" }] },
          intermediate: { racePaceSegments: [{ distance: 3, unit: "mile" }, { distance: 2, unit: "mile" }] },
          advanced: { racePaceSegments: [{ distance: 4, unit: "mile" }, { distance: 3, unit: "mile" }] }
        }
      }
    ]
  },

  // =========================
  // LONG RUN SHARPENING
  // =========================

  LONG_RUN_SHARPENING: {
    category: "long_run",
    phases: ["taper"],
    raceTypes: ["half", "marathon"],
    intensity: "sharpening",

    warmup: null,
    cooldown: null,

    progression: [
      {
        level: 1,
        variants: {
          beginner: { pickups: { reps: 4, duration: 60, unit: "sec" } },
          intermediate: { pickups: { reps: 6, duration: 60, unit: "sec" } },
          advanced: { pickups: { reps: 8, duration: 60, unit: "sec" } }
        }
      }
    ]
  }

};