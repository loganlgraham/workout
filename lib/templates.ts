export type TemplateExercise = {
  name: string;
  target: string;
  how: string;
  type: "reps" | "seconds";
  sets: number;
  suggestedWeight: string;
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
            type: "reps",
            suggestedWeight: "140"
          },
          {
            name: "Chest-Supported Row",
            sets: 2,
            target: "8–12 reps",
            how: "Chest on pad/bench; pull to lower ribs; squeeze shoulder blades.",
            type: "reps",
            suggestedWeight: "65"
          },
          {
            name: "Machine Chest Press",
            sets: 2,
            target: "8–12 reps",
            how: "Handles mid-chest; press smoothly; control the return.",
            type: "reps",
            suggestedWeight: "70"
          },
          {
            name: "Seated Leg Curl",
            sets: 2,
            target: "10–15 reps",
            how: "Pad above heels; curl steadily; brief pause; slow back.",
            type: "reps",
            suggestedWeight: "80"
          },
          {
            name: "Pallof Press (Cable)",
            sets: 2,
            target: "20–30 sec/side",
            how: "Cable chest-height; stand side-on; press arms out; resist twist.",
            type: "seconds",
            suggestedWeight: "20"
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
            type: "reps",
            suggestedWeight: "85"
          },
          {
            name: "Goblet Squat",
            sets: 2,
            target: "8–12 reps",
            how: "Hold weight at chest; sit between hips; stand tall.",
            type: "reps",
            suggestedWeight: "40"
          },
          {
            name: "Seated Cable Row",
            sets: 2,
            target: "8–12 reps",
            how: "Neutral spine; pull to navel/low ribs; squeeze blades.",
            type: "reps",
            suggestedWeight: "75"
          },
          {
            name: "Romanian Deadlift",
            sets: 2,
            target: "8–12 reps",
            how: "Soft knees; push hips back; flat back; stand tall.",
            type: "reps",
            suggestedWeight: "95"
          },
          {
            name: "Calf Raise (Seated/Standing)",
            sets: 2,
            target: "12–15 reps",
            how: "Full heel drop; rise to toes; 1–2s pause.",
            type: "reps",
            suggestedWeight: "70"
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
            type: "reps",
            suggestedWeight: "35"
          },
          {
            name: "Leg Extension",
            sets: 2,
            target: "10–15 reps",
            how: "Pad on lower shin; extend smoothly; control down.",
            type: "reps",
            suggestedWeight: "55"
          },
          {
            name: "Incline Dumbbell Press",
            sets: 2,
            target: "8–12 reps",
            how: "Bench 15–30°; elbows ~45°; press together; control.",
            type: "reps",
            suggestedWeight: "45"
          },
          {
            name: "Back Extension",
            sets: 2,
            target: "10–12 reps",
            how: "Hinge at hips; neutral spine; squeeze glutes to rise.",
            type: "reps",
            suggestedWeight: "25"
          },
          {
            name: "Farmer Carry",
            sets: 2,
            target: "30–40 sec",
            how: "Stand tall; ribs down; walk steadily without swaying.",
            type: "seconds",
            suggestedWeight: "60"
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
            type: "reps",
            suggestedWeight: "200"
          },
          {
            name: "Single-Leg Romanian Deadlift (DB)",
            sets: 2,
            target: "8–10 reps/side",
            how: "Soft knee; hinge from hips; keep hips square; stand tall.",
            type: "reps",
            suggestedWeight: "40"
          },
          {
            name: "Leg Press Calf Raise",
            sets: 2,
            target: "12–15 reps",
            how: "Slow lower; squeeze at top; maintain control.",
            type: "reps",
            suggestedWeight: "140"
          },
          {
            name: "Cable Chop",
            sets: 2,
            target: "20–25 sec/side",
            how: "Arms extended; rotate through torso; resist wobble.",
            type: "seconds",
            suggestedWeight: "25"
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
            type: "reps",
            suggestedWeight: "55"
          },
          {
            name: "Half-Kneeling Single-Arm Pulldown",
            sets: 2,
            target: "8–12 reps/side",
            how: "Kneel tall; pull elbow to hip; keep ribs stacked.",
            type: "reps",
            suggestedWeight: "45"
          },
          {
            name: "Machine Pec Fly or Cable Crossover",
            sets: 2,
            target: "10–15 reps",
            how: "Slight elbow bend; hug motion; slow return.",
            type: "reps",
            suggestedWeight: "70"
          },
          {
            name: "Prone Rear Delt Raise",
            sets: 2,
            target: "12–15 reps",
            how: "Thumbs down; lift to shoulder height; squeeze shoulder blades.",
            type: "reps",
            suggestedWeight: "20"
          },
          {
            name: "Dead Bug",
            sets: 2,
            target: "30–40 sec",
            how: "Lower opposite arm/leg; ribs down; breathe steadily.",
            type: "seconds",
            suggestedWeight: "Bodyweight"
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
            type: "reps",
            suggestedWeight: "185"
          },
          {
            name: "Split Squat (Dumbbells)",
            sets: 2,
            target: "8–10 reps/side",
            how: "Front knee over mid-foot; drop back knee straight down; drive through front heel.",
            type: "reps",
            suggestedWeight: "35"
          },
          {
            name: "Chest-Supported Dumbbell Row",
            sets: 2,
            target: "10–12 reps",
            how: "Squeeze shoulder blades; control lowering.",
            type: "reps",
            suggestedWeight: "60"
          },
          {
            name: "Seated Shoulder Press (Dumbbells)",
            sets: 2,
            target: "8–12 reps",
            how: "Brace core; press without arching low back.",
            type: "reps",
            suggestedWeight: "45"
          },
          {
            name: "Bike or Rower Steady Effort",
            sets: 2,
            target: "90 sec",
            how: "Moderate pace; breathe rhythmically; stay smooth.",
            type: "seconds",
            suggestedWeight: "Moderate pace"
          }
        ]
      }
    ]
  },
  {
    key: "apex",
    title: "Apex Strength & Conditioning",
    description:
      "High-threshold push, pull, and legs rotation with power primers and core finishers. Built for experienced lifters who enjoy heavier work.",
    days: [
      {
        id: "day1",
        shortName: "Day 1",
        name: "Day 1 — Squat + Press Power",
        exercises: [
          {
            name: "Back Squat (Barbell)",
            sets: 3,
            target: "5–8 reps",
            how: "Brace hard, drive knees out, and stand with intent on each rep.",
            type: "reps",
            suggestedWeight: "225"
          },
          {
            name: "Paused Bench Press",
            sets: 3,
            target: "4–6 reps",
            how: "One-second pause on the chest; press up while keeping shoulders packed.",
            type: "reps",
            suggestedWeight: "185"
          },
          {
            name: "Weighted Pull-Up or Heavy Lat Pulldown",
            sets: 3,
            target: "6–8 reps",
            how: "Pull elbows to your ribs, squeeze, and control the descent.",
            type: "reps",
            suggestedWeight: "45"
          },
          {
            name: "Dumbbell Bulgarian Split Squat",
            sets: 3,
            target: "8–10 reps/side",
            how: "Torso tall; drop the back knee straight down; drive through the front heel.",
            type: "reps",
            suggestedWeight: "50"
          },
          {
            name: "Cable Face Pull",
            sets: 3,
            target: "12–15 reps",
            how: "Elbows high, pull toward your brow, and pause the squeeze.",
            type: "reps",
            suggestedWeight: "35"
          }
        ]
      },
      {
        id: "day2",
        shortName: "Day 2",
        name: "Day 2 — Pull + Posterior Chain",
        exercises: [
          {
            name: "Trap Bar Deadlift (Heavy)",
            sets: 3,
            target: "4–6 reps",
            how: "Hips down, brace, and push the floor away; finish tall with glutes.",
            type: "reps",
            suggestedWeight: "275"
          },
          {
            name: "Standing Military Press",
            sets: 3,
            target: "5–8 reps",
            how: "Glutes tight, ribs stacked, press overhead without leaning back.",
            type: "reps",
            suggestedWeight: "95"
          },
          {
            name: "Pendlay Row",
            sets: 3,
            target: "6–8 reps",
            how: "Reset each rep on the floor; pull explosively to your sternum.",
            type: "reps",
            suggestedWeight: "155"
          },
          {
            name: "Walking Lunge (Dumbbells)",
            sets: 3,
            target: "10–12 steps/side",
            how: "Short pause between steps, stay tall, and push through the front foot.",
            type: "reps",
            suggestedWeight: "50"
          },
          {
            name: "Decline Sit-Up or Cable Crunch",
            sets: 3,
            target: "12–15 reps",
            how: "Brace abs, pull ribs toward hips, and control the return.",
            type: "reps",
            suggestedWeight: "25"
          }
        ]
      },
      {
        id: "day3",
        shortName: "Day 3",
        name: "Day 3 — Push/Pull Finisher + Conditioning",
        exercises: [
          {
            name: "Front Squat or Leg Press Power Set",
            sets: 3,
            target: "6–8 reps",
            how: "Elbows tall, drop under control, and drive up without collapsing.",
            type: "reps",
            suggestedWeight: "205"
          },
          {
            name: "Incline Dumbbell Press (Heavy)",
            sets: 3,
            target: "6–8 reps",
            how: "Bench ~30°; lower slow; press together with a strong lockout.",
            type: "reps",
            suggestedWeight: "70"
          },
          {
            name: "Chest-Supported T-Bar Row",
            sets: 3,
            target: "8–10 reps",
            how: "Neutral grip; pull toward low chest; squeeze shoulder blades.",
            type: "reps",
            suggestedWeight: "90"
          },
          {
            name: "Romanian Deadlift (Barbell or Dumbbell)",
            sets: 3,
            target: "8–10 reps",
            how: "Soft knees, hinge at the hips, feel hamstrings, and snap tall.",
            type: "reps",
            suggestedWeight: "185"
          },
          {
            name: "SkiErg or Bike Sprint Intervals",
            sets: 3,
            target: "45 sec steady + 15 sec push",
            how: "Alternate 45s smooth effort with a 15s surge; focus on crisp breathing.",
            type: "seconds",
            suggestedWeight: "Damper 6"
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
