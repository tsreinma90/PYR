export const TEMPLATES = {
  half: {
    16: {
      weeks: [
        // ----- BASE (Weeks 1–4) -----
        {
          week: 1,
          phase: "base",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 2,
          phase: "base",
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
        {
          week: 3,
          phase: "base",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_RACE_SPECIFIC" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 4,
          phase: "base",
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

        // ----- BUILD (Weeks 5–10) -----
        {
          week: 5,
          phase: "build",
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
        {
          week: 6,
          phase: "build",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_RACE_SPECIFIC" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 7,
          phase: "build",
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
        {
          week: 8,
          phase: "build",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_SHARPENING" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 9,
          phase: "build",
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
        {
          week: 10,
          phase: "build",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
            Sunday:    { type: "Easy" }
          }
        },

        // ----- PEAK (Weeks 11–14) -----
        {
          week: 11,
          phase: "peak",
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
        {
          week: 12,
          phase: "peak",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 13,
          phase: "peak",
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
        {
          week: 14,
          phase: "peak",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
            Sunday:    { type: "Easy" }
          }
        },

        // ----- TAPER (Weeks 15–16) -----
        {
          week: 15,
          phase: "taper",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { id: "LONG_RUN_PROGRESSIVE" },
            Sunday:    { type: "Easy" }
          }
        },
        {
          week: 16,
          phase: "taper",
          workouts: {
            Monday:    { type: "Easy" },
            Tuesday:   { id: "THRESHOLD_MILE_REPEATS" },
            Wednesday: { type: "Easy" },
            Thursday:  { type: "Easy" },
            Friday:    { type: "Rest" },
            Saturday:  { type: "Rest" },
            Sunday:    { type: "Race" }
          }
        }
      ]
    }
  }
};