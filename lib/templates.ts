export type TemplateExercise = {
  name: string;
  target: string;
  how: string;
  type: "reps" | "seconds";
  sets: number;
};

export type TemplateDay = {
  id: string;
  shortName: string;
  name: string;
  exercises: TemplateExercise[];
};

export type WeekTemplate = {
  key: string;
  title: string;
  description: string;
  days: TemplateDay[];
};

export const WEEK_TEMPLATES: WeekTemplate[] = [
  {
    key: "foundation",
    title: "Foundation Push / Pull / Posterior",
    description:
      "Balanced push, pull, and posterior chain focus with RPE ~6. Ideal for easing into consistent training.",
    days: [
      {
        id: "day1",
        shortName: "Day 1",
        name: "Day 1 — Push + Row + Hamstrings",
        exercises: [
          {
            name: "Leg Press",
            sets: 2,
            target: "8–12 reps",
            how: "Feet shoulder-width; lower until knees ~90°; push through mid-foot.",
            type: "reps"
          },
          {
            name: "Chest-Supported Row",
            sets: 2,
            target: "8–12 reps",
            how: "Chest on pad/bench; pull to lower ribs; squeeze shoulder blades.",
            type: "reps"
          },
          {
            name: "Machine Chest Press",
            sets: 2,
            target: "8–12 reps",
            how: "Handles mid-chest; press smoothly; control the return.",
            type: "reps"
          },
          {
            name: "Seated Leg Curl",
            sets: 2,
            target: "10–15 reps",
            how: "Pad above heels; curl steadily; brief pause; slow back.",
            type: "reps"
          },
          {
            name: "Pallof Press (Cable)",
            sets: 2,
            target: "20–30 sec/side",
            how: "Cable chest-height; stand side-on; press arms out; resist twist.",
            type: "seconds"
          }
        ]
      },
      {
        id: "day2",
        shortName: "Day 2",
        name: "Day 2 — Pull + Squat Pattern + Calves",
        exercises: [
          {
            name: "Lat Pulldown",
            sets: 2,
            target: "8–12 reps",
            how: "Slight lean; pull bar to upper chest; elbows down; control up.",
            type: "reps"
          },
          {
            name: "Goblet Squat",
            sets: 2,
            target: "8–12 reps",
            how: "Hold weight at chest; sit between hips; stand tall.",
            type: "reps"
          },
          {
            name: "Seated Cable Row",
            sets: 2,
            target: "8–12 reps",
            how: "Neutral spine; pull to navel/low ribs; squeeze blades.",
            type: "reps"
          },
          {
            name: "Romanian Deadlift",
            sets: 2,
            target: "8–12 reps",
            how: "Soft knees; push hips back; flat back; stand tall.",
            type: "reps"
          },
          {
            name: "Calf Raise (Seated/Standing)",
            sets: 2,
            target: "12–15 reps",
            how: "Full heel drop; rise to toes; 1–2s pause.",
            type: "reps"
          }
        ]
      },
      {
        id: "day3",
        shortName: "Day 3",
        name: "Day 3 — Shoulders + Chest/Back + Posterior Chain",
        exercises: [
          {
            name: "Machine Shoulder Press (or DB Lateral Raise)",
            sets: 2,
            target: "8–12 reps",
            how: "Press without shrugging; smooth down. (Lateral raise: to shoulder height.)",
            type: "reps"
          },
          {
            name: "Leg Extension",
            sets: 2,
            target: "10–15 reps",
            how: "Pad on lower shin; extend smoothly; control down.",
            type: "reps"
          },
          {
            name: "Incline Dumbbell Press",
            sets: 2,
            target: "8–12 reps",
            how: "Bench 15–30°; elbows ~45°; press together; control.",
            type: "reps"
          },
          {
            name: "Back Extension",
            sets: 2,
            target: "10–12 reps",
            how: "Hinge at hips; neutral spine; squeeze glutes to rise.",
            type: "reps"
          },
          {
            name: "Farmer Carry",
            sets: 2,
            target: "30–40 sec",
            how: "Stand tall; ribs down; walk steadily without swaying.",
            type: "seconds"
          }
        ]
      }
    ]
  },
  {
    key: "athletic",
    title: "Athletic Builder",
    description:
      "Alternating upper/lower emphasis with core finishers. Slightly different moves to keep training fresh week to week.",
    days: [
      {
        id: "day1",
        shortName: "Day 1",
        name: "Day 1 — Lower Body + Core",
        exercises: [
          {
            name: "Hack Squat (Machine)",
            sets: 2,
            target: "8–10 reps",
            how: "Feet shoulder-width; keep heels heavy; control depth.",
            type: "reps"
          },
          {
            name: "Single-Leg Romanian Deadlift (DB)",
            sets: 2,
            target: "8–10 reps/side",
            how: "Soft knee; hinge from hips; keep hips square; stand tall.",
            type: "reps"
          },
          {
            name: "Leg Press Calf Raise",
            sets: 2,
            target: "12–15 reps",
            how: "Slow lower; squeeze at top; maintain control.",
            type: "reps"
          },
          {
            name: "Cable Chop",
            sets: 2,
            target: "20–25 sec/side",
            how: "Arms extended; rotate through torso; resist wobble.",
            type: "seconds"
          }
        ]
      },
      {
        id: "day2",
        shortName: "Day 2",
        name: "Day 2 — Upper Push + Pull",
        exercises: [
          {
            name: "Dumbbell Bench Press",
            sets: 2,
            target: "8–12 reps",
            how: "Feet planted; press evenly; pause briefly near chest.",
            type: "reps"
          },
          {
            name: "Half-Kneeling Single-Arm Pulldown",
            sets: 2,
            target: "8–12 reps/side",
            how: "Kneel tall; pull elbow to hip; keep ribs stacked.",
            type: "reps"
          },
          {
            name: "Machine Pec Fly or Cable Crossover",
            sets: 2,
            target: "10–15 reps",
            how: "Slight elbow bend; hug motion; slow return.",
            type: "reps"
          },
          {
            name: "Prone Rear Delt Raise",
            sets: 2,
            target: "12–15 reps",
            how: "Thumbs down; lift to shoulder height; squeeze shoulder blades.",
            type: "reps"
          },
          {
            name: "Dead Bug",
            sets: 2,
            target: "30–40 sec",
            how: "Lower opposite arm/leg; ribs down; breathe steadily.",
            type: "seconds"
          }
        ]
      },
      {
        id: "day3",
        shortName: "Day 3",
        name: "Day 3 — Posterior Chain + Conditioning",
        exercises: [
          {
            name: "Trap Bar Deadlift (Light)",
            sets: 2,
            target: "6–8 reps",
            how: "Hips back; chest proud; push floor away.",
            type: "reps"
          },
          {
            name: "Split Squat (Dumbbells)",
            sets: 2,
            target: "8–10 reps/side",
            how: "Front knee over mid-foot; drop back knee straight down; drive through front heel.",
            type: "reps"
          },
          {
            name: "Chest-Supported Dumbbell Row",
            sets: 2,
            target: "10–12 reps",
            how: "Squeeze shoulder blades; control lowering.",
            type: "reps"
          },
          {
            name: "Seated Shoulder Press (Dumbbells)",
            sets: 2,
            target: "8–12 reps",
            how: "Brace core; press without arching low back.",
            type: "reps"
          },
          {
            name: "Bike or Rower Steady Effort",
            sets: 2,
            target: "90 sec",
            how: "Moderate pace; breathe rhythmically; stay smooth.",
            type: "seconds"
          }
        ]
      }
    ]
  }
];

export function getTemplate(index: number): WeekTemplate {
  const template = WEEK_TEMPLATES[index];
  if (!template) {
    const fallback = WEEK_TEMPLATES[0];
    return fallback;
  }
  return template;
}
