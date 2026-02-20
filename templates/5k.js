export const TEMPLATES = {
  "5k": {
    structure: {
      base: {
        workouts: {
          Tuesday: { id: "THRESHOLD_MILE_REPEATS" },
          Thursday: { id: "VO2_800_REPEATS" },
          Saturday: { id: "LONG_RUN_PROGRESSIVE" }
        }
      },

      build: {
        workouts: {
          Tuesday: { id: "VO2_800_REPEATS" },
          Thursday: { id: "THRESHOLD_MILE_REPEATS" },
          Saturday: { id: "LONG_RUN_PROGRESSIVE" }
        }
      },

      peak: {
        workouts: {
          Tuesday: { id: "VO2_800_REPEATS" },
          Thursday: { id: "THRESHOLD_MILE_REPEATS" },
          Saturday: { id: "LONG_RUN_RACE_SPECIFIC" }
        }
      },

      taper: {
        workouts: {
          Tuesday: { id: "THRESHOLD_MILE_REPEATS" },
          Thursday: { id: "VO2_800_REPEATS" },
          Saturday: { id: "LONG_RUN_SHARPENING" }
        }
      }
    }
  }
};