export const TEMPLATES = {
  "half-marathon": {
    structure: {
      base: {
        workouts: {
          Monday:    { type: "Easy" },
          Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
          Wednesday: { type: "Easy" },
          Thursday:  { id: "VO2_800_REPEATS" },
          Friday:    { type: "Rest" },
          Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
          Sunday:    { type: "Easy" }
        }
      },

      build: {
        workouts: {
          Monday:    { type: "Easy" },
          Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
          Wednesday: { type: "Easy" },
          Thursday:  { id: "VO2_800_REPEATS" },
          Friday:    { type: "Rest" },
          Saturday:  { id: "LONG_RUN_RACE_SPECIFIC" },
          Sunday:    { type: "Easy" }
        }
      },

      peak: {
        workouts: {
          Monday:    { type: "Easy" },
          Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
          Wednesday: { type: "Easy" },
          Thursday:  { id: "VO2_800_REPEATS" },
          Friday:    { type: "Rest" },
          Saturday:  { id: "LONG_RUN_RACE_SPECIFIC" },
          Sunday:    { type: "Easy" }
        }
      },

      taper: {
        workouts: {
          Monday:    { type: "Easy" },
          Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
          Wednesday: { type: "Easy" },
          Thursday:  { type: "Easy" },
          Friday:    { type: "Rest" },
          Saturday:  { id: "LONG_RUN_SHARPENING" },
          Sunday:    { type: "Easy" }
        }
      }
    }
  }
};