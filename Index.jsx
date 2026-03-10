import { useState, useEffect, useRef } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────

// Master exercise list for dropdown picker (used in custom program & add-exercise modal)
const ALL_EXERCISES = [
  "Bench Press", "Incline Press", "Decline Press", "Pec Fly", "Cable Fly",
  "OHP", "Dumbbell Press", "Arnold Press", "Lateral Raises", "Front Raises",
  "Tricep Pushdown", "Skull Crushers", "Overhead Tricep Extension", "Dips",
  "Pull-ups", "Chin-ups", "Pulldown", "Barbell Row", "T-Bar Row", "Lat Row",
  "Cable Row", "Rear Delt Fly", "Face Pull", "Bicep Curl", "Hammer Curl",
  "Preacher Curl", "Incline Curl",
  "Hack Squat", "Back Squat", "Goblet Squat", "Bulgarian Split Squat",
  "Split Squat", "Leg Press", "RDL", "Deadlift", "Sumo Deadlift",
  "Ham Curl", "Leg Curl", "Leg Extension", "Hip Thrust", "Glute Bridge",
  "Calves", "Calf Raise", "Cable Crunch", "Russian Twist", "Plank", "Ab Wheel", "Core",
  "Shoulder Press", "Row", "Chest Press",
].sort();

// Exercises that support bodyweight mode
const BODYWEIGHT_EXERCISES = ["Pull-ups", "Chin-ups", "Dips", "Push-ups"];

// Exercises that use timer (seconds held) instead of weight+reps
const TIMER_EXERCISES = ["Plank"];
// Exercises that use reps only (no weight)
const REPS_ONLY_EXERCISES = ["Ab Wheel", "Russian Twist"];

// Flat program definitions referenced by ID
const ALL_PROGRAMS = {
  "ppl-push": {
    id: "ppl-push", name: "Push Day",
    exercises: [
      { name: "Bench Press", guide: "3 sets · 5–7 reps" },
      { name: "Incline Press", guide: "2 sets · 8–12 reps" },
      { name: "Pec Fly", guide: "2 sets · 10–12 reps" },
      { name: "OHP", guide: "2 sets · 8–12 reps" },
      { name: "Lateral Raises", guide: "2 sets · 12–15 reps" },
      { name: "Tricep Pushdown", guide: "2 sets · 10–12 reps" },
      { name: "Dips", guide: "2 sets" },
    ],
  },
  "ppl-pull": {
    id: "ppl-pull", name: "Pull Day",
    exercises: [
      { name: "Pull-ups", guide: "3 sets · 6–10 reps" },
      { name: "T-Bar Row", guide: "2 sets · 6–8 reps" },
      { name: "Pulldown", guide: "2 sets · 10–12 reps" },
      { name: "Cable Row", guide: "2 sets · 10–12 reps" },
      { name: "Rear Delt Fly", guide: "2 sets · 15–20 reps" },
      { name: "Bicep Curl", guide: "2 sets · 10–12 reps" },
      { name: "Hammer Curl", guide: "2 sets · 10–12 reps" },
    ],
  },
  "ppl-legs": {
    id: "ppl-legs", name: "Leg Day",
    exercises: [
      { name: "Hack Squat", guide: "3 sets · 10–15 reps" },
      { name: "Ham Curl", guide: "3 sets · 10–15 reps" },
      { name: "Leg Extension", guide: "2 sets · 10–15 reps" },
      { name: "Plank", guide: "3 sets · 60s" },
      { name: "Calf Raise", guide: "2 sets · 15–20 reps", optional: true },
    ],
  },
  "upper-a": {
    id: "upper-a", name: "Upper A", subtitle: "Horizontal emphasis",
    exercises: [
      { name: "Bench Press", guide: "3 sets · 5–8 reps" },
      { name: "Barbell Row", guide: "3 sets · 6–10 reps" },
      { name: "Dips", guide: "2 sets · 10–15 reps" },
      { name: "Pull-ups", guide: "2 sets · 6–10 reps" },
      { name: "Lateral Raises", guide: "2 sets · 12–15 reps", optional: true },
      { name: "Bicep Curl", guide: "2 sets · 10–12 reps" },
    ],
  },
  "upper-b": {
    id: "upper-b", name: "Upper B", subtitle: "Vertical emphasis",
    exercises: [
      { name: "OHP", guide: "3 sets · 6–10 reps" },
      { name: "Pull-ups", guide: "3 sets · 6–10 reps" },
      { name: "Incline Press", guide: "2 sets · 8–12 reps" },
      { name: "T-Bar Row", guide: "2 sets · 8–10 reps" },
      { name: "Tricep Pushdown", guide: "2 sets · 10–12 reps" },
      { name: "Bicep Curl", guide: "2 sets · 10–12 reps" },
    ],
  },
  "lower": {
    id: "lower", name: "Lower Day",
    exercises: [
      { name: "Hack Squat", guide: "3 sets · 10–15 reps" },
      { name: "RDL", guide: "3 sets · 8–10 reps" },
      { name: "Ham Curl", guide: "2 sets · 10–15 reps" },
      { name: "Leg Extension", guide: "2 sets · 10–15 reps" },
      { name: "Plank", guide: "3 sets · 60s" },
      { name: "Split Squat", guide: "2 sets · 10–12 reps", optional: true },
    ],
  },
  "fb-a": {
    id: "fb-a", name: "Full Body A", subtitle: "Strength bias",
    exercises: [
      { name: "Bench Press", guide: "3 sets · 5–7 reps" },
      { name: "Hack Squat", guide: "3 sets · 10–12 reps" },
      { name: "Pull-ups", guide: "3 sets · 6–10 reps" },
      { name: "RDL", guide: "2 sets · 8–10 reps" },
      { name: "OHP", guide: "2 sets · 8–12 reps" },
      { name: "Ham Curl", guide: "2 sets · 10–15 reps" },
      { name: "Bicep Curl", guide: "2 sets · 10–12 reps" },
      { name: "Plank", guide: "2 sets · 60s" },
    ],
  },
  "fb-b": {
    id: "fb-b", name: "Full Body B", subtitle: "Balanced volume",
    exercises: [
      { name: "OHP", guide: "3 sets · 6–10 reps" },
      { name: "Leg Press", guide: "3 sets · 10–15 reps" },
      { name: "T-Bar Row", guide: "2 sets · 6–8 reps" },
      { name: "Incline Press", guide: "2 sets · 8–12 reps" },
      { name: "Leg Extension", guide: "2 sets · 10–15 reps" },
      { name: "Pulldown", guide: "2 sets · 10–12 reps" },
      { name: "Hammer Curl", guide: "2 sets · 10–12 reps" },
      { name: "Cable Crunch", guide: "2 sets · 12–15 reps" },
    ],
  },
  "fb-c": {
    id: "fb-c", name: "Full Body C", subtitle: "Leanness focus",
    exercises: [
      { name: "Bench Press", guide: "3 sets · 6–8 reps" },
      { name: "Hack Squat", guide: "3 sets · 10–15 reps" },
      { name: "Barbell Row", guide: "2 sets · 8–10 reps" },
      { name: "Ham Curl", guide: "2 sets · 10–15 reps" },
      { name: "Dips", guide: "2 sets · 10–15 reps" },
      { name: "Rear Delt Fly", guide: "2 sets · 15 reps" },
      { name: "Lateral Raises", guide: "2 sets · 12 reps" },
      { name: "Bicep Curl", guide: "2 sets · 12–15 reps" },
      { name: "Plank", guide: "2 sets · 60s" },
    ],
  },
  "arms": {
    id: "arms", name: "Arms",
    exercises: [
      { name: "Bicep Curl", guide: "3 sets · 10–12 reps" },
      { name: "Hammer Curl", guide: "3 sets · 10–12 reps" },
      { name: "Tricep Pushdown", guide: "3 sets · 10–12 reps" },
      { name: "Overhead Tricep Extension", guide: "3 sets · 10–12 reps" },
      { name: "Lateral Raises", guide: "2 sets · 12–15 reps" },
    ],
  },
  "core": {
    id: "core", name: "Core Crusher",
    exercises: [
      { name: "Plank", guide: "3 sets" },
      { name: "Ab Wheel", guide: "3 sets · reps" },
      { name: "Cable Crunch", guide: "3 sets" },
      { name: "Russian Twist", guide: "3 sets" },
    ],
  },
  "lauren-fb1": {
    id: "lauren-fb1", name: "Full Body 1",
    exercises: [
      { name: "Goblet Squat" },
      { name: "RDL" },
      { name: "Chest Press" },
      { name: "Pulldown" },
    ],
  },
  "lauren-fb2": {
    id: "lauren-fb2", name: "Full Body 2",
    exercises: [
      { name: "Deadlift" },
      { name: "Split Squat" },
      { name: "Shoulder Press" },
      { name: "Row" },
    ],
  },
};

// Folder-based layout for Programs screen
const PROGRAM_FOLDERS = {
  Cullen: [
    {
      id: "ppl", label: "PPL", icon: "🔄", subtitle: "Push · Pull · Legs",
      programs: ["ppl-push", "ppl-pull", "ppl-legs"],
    },
    {
      id: "upperlower", label: "Upper / Lower", icon: "⚖️", subtitle: "Upper A · Upper B · Lower",
      programs: ["upper-a", "upper-b", "lower"],
    },
    {
      id: "fullbody", label: "Full Body", icon: "💥", subtitle: "3 programs",
      programs: ["fb-a", "fb-b", "fb-c"],
    },
    {
      id: "arms", label: "Arms", icon: "💪", subtitle: "5 exercises",
      programs: ["arms"],
    },
    {
      id: "core", label: "Core Crusher", icon: "🧱", subtitle: "4 exercises",
      programs: ["core"],
    },
  ],
  Lauren: [
    {
      id: "lauren-fb", label: "Full Body", icon: "💥", subtitle: "2 programs",
      programs: ["lauren-fb1", "lauren-fb2"],
    },
    {
      id: "core", label: "Core Crusher", icon: "🧱", subtitle: "4 exercises",
      programs: ["core"],
    },
  ],
};

// Keep flat PROGRAMS for backwards compat (streak, history lookups)
const PROGRAMS = {
  Cullen: Object.values(ALL_PROGRAMS).filter(p =>
    PROGRAM_FOLDERS.Cullen.flatMap(f => f.programs).includes(p.id)
  ),
  Lauren: Object.values(ALL_PROGRAMS).filter(p =>
    PROGRAM_FOLDERS.Lauren.flatMap(f => f.programs).includes(p.id)
  ),
};

// Custom program template — exercises built fresh each session
const CUSTOM_PROGRAM = {
  id: "custom",
  name: "Custom Workout",
  subtitle: "Build your own",
  exercises: [],
  isCustom: true,
};

const CARDIO_TYPES = ["Walk", "Run", "Bike", "Elliptical", "Swim"];
// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  default: {
    name: "Default",
    emoji: "🏋️",
    vars: {
      "--bg": "#F7F5F2", "--surface": "#FFFFFF", "--border": "#E8E4DF",
      "--text": "#1A1714", "--muted": "#9A9490", "--accent": "#E8500A",
      "--accent-light": "#FFF0EA", "--accent2": "#2D6A4F",
      "--green": "#2D6A4F", "--green-light": "#EAF4EF",
    },
    greeting: (name) => `Let's get it, ${name} 💪`,
    startLabel: "Let's Go 🚀",
    finishLabel: "DONE. LET'S GO! 🔥",
    streakSuffix: "-day streak",
    emptyWorkout: "Let's build something 🔨",
    summaryTitle: "Workout done!",
  },
  bobsburgers: {
    name: "Bob's Burgers",
    emoji: "🍔",
    vars: {
      "--bg": "#FFF8F0", "--surface": "#FFFFFF", "--border": "#F2D9BE",
      "--text": "#3D1C00", "--muted": "#B07040", "--accent": "#D44000",
      "--accent-light": "#FFEEDD", "--accent2": "#5B8C3E",
      "--green": "#5B8C3E", "--green-light": "#E8F5E0",
    },
    greeting: (name) => `Order up, ${name}! 🍔`,
    startLabel: "Fire Up the Grill 🔥",
    finishLabel: "BURGER OF THE DAY COMPLETE 🍔",
    streakSuffix: "-burger streak",
    emptyWorkout: "The grill is empty! Add exercises 🍔",
    summaryTitle: "That's the stuff!",
  },
  puertorico: {
    name: "Puerto Rico",
    emoji: "🇵🇷",
    vars: {
      "--bg": "#F5F0FF", "--surface": "#FFFFFF", "--border": "#D4C5F0",
      "--text": "#1A0A3D", "--muted": "#7B6AA0", "--accent": "#B91C8C",
      "--accent-light": "#FFE8F8", "--accent2": "#0A7B3E",
      "--green": "#0A7B3E", "--green-light": "#E0F5EA",
    },
    greeting: (name) => `¡Wepa ${name}! 🇵🇷`,
    startLabel: "¡Vamos! 🌴",
    finishLabel: "¡WEPA! WORKOUT DONE! 🇵🇷",
    streakSuffix: "-day racha",
    emptyWorkout: "¡Añade ejercicios para empezar! 💃",
    summaryTitle: "¡Wepa! Workout done!",
  },
  nightmode: {
    name: "Midnight Grind",
    emoji: "🌙",
    vars: {
      "--bg": "#0F0F14", "--surface": "#1A1A24", "--border": "#2A2A3A",
      "--text": "#E8E8F0", "--muted": "#6A6A80", "--accent": "#7C3AED",
      "--accent-light": "#2D1B69", "--accent2": "#059669",
      "--green": "#059669", "--green-light": "#064E3B",
    },
    greeting: (name) => `Night grind, ${name} 🌙`,
    startLabel: "Enter the Void 🌑",
    finishLabel: "YOU CONQUERED THE NIGHT 🌙",
    streakSuffix: "-night streak",
    emptyWorkout: "The darkness awaits your gains 🌑",
    summaryTitle: "Crushed it.",
  },
  beachvibes: {
    name: "Beach Vibes",
    emoji: "🏖️",
    vars: {
      "--bg": "#F0F9FF", "--surface": "#FFFFFF", "--border": "#BAE6FD",
      "--text": "#0C2340", "--muted": "#5B9DC0", "--accent": "#0284C7",
      "--accent-light": "#E0F2FE", "--accent2": "#0D9488",
      "--green": "#0D9488", "--green-light": "#CCFBF1",
    },
    greeting: (name) => `Surf's up, ${name}! 🏄`,
    startLabel: "Catch That Wave 🌊",
    finishLabel: "SHREDDED! 🏄‍♂️",
    streakSuffix: "-day wave",
    emptyWorkout: "No waves yet! Add exercises 🌊",
    summaryTitle: "Stoked! Workout done!",
  },
};

const REST_TIMER_OPTIONS = [
  { label: "1:00", seconds: 60, emoji: "⚡" },
  { label: "1:30", seconds: 90, emoji: "💪" },
  { label: "2:00", seconds: 120, emoji: "🐢" },
];


const CARDIO_DURATIONS = [15, 20, 30, 45, 60];

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── HELPERS ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const elapsed = (start) => {
  const s = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

function calcStreak(sessions, user) {
  // Include both strength sessions and cardio logs
  const days = [...new Set(
    sessions.filter(s => s.user === user).map(s => s.date)
  )].sort().reverse();
  if (!days.length) return 0;
  let streak = 0;
  let cursor = new Date(today());
  for (let i = 0; i < days.length; i++) {
    const d = new Date(days[i]);
    const diff = Math.round((cursor - d) / 86400000);
    if (diff <= 1) { streak++; cursor = d; }
    else if (diff === 2 && streak > 0) { cursor = d; }
    else break;
  }
  return streak;
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #F7F5F2;
    --surface: #FFFFFF;
    --border: #E8E4DF;
    --text: #1A1714;
    --muted: #9A9490;
    --accent: #E8500A;
    --accent-light: #FFF0EA;
    --accent2: #2D6A4F;
    --green: #2D6A4F;
    --green-light: #EAF4EF;
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    --radius: 14px;
    --radius-sm: 8px;
  }

  html, body, #root { height: 100%; width: 100%; background: var(--bg); }

  body {
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .app {
    width: 100%;
    max-width: 430px;
    margin: 0 auto;
    min-height: 100%;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .bottom-nav {
    width: 100%;
  }

  /* SCREENS */
  .screen { flex: 1; display: flex; flex-direction: column; padding: 0 0 32px; }
  .screen-scroll { flex: 1; overflow-y: auto; padding: 16px 20px 32px; }

  /* HEADER */
  .header {
    padding: 16px 20px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .header-back {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    flex-shrink: 0;
  }
  .header-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    flex: 1;
  }
  .header-sub { font-size: 12px; color: var(--muted); font-weight: 400; }

  /* CARDS */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
    padding: 16px;
    margin-bottom: 10px;
  }
  .card-tap { cursor: pointer; transition: transform 0.12s, box-shadow 0.12s; }
  .card-tap:active { transform: scale(0.98); box-shadow: none; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    border-radius: var(--radius-sm);
    transition: opacity 0.1s, transform 0.1s;
  }
  .btn:active { transform: scale(0.97); opacity: 0.85; }
  .btn-primary {
    background: var(--accent);
    color: white;
    padding: 14px 24px;
    font-size: 15px;
    border-radius: var(--radius);
    width: 100%;
  }
  .btn-secondary {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 12px 20px;
    font-size: 14px;
    border-radius: var(--radius);
  }
  .btn-ghost {
    background: transparent;
    color: var(--muted);
    padding: 8px 12px;
    font-size: 13px;
  }
  .btn-accent-light {
    background: var(--accent-light);
    color: var(--accent);
    padding: 10px 16px;
    font-size: 14px;
    border-radius: var(--radius-sm);
    font-weight: 600;
  }
  .btn-green {
    background: var(--green);
    color: white;
    padding: 14px 24px;
    font-size: 15px;
    border-radius: var(--radius);
    width: 100%;
  }
  .btn-danger {
    background: #FFF0EA;
    color: var(--accent);
    border: 1px solid #ffc9b0;
    padding: 14px 24px;
    font-size: 15px;
    border-radius: var(--radius);
    width: 100%;
    font-weight: 600;
  }

  /* HOME */
  .home-hero { padding: 32px 20px 24px; }
  .home-greeting {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 4px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .home-name {
    font-family: 'Syne', sans-serif;
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 16px;
  }
  .streak-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-light);
    color: var(--accent);
    padding: 8px 14px;
    border-radius: 99px;
    font-weight: 700;
    font-size: 15px;
  }
  .section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 10px;
    margin-top: 24px;
  }
  .recent-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    background: var(--surface);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    margin-bottom: 8px;
    cursor: pointer;
    transition: transform 0.12s;
  }
  .recent-item:active { transform: scale(0.98); }
  .recent-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
  .recent-info { flex: 1; }
  .recent-name { font-weight: 500; font-size: 14px; }
  .recent-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .recent-arrow { color: var(--muted); font-size: 13px; }

  /* USER SELECT */
  .user-select {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 24px;
    background: var(--bg);
  }
  .user-select-logo { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 8px; color: var(--accent); }
  .user-select-sub { font-size: 14px; color: var(--muted); margin-bottom: 48px; }
  .user-btn {
    width: 100%;
    padding: 20px 24px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    text-align: left;
    margin-bottom: 12px;
    transition: border-color 0.15s, transform 0.12s;
    display: flex; align-items: center; gap: 16px;
  }
  .user-btn:active { transform: scale(0.98); }
  .user-btn:hover { border-color: var(--accent); }
  .user-avatar {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: var(--accent-light);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 18px;
    color: var(--accent);
  }
  .user-info-name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }

  /* PROGRAM LIST */
  .prog-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 18px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: transform 0.12s, border-color 0.12s;
    display: flex; align-items: center; gap: 14px;
  }
  .prog-card:active { transform: scale(0.98); }
  .prog-card.custom-card { border: 2px dashed var(--border); background: var(--bg); }
  .prog-card.custom-card:hover { border-color: var(--accent); }
  .prog-icon {
    width: 44px; height: 44px;
    border-radius: var(--radius-sm);
    background: var(--accent-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .prog-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 16px; }
  .prog-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .prog-arrow { color: var(--muted); margin-left: auto; }

  .cardio-card { background: var(--green-light); border-color: #b7ddc9; }
  .cardio-card .prog-icon { background: #d4eddf; }

  /* ACTIVE WORKOUT */
  .workout-timer { font-size: 12px; color: var(--muted); font-weight: 500; }
  .ex-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 10px;
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .ex-item.active { border-color: var(--accent); }
  .ex-header {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
  }
  .ex-name { font-weight: 600; font-size: 15px; flex: 1; }
  .ex-guide { font-size: 12px; color: var(--muted); }
  .ex-sets-count {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    background: var(--accent-light);
    padding: 3px 8px;
    border-radius: 99px;
  }
  .ex-optional { font-size: 11px; color: var(--muted); font-style: italic; }
  .ex-body { padding: 0 16px 16px; border-top: 1px solid var(--border); }

  .last-session {
    font-size: 12px;
    color: var(--muted);
    padding: 10px 0 8px;
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .last-tag {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 99px;
    padding: 2px 8px;
    font-size: 11px;
  }
  .log-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
  .log-input {
    flex: 1;
    padding: 14px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 20px;
    font-weight: 600;
    background: var(--bg);
    color: var(--text);
    text-align: center;
    -moz-appearance: textfield;
    width: 100%;
  }
  .log-input::-webkit-inner-spin-button { display: none; }
  .log-input:focus { outline: none; border-color: var(--accent); background: white; }
  .log-label { font-size: 11px; color: var(--muted); text-align: center; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .log-field { flex: 1; }
  .log-btn {
    display: block;
    width: 100%;
    padding: 14px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.1s;
    margin-top: 2px;
    letter-spacing: 0.02em;
  }
  .log-btn:active { transform: scale(0.97); opacity: 0.9; }

  /* Bodyweight toggle */
  .bw-toggle {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--muted);
    margin-bottom: 10px;
    cursor: pointer;
    user-select: none;
  }
  .bw-toggle input { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
  .bw-toggle span { font-weight: 500; }

  .logged-sets { margin-top: 10px; }
  .logged-set {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .logged-set:last-child { border-bottom: none; }
  .set-num {
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    font-size: 10px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .set-detail { flex: 1; font-weight: 500; }
  .set-del { color: var(--muted); cursor: pointer; font-size: 16px; padding: 4px; }

  .add-exercise-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    color: var(--muted);
    font-size: 14px;
    font-weight: 500;
    margin-top: 4px;
    margin-bottom: 10px;
    width: 100%;
    transition: border-color 0.15s, color 0.15s;
  }
  .add-exercise-btn:hover { border-color: var(--accent); color: var(--accent); }

  .add-cardio-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 16px;
    background: var(--green-light);
    border: 1px dashed #b7ddc9;
    border-radius: var(--radius);
    cursor: pointer;
    color: var(--green);
    font-size: 14px;
    font-weight: 500;
    margin-top: 0;
    margin-bottom: 10px;
    width: 100%;
    transition: border-color 0.15s;
  }
  .add-cardio-btn:hover { border-color: var(--green); }

  .finish-bar {
    padding: 16px 20px;
    background: var(--bg);
    border-top: 1px solid var(--border);
    position: sticky;
    bottom: 0;
  }

  /* SUMMARY */
  .summary-hero { padding: 32px 20px 24px; text-align: center; }
  .summary-icon { font-size: 48px; margin-bottom: 16px; }
  .summary-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 28px; margin-bottom: 4px; }
  .summary-prog { font-size: 14px; color: var(--muted); }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 20px;
    margin-bottom: 16px;
  }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; text-align: center; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent); }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .stat-diff { font-size: 11px; color: var(--green); font-weight: 600; margin-top: 2px; }

  /* HISTORY */
  .hist-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: transform 0.12s;
  }
  .hist-item:active { transform: scale(0.98); }
  .hist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .hist-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
  .hist-date { font-size: 12px; color: var(--muted); }
  .hist-meta { font-size: 13px; color: var(--muted); }

  /* EXERCISE LOG DETAIL */
  .detail-exercise { margin-bottom: 16px; }
  .detail-ex-name { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .detail-set { font-size: 13px; color: var(--muted); padding: 3px 0; }

  /* CARDIO SCREEN */
  .cardio-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .cardio-type-btn {
    padding: 14px 8px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    transition: border-color 0.12s;
  }
  .cardio-type-btn.selected { border-color: var(--green); background: var(--green-light); color: var(--green); }
  .cardio-type-icon { font-size: 24px; margin-bottom: 4px; }
  .duration-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .duration-btn {
    padding: 10px 16px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: border-color 0.12s;
  }
  .duration-btn.selected { border-color: var(--green); background: var(--green-light); color: var(--green); }

  /* ADD EXERCISE MODAL */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 100;
    display: flex; align-items: flex-end;
  }
  .modal {
    background: var(--bg);
    border-radius: 20px 20px 0 0;
    padding: 24px 20px 48px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
  }
  .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 16px; }
  .modal-input {
    width: 100%;
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    background: var(--surface);
    margin-bottom: 12px;
  }
  .modal-input:focus { outline: none; border-color: var(--accent); }

  /* Exercise picker list */
  .ex-pick-list { margin-bottom: 12px; }
  .ex-pick-item {
    padding: 12px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: border-color 0.12s, background 0.12s;
  }
  .ex-pick-item:hover { border-color: var(--accent); background: var(--accent-light); }
  .ex-pick-item.selected { border-color: var(--accent); background: var(--accent-light); color: var(--accent); font-weight: 700; }

  /* CONFIRM DIALOG */
  .confirm-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .confirm-box {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 28px 24px 24px;
    width: 100%;
    max-width: 340px;
    text-align: center;
  }
  .confirm-icon { font-size: 36px; margin-bottom: 12px; }
  .confirm-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; margin-bottom: 8px; }
  .confirm-body { font-size: 14px; color: var(--muted); margin-bottom: 24px; line-height: 1.5; }
  .confirm-actions { display: flex; flex-direction: column; gap: 10px; }

  /* NAV */
  .bottom-nav {
    display: flex;
    border-top: 1px solid var(--border);
    background: var(--surface);
    padding: 8px 0 20px;
    position: sticky; bottom: 0;
  }
  .nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 8px 0;
    cursor: pointer;
    font-size: 11px;
    color: var(--muted);
    font-weight: 500;
    transition: color 0.15s;
  }
  .nav-item.active { color: var(--accent); }
  .nav-icon { font-size: 22px; }


  /* THEME */
  [data-theme] { transition: background 0.3s, color 0.3s; }

  /* MENU */
  .menu-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 200;
    display: flex; justify-content: flex-end;
  }
  .menu-panel {
    background: var(--bg);
    width: 280px;
    height: 100%;
    padding: 48px 24px 40px;
    display: flex; flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }
  .menu-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; margin-bottom: 32px; }
  .menu-section-label {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--muted); margin-bottom: 10px; margin-top: 24px;
  }
  .theme-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    border: 2px solid var(--border);
    background: var(--surface);
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    font-size: 14px;
    font-weight: 500;
  }
  .theme-btn.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); font-weight: 700; }
  .theme-btn-emoji { font-size: 20px; }

  /* REST TIMER SELECTION SCREEN */
  .rest-select-screen { flex: 1; display: flex; flex-direction: column; }
  .rest-hero { padding: 32px 20px 24px; text-align: center; }
  .rest-hero-icon { font-size: 52px; margin-bottom: 12px; }
  .rest-hero-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 26px; margin-bottom: 6px; }
  .rest-hero-sub { font-size: 14px; color: var(--muted); }
  .rest-options { padding: 0 20px; display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .rest-option-btn {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 22px;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: border-color 0.15s, transform 0.12s;
  }
  .rest-option-btn:active { transform: scale(0.98); }
  .rest-option-btn.selected { border-color: var(--accent); background: var(--accent-light); }
  .rest-option-emoji { font-size: 26px; }
  .rest-option-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 22px; color: var(--accent); }
  .rest-option-desc { font-size: 13px; color: var(--muted); }
  .rest-start-btn { margin: 24px 20px 0; }

  /* REST TIMER WIDGET */
  .rest-timer-bar {
    background: var(--accent-light);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 16px;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 12px;
    cursor: pointer;
  }
  .rest-timer-bar.running { border-color: var(--accent); }
  .rest-timer-ring { font-size: 20px; }
  .rest-timer-info { flex: 1; }
  .rest-timer-label { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .rest-timer-count { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; color: var(--accent); }
  .rest-timer-done { font-size: 12px; color: var(--green); font-weight: 700; }

  /* TIMER EXERCISE (Plank etc) */
  .timer-ex-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px; }
  .timer-ex-input {
    flex: 1;
    padding: 14px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 20px;
    font-weight: 600;
    background: var(--bg);
    color: var(--text);
    text-align: center;
    -moz-appearance: textfield;
    width: 100%;
  }
  .timer-ex-input::-webkit-inner-spin-button { display: none; }
  .timer-ex-input:focus { outline: none; border-color: var(--accent); background: white; }
  .timer-preset-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .timer-preset-btn {
    padding: 6px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 99px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.12s;
  }
  .timer-preset-btn:hover { border-color: var(--accent); color: var(--accent); }

  /* HOME MENU BUTTON */
  .home-menu-btn {
    position: absolute;
    top: 20px; right: 20px;
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 16px;
    z-index: 5;
  }


  /* STATS SCREEN */
  .stats-tab-bar { display: flex; border-bottom: 1px solid var(--border); }
  .stats-tab { flex: 1; padding: 12px 8px; text-align: center; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--muted); border-bottom: 2px solid transparent; }
  .stats-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .pr-card { display: flex; align-items: center; gap: 14px; }

  .empty-state { text-align: center; padding: 48px 24px; color: var(--muted); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .badge-orange { background: var(--accent-light); color: var(--accent); }
  .badge-green { background: var(--green-light); color: var(--green); }

  /* Inline cardio block inside workout */
  .cardio-block {
    background: var(--green-light);
    border: 1px solid #b7ddc9;
    border-radius: var(--radius);
    padding: 14px 16px;
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 12px;
  }
  .cardio-block-icon { font-size: 22px; }
  .cardio-block-info { flex: 1; font-size: 14px; font-weight: 500; color: var(--green); }
  .cardio-block-sub { font-size: 12px; color: #5a9a7a; margin-top: 2px; }
  .cardio-block-del { color: #5a9a7a; cursor: pointer; font-size: 18px; padding: 4px; }
`;

// ── ICONS ──────────────────────────────────────────────────────────────────────
const CARDIO_ICONS = { Walk: "🚶", Run: "🏃", Bike: "🚴", Elliptical: "⚡", Swim: "🏊" };
const PROG_ICONS = {
  "ppl-push": "🔥", "ppl-pull": "🔃", "ppl-legs": "🦵",
  "upper-a": "📐", "upper-b": "⬆️", "lower": "🏋️",
  "fb-a": "💥", "fb-b": "⚡", "fb-c": "🔥",
  "arms": "💪", "core": "🧱",
  "lauren-fb1": "⚡", "lauren-fb2": "🔥",
  "custom": "✏️",
};

// ── CONFIRM DIALOG ─────────────────────────────────────────────────────────────
function ConfirmDialog({ icon, title, body, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">{icon}</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-body">{body}</div>
        <div className="confirm-actions">
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [sessions, setSessions] = useState(() => load("sessions", []));
  const [strengthSets, setStrengthSets] = useState(() => load("strengthSets", []));
  const [cardioLogs, setCardioLogs] = useState(() => load("cardioLogs", []));
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [histDetail, setHistDetail] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [tab, setTab] = useState("home");
  const [theme, setTheme] = useState(() => load("theme", "default"));
  const [showMenu, setShowMenu] = useState(false);
  // Program chosen but waiting for rest timer pick
  const [pendingProgram, setPendingProgram] = useState(null);
  const [restTimerSecs, setRestTimerSecs] = useState(() => load("restTimerSecs", 90));

  useEffect(() => { save("sessions", sessions); }, [sessions]);
  useEffect(() => { save("strengthSets", strengthSets); }, [strengthSets]);
  useEffect(() => { save("cardioLogs", cardioLogs); }, [cardioLogs]);
  useEffect(() => { save("theme", theme); }, [theme]);
  useEffect(() => { save("restTimerSecs", restTimerSecs); }, [restTimerSecs]);

  // Apply theme CSS vars
  useEffect(() => {
    const t = THEMES[theme] || THEMES.default;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [theme]);

  const goHome = () => { setScreen("home"); setTab("home"); };
  const goHistory = () => { setScreen("history"); setTab("history"); };
  const goStats = () => { setScreen("stats"); setTab("stats"); };

  const mySets = strengthSets.filter(s => s.user === user);
  const mySessions = sessions.filter(s => s.user === user);
  const myCardio = cardioLogs.filter(c => c.user === user);

  const recentSessions = mySessions.slice(-3).reverse();

  // Streak counts both strength sessions AND cardio logs
  const allActivityForStreak = [
    ...sessions.map(s => ({ user: s.user, date: s.date })),
    ...cardioLogs.map(c => ({ user: c.user, date: c.date })),
  ];
  const streak = calcStreak(allActivityForStreak, user);

  const startWorkout = (prog, timerSecs) => {
    const sid = `s${Date.now()}`;
    setActiveWorkout({
      sessionId: sid,
      program: prog,
      startTime: Date.now(),
      sets: {},
      activeExercise: null,
      exercises: prog.exercises.map(e => e.name),
      cardioFinisher: null,
      restTimerSecs: timerSecs || restTimerSecs,
    });
    setPendingProgram(null);
    setScreen("workout");
  };

  // Called when user picks a program — go to rest timer select first
  const pickProgram = (prog) => {
    setPendingProgram(prog);
    setScreen("restSelect");
  };

  const finishWorkout = () => {
    const w = activeWorkout;
    const end = Date.now();
    const duration = Math.round((end - w.startTime) / 60000);
    const allSets = Object.values(w.sets).flat();
    const totalSets = allSets.length;
    const totalReps = allSets.reduce((a, s) => a + s.reps, 0);
    const totalVol = allSets.reduce((a, s) => a + (s.isBodyweight ? 0 : s.weight * s.reps), 0);

    const newSession = {
      sessionId: w.sessionId,
      user,
      program: w.program.name,
      programId: w.program.id,
      date: today(),
      duration,
      totalSets,
      totalReps,
      totalVol,
      sets: w.sets,
      cardioFinisher: w.cardioFinisher || null,
    };

    const newSets = [];
    for (const [ex, sets] of Object.entries(w.sets)) {
      sets.forEach(s => newSets.push({
        user,
        sessionId: w.sessionId,
        date: today(),
        program: w.program.name,
        exercise: ex,
        weight: s.weight,
        reps: s.reps,
        isBodyweight: s.isBodyweight || false,
      }));
    }

    // If there's a cardio finisher, log it too
    if (w.cardioFinisher) {
      setCardioLogs(prev => [...prev, { ...w.cardioFinisher, user, date: today() }]);
    }

    const lastSameSession = [...mySessions].reverse().find(s => s.programId === w.program.id);
    setSessions(prev => [...prev, newSession]);
    setStrengthSets(prev => [...prev, ...newSets]);
    setSummaryData({ session: newSession, lastSession: lastSameSession });
    setActiveWorkout(null);
    setScreen("summary");
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    setStrengthSets(prev => prev.filter(s => s.sessionId !== sessionId));
    setHistDetail(null);
    setScreen("history");
  };

  const updateSession = (updatedSession) => {
    // Recompute totals from sets
    const allSets = Object.values(updatedSession.sets).flat();
    const totalSets = allSets.length;
    const totalReps = allSets.reduce((a, s) => a + (s.reps || 0), 0);
    const totalVol = allSets.reduce((a, s) => a + (!s.isBodyweight ? (s.weight || 0) * (s.reps || 0) : 0), 0);
    const recomputed = { ...updatedSession, totalSets, totalReps, totalVol };
    setSessions(prev => prev.map(s => s.sessionId === recomputed.sessionId ? recomputed : s));
    // Rebuild strengthSets for this session
    const newSets = [];
    for (const [ex, sets] of Object.entries(recomputed.sets)) {
      sets.forEach(s => newSets.push({
        user: recomputed.user,
        sessionId: recomputed.sessionId,
        date: recomputed.date,
        program: recomputed.program,
        exercise: ex,
        weight: s.weight,
        reps: s.reps,
        isBodyweight: s.isBodyweight || false,
      }));
    }
    setStrengthSets(prev => [
      ...prev.filter(s => s.sessionId !== recomputed.sessionId),
      ...newSets,
    ]);
    setHistDetail(recomputed);
    setEditingSession(null);
  };

  const getLastSetWeight = (exerciseName) => {
    const exSets = mySets.filter(s => s.exercise === exerciseName);
    if (!exSets.length) return "";
    return exSets[exSets.length - 1].weight;
  };

  const currentTheme = THEMES[theme] || THEMES.default;

  if (!user) {
    return (
      <>
        <style>{css}</style>
        <UserSelect onSelect={setUser} />
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {screen === "home" && (
          <HomeScreen
            user={user}
            streak={streak}
            recentSessions={recentSessions}
            theme={currentTheme}
            onSwitchUser={() => setUser(null)}
            onMenu={() => setShowMenu(true)}
            onStartPrograms={() => { setScreen("programs"); setTab("programs"); }}
            onViewHistory={() => goHistory()}
            onViewDetail={(s) => { setHistDetail(s); setScreen("histDetail"); }}
          />
        )}
        {screen === "programs" && (
          <ProgramsScreen
            user={user}
            onBack={goHome}
            onStart={pickProgram}
            onCardio={() => setScreen("cardio")}
          />
        )}
        {screen === "restSelect" && pendingProgram && (
          <RestTimerSelectScreen
            program={pendingProgram}
            defaultSecs={restTimerSecs}
            user={user}
            onBack={() => { setPendingProgram(null); setScreen("programs"); }}
            onStart={(secs) => {
              if (secs !== null) setRestTimerSecs(secs);
              startWorkout(pendingProgram, secs);
            }}
          />
        )}
        {screen === "workout" && activeWorkout && (
          <WorkoutScreen
            workout={activeWorkout}
            setWorkout={setActiveWorkout}
            getLastSetWeight={getLastSetWeight}
            mySets={mySets}
            theme={currentTheme}
            onFinish={finishWorkout}
            onBack={() => { setActiveWorkout(null); setScreen("programs"); }}
          />
        )}
        {screen === "summary" && summaryData && (
          <SummaryScreen data={summaryData} user={user} theme={currentTheme} onDone={goHome} />
        )}
        {screen === "history" && (
          <HistoryScreen
            allSessions={sessions}
            allCardio={cardioLogs}
            onBack={goHome}
            onDetail={(s) => { setHistDetail(s); setScreen("histDetail"); }}
          />
        )}
        {screen === "stats" && (
          <StatsScreen
            sessions={sessions}
            strengthSets={strengthSets}
            user={user}
            onBack={goHome}
          />
        )}
        {screen === "histDetail" && histDetail && (
          <HistDetailScreen
            session={histDetail}
            onBack={() => setScreen("history")}
            onDelete={deleteSession}
            onUpdate={updateSession}
          />
        )}
        {screen === "cardio" && (
          <CardioScreen
            user={user}
            onBack={() => setScreen("programs")}
            onLog={(entry) => {
              setCardioLogs(prev => [...prev, { ...entry, user, date: today() }]);
              setSummaryData({ cardio: entry });
              setScreen("summary");
            }}
          />
        )}
        {screen !== "workout" && screen !== "summary" && screen !== "histDetail" && screen !== "restSelect" && (
          <BottomNav tab={tab} onTab={(t) => {
            setTab(t);
            if (t === "home") goHome();
            if (t === "programs") setScreen("programs");
            if (t === "history") goHistory();
            if (t === "stats") goStats();
          }} />
        )}
        {showMenu && (
          <ThemeMenu
            theme={theme}
            onTheme={(t) => { setTheme(t); }}
            onClose={() => setShowMenu(false)}
            onSwitchUser={() => { setShowMenu(false); setUser(null); }}
          />
        )}
      </div>
    </>
  );
}

// ── USER SELECT ───────────────────────────────────────────────────────────────
function UserSelect({ onSelect }) {
  return (
    <div className="user-select">
      <div className="user-select-logo">LIFT</div>
      <div className="user-select-sub">Who&apos;s training today?</div>
      {["Cullen", "Lauren"].map(u => (
        <button key={u} className="user-btn" onClick={() => onSelect(u)}>
          <div className="user-avatar">{u[0]}</div>
          <div><div className="user-info-name">{u}</div></div>
        </button>
      ))}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ user, streak, recentSessions, theme, onSwitchUser, onMenu, onStartPrograms, onViewHistory, onViewDetail }) {
  return (
    <div className="screen" style={{ position: "relative" }}>
      <div className="home-menu-btn" onClick={onMenu}>☰</div>
      <div className="screen-scroll">
        <div className="home-hero">
          <div className="home-greeting" style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{theme.greeting(user)}</div>
          <div className="home-name">{user}</div>
          {streak > 0
            ? <div className="streak-pill">🔥 {streak}{theme.streakSuffix}</div>
            : <div className="streak-pill" style={{ background: "#f5f5f5", color: "#999" }}>Start your streak 💪</div>
          }
        </div>
        <div style={{ padding: "0 20px" }}>
          <button className="btn btn-primary" onClick={onStartPrograms}>{theme.startLabel}</button>
          <div className="section-label">Recent</div>
          {recentSessions.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div className="empty-icon">🏋️</div>
              <div className="empty-text">No workouts yet. Let&apos;s go!</div>
            </div>
          ) : recentSessions.map((s, i) => (
            <div key={i} className="recent-item" onClick={() => onViewDetail(s)}>
              <div className="recent-dot" />
              <div className="recent-info">
                <div className="recent-name">{s.program}</div>
                <div className="recent-meta">{fmtDate(s.date)} · {s.totalSets} sets · {s.duration}m</div>
              </div>
              <div className="recent-arrow">›</div>
            </div>
          ))}
          {recentSessions.length > 0 && (
            <button className="btn btn-ghost" style={{ marginTop: 4, paddingLeft: 0 }} onClick={onViewHistory}>
              View all history →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

// ── PROGRAMS ──────────────────────────────────────────────────────────────────
function ProgramsScreen({ user, onBack, onStart, onCardio }) {
  const [openFolder, setOpenFolder] = useState(null);
  const folders = PROGRAM_FOLDERS[user] || [];

  // If a folder has only 1 program, start it directly; otherwise open folder
  const handleFolderTap = (folder) => {
    if (folder.programs.length === 1) {
      onStart(ALL_PROGRAMS[folder.programs[0]]);
    } else {
      setOpenFolder(openFolder === folder.id ? null : folder.id);
    }
  };

  return (
    <div className="screen">
      {openFolder ? (
        // Sub-screen: programs inside a folder
        (() => {
          const folder = folders.find(f => f.id === openFolder);
          return (
            <>
              <div className="header">
                <button className="header-back" onClick={() => setOpenFolder(null)}>←</button>
                <div>
                  <div className="header-title">{folder.icon} {folder.label}</div>
                  <div className="header-sub">{user}</div>
                </div>
              </div>
              <div className="screen-scroll">
                {folder.programs.map(pid => {
                  const p = ALL_PROGRAMS[pid];
                  if (!p) return null;
                  return (
                    <div key={p.id} className="prog-card" onClick={() => onStart(p)}>
                      <div className="prog-icon">{PROG_ICONS[p.id] || "💪"}</div>
                      <div style={{ flex: 1 }}>
                        <div className="prog-name">{p.name}</div>
                        <div className="prog-sub">
                          {p.subtitle ? p.subtitle + " · " : ""}{p.exercises.length} exercises
                        </div>
                      </div>
                      <div className="prog-arrow">›</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()
      ) : (
        // Main programs list with folders
        <>
          <div className="header">
            <button className="header-back" onClick={onBack}>←</button>
            <div>
              <div className="header-title">Workout</div>
              <div className="header-sub">{user}</div>
            </div>
          </div>
          <div className="screen-scroll">
            <div className="section-label" style={{ marginTop: 8 }}>Custom</div>
            <div className="prog-card custom-card" onClick={() => onStart(CUSTOM_PROGRAM)}>
              <div className="prog-icon" style={{ background: "#f0f0f0" }}>✏️</div>
              <div style={{ flex: 1 }}>
                <div className="prog-name">Custom Workout</div>
                <div className="prog-sub">Build your own from the exercise library</div>
              </div>
              <div className="prog-arrow">›</div>
            </div>

            <div className="section-label">Strength Programs</div>
            {folders.map(folder => (
              <div key={folder.id}>
                <div
                  className="prog-card"
                  style={{ borderLeft: "3px solid var(--accent)" }}
                  onClick={() => handleFolderTap(folder)}
                >
                  <div className="prog-icon">{folder.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="prog-name">{folder.label}</div>
                    <div className="prog-sub">{folder.subtitle}</div>
                  </div>
                  <div className="prog-arrow" style={{ fontSize: 18 }}>
                    {folder.programs.length > 1 ? (openFolder === folder.id ? "⌄" : "›") : "›"}
                  </div>
                </div>
              </div>
            ))}

            <div className="section-label">Cardio</div>
            <div className="prog-card cardio-card" onClick={onCardio}>
              <div className="prog-icon">🏃</div>
              <div style={{ flex: 1 }}>
                <div className="prog-name">Cardio Session</div>
                <div className="prog-sub">Walk, Run, Bike, Elliptical, Swim</div>
              </div>
              <div className="prog-arrow">›</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── WORKOUT ───────────────────────────────────────────────────────────────────
function WorkoutScreen({ workout, setWorkout, getLastSetWeight, mySets, theme, onFinish, onBack }) {
  const [showAddEx, setShowAddEx] = useState(false);
  const [showCardioSheet, setShowCardioSheet] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [timer, setTimer] = useState(elapsed(workout.startTime));

  // For custom programs, open exercise picker immediately
  const isCustom = workout.program.isCustom;
  const [showCustomPicker, setShowCustomPicker] = useState(isCustom && workout.exercises.length === 0);

  useEffect(() => {
    const iv = setInterval(() => setTimer(elapsed(workout.startTime)), 30000);
    return () => clearInterval(iv);
  }, [workout.startTime]);

  const toggleExercise = (name) => {
    setWorkout(w => ({ ...w, activeExercise: w.activeExercise === name ? null : name }));
  };

  const logSet = (exName, weight, reps, isBodyweight) => {
    setWorkout(w => ({
      ...w,
      sets: {
        ...w.sets,
        [exName]: [...(w.sets[exName] || []), { weight: Number(weight), reps: Number(reps), isBodyweight: !!isBodyweight }],
      },
    }));
  };

  const deleteSet = (exName, idx) => {
    setWorkout(w => ({
      ...w,
      sets: { ...w.sets, [exName]: w.sets[exName].filter((_, i) => i !== idx) },
    }));
  };

  const addExercise = (name) => {
    if (!name.trim() || workout.exercises.includes(name.trim())) return;
    setWorkout(w => ({ ...w, exercises: [...w.exercises, name.trim()] }));
  };

  const removeCardioFinisher = () => {
    setWorkout(w => ({ ...w, cardioFinisher: null }));
  };

  const totalSets = Object.values(workout.sets).flat().length;

  const handleBack = () => {
    // If sets have been logged, confirm before leaving
    if (totalSets > 0) {
      setShowLeaveConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="header">
        <button className="header-back" onClick={handleBack}>✕</button>
        <div style={{ flex: 1 }}>
          <div className="header-title">{workout.program.name}</div>
          <div className="header-sub">{timer} · {totalSets} sets logged</div>
        </div>
      </div>

      <div className="screen-scroll" style={{ flex: 1, overflowY: "auto" }}>
        {workout.exercises.length === 0 && (
          <div className="empty-state" style={{ padding: "32px 0" }}>
            <div className="empty-icon">✏️</div>
            <div className="empty-text">Tap "Add exercise" to build your workout</div>
          </div>
        )}

        {workout.exercises.map(exName => {
          const isActive = workout.activeExercise === exName;
          const loggedSets = workout.sets[exName] || [];
          const progEx = workout.program.exercises.find(e => e.name === exName);
          return (
            <ExerciseItem
              key={exName}
              name={exName}
              isActive={isActive}
              loggedSets={loggedSets}
              guide={progEx?.guide}
              optional={progEx?.optional}
              lastWeight={getLastSetWeight(exName)}
              lastSessionSets={mySets.filter(s => s.exercise === exName).slice(-10)}
              restTimerSecs={workout.restTimerSecs || 90}
              onToggle={() => toggleExercise(exName)}
              onLog={(w, r, bw) => logSet(exName, w, r, bw)}
              onDelete={(i) => deleteSet(exName, i)}
            />
          );
        })}

        {/* Cardio finisher block */}
        {workout.cardioFinisher && (
          <div className="cardio-block">
            <div className="cardio-block-icon">{CARDIO_ICONS[workout.cardioFinisher.type] || "🏃"}</div>
            <div className="cardio-block-info">
              <div>{workout.cardioFinisher.type}</div>
              <div className="cardio-block-sub">{workout.cardioFinisher.duration} min · finisher</div>
            </div>
            <div className="cardio-block-del" onClick={removeCardioFinisher}>×</div>
          </div>
        )}

        <button className="add-exercise-btn" onClick={() => setShowAddEx(true)}>
          + Add exercise
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          {!workout.exercises.includes("Core") && (
            <button
              className="add-exercise-btn"
              style={{ flex: 1, marginBottom: 10, borderColor: "#ccc" }}
              onClick={() => addExercise("Core")}
            >
              🧱 Add core
            </button>
          )}
          {!workout.cardioFinisher && (
            <button
              className="add-cardio-btn"
              style={{ flex: 1, marginTop: 0 }}
              onClick={() => setShowCardioSheet(true)}
            >
              🏃 Add cardio
            </button>
          )}
        </div>
      </div>

      <div className="finish-bar">
        <button className="btn btn-green" onClick={() => setShowFinishConfirm(true)}>{theme ? theme.finishLabel : "Finish Workout 🏁"}</button>
      </div>

      {/* Leave confirmation */}
      {showLeaveConfirm && (
        <ConfirmDialog
          icon="⚠️"
          title="Leave workout?"
          body={`You've logged ${totalSets} set${totalSets !== 1 ? "s" : ""}. If you leave now, your progress will be lost.`}
          confirmLabel="Leave anyway"
          cancelLabel="Keep going"
          danger
          onConfirm={() => { setShowLeaveConfirm(false); onBack(); }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}

      {/* Finish confirmation */}
      {showFinishConfirm && (
        <ConfirmDialog
          icon="🏁"
          title="Finish workout?"
          body={`${totalSets} set${totalSets !== 1 ? "s" : ""} logged across ${workout.exercises.length} exercise${workout.exercises.length !== 1 ? "s" : ""}. Ready to wrap up?`}
          confirmLabel="Yes, finish! 💪"
          cancelLabel="Not yet"
          onConfirm={() => { setShowFinishConfirm(false); onFinish(); }}
          onCancel={() => setShowFinishConfirm(false)}
        />
      )}

      {/* Add exercise modal with dropdown */}
      {(showAddEx || (showCustomPicker)) && (
        <ExercisePickerModal
          existingExercises={workout.exercises}
          onAdd={(name) => { addExercise(name); }}
          onClose={() => { setShowAddEx(false); setShowCustomPicker(false); }}
        />
      )}

      {/* Mid-workout cardio finisher sheet */}
      {showCardioSheet && (
        <CardioFinisherSheet
          onClose={() => setShowCardioSheet(false)}
          onLog={(entry) => {
            setWorkout(w => ({ ...w, cardioFinisher: entry }));
            setShowCardioSheet(false);
          }}
        />
      )}
    </div>
  );
}

// ── EXERCISE PICKER MODAL ─────────────────────────────────────────────────────
function ExercisePickerModal({ existingExercises, onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");

  const filtered = ALL_EXERCISES.filter(e =>
    e.toLowerCase().includes(search.toLowerCase()) &&
    !existingExercises.includes(e)
  );

  const handlePick = (name) => {
    onAdd(name);
    setSearch("");
    // Keep open so user can add more
  };

  const handleCustomAdd = () => {
    const name = customName.trim() || search.trim();
    if (!name) return;
    onAdd(name);
    setSearch("");
    setCustomName("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add Exercise</div>
        <input
          className="modal-input"
          placeholder="Search or type new…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCustomAdd()}
          autoFocus
        />
        {/* Show "add custom" row when search has text not in list */}
        {search.trim() && !ALL_EXERCISES.map(e => e.toLowerCase()).includes(search.trim().toLowerCase()) && (
          <div
            className="ex-pick-item"
            style={{ border: "1px dashed var(--accent)", color: "var(--accent)", background: "var(--accent-light)", marginBottom: 8 }}
            onClick={handleCustomAdd}
          >
            + Add "{search.trim()}"
          </div>
        )}
        <div className="ex-pick-list">
          {filtered.slice(0, 30).map(name => (
            <div key={name} className="ex-pick-item" onClick={() => handlePick(name)}>{name}</div>
          ))}
          {filtered.length === 0 && !search && (
            <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
              All library exercises already added
            </div>
          )}
        </div>
        <button className="btn btn-secondary" style={{ width: "100%", marginTop: 4 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── CARDIO FINISHER SHEET ─────────────────────────────────────────────────────
function CardioFinisherSheet({ onClose, onLog }) {
  const [type, setType] = useState(null);
  const [duration, setDuration] = useState(null);
  const [custom, setCustom] = useState("");

  const canLog = type && (duration || (custom && Number(custom) >= 1));
  const finalDuration = duration || Number(custom);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add Cardio Finisher</div>

        <div style={{ marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>Type</div>
        <div className="cardio-grid" style={{ marginBottom: 16 }}>
          {CARDIO_TYPES.map(t => (
            <div key={t} className={`cardio-type-btn ${type === t ? "selected" : ""}`} onClick={() => setType(t)}>
              <div className="cardio-type-icon">{CARDIO_ICONS[t]}</div>
              {t}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 8, fontSize: 13, color: "var(--muted)" }}>Duration</div>
        <div className="duration-grid" style={{ marginBottom: 20 }}>
          {CARDIO_DURATIONS.map(d => (
            <button key={d} className={`duration-btn ${duration === d ? "selected" : ""}`}
              onClick={() => { setDuration(d); setCustom(""); }}>
              {d}m
            </button>
          ))}
          <input
            className="duration-btn"
            style={{ width: 70, textAlign: "center", border: custom ? "2px solid var(--green)" : undefined }}
            type="number"
            inputMode="numeric"
            placeholder="other"
            value={custom}
            onChange={e => { setCustom(e.target.value); setDuration(null); }}
          />
        </div>

        <button
          className="btn btn-green"
          disabled={!canLog}
          style={{ opacity: canLog ? 1 : 0.4, marginBottom: 10 }}
          onClick={() => onLog({ type, duration: finalDuration })}
        >
          Add to Workout
        </button>
        <button className="btn btn-ghost" style={{ width: "100%" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ── REST TIMER HOOK ───────────────────────────────────────────────────────────
function useRestTimer(seconds) {
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const start = () => {
    setRemaining(seconds);
    setRunning(true);
  };

  useEffect(() => {
    if (running && remaining !== null) {
      if (remaining <= 0) {
        setRunning(false);
        setRemaining(null);
        return;
      }
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { setRunning(false); clearInterval(intervalRef.current); return 0; }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { clearInterval(intervalRef.current); setRunning(false); setRemaining(null); };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { remaining, running, done: remaining === 0, start, reset, fmt };
}

// ── EXERCISE ITEM ─────────────────────────────────────────────────────────────
function ExerciseItem({ name, isActive, loggedSets, guide, optional, lastWeight, lastSessionSets, restTimerSecs, onToggle, onLog, onDelete }) {
  const isBodyweightEx = BODYWEIGHT_EXERCISES.includes(name);
  const isTimerEx = TIMER_EXERCISES.includes(name);
  const isRepsOnly = REPS_ONLY_EXERCISES.includes(name);
  const showWeight = !isBodyweightEx && !isTimerEx && !isRepsOnly;
  const [useBodyweight, setUseBodyweight] = useState(false);
  const [weight, setWeight] = useState(lastWeight !== "" ? String(lastWeight) : "");
  const [reps, setReps] = useState("");
  const [seconds, setSeconds] = useState("");
  const repsRef = useRef(null);
  const restTimer = useRestTimer(restTimerSecs || 90);

  useEffect(() => {
    if (loggedSets.length > 0) {
      const last = loggedSets[loggedSets.length - 1];
      if (!last.isBodyweight && last.weight) setWeight(String(last.weight));
      setUseBodyweight(!!last.isBodyweight);
    }
  }, [loggedSets.length]);

  const handleLog = () => {
    if (isTimerEx) {
      if (!seconds) return;
      onLog(0, Number(seconds), false);
      setSeconds("");
      restTimer.start();
    } else {
      if (!reps) return;
      const w = useBodyweight ? 0 : (weight || 0);
      onLog(w, reps, useBodyweight);
      setReps("");
      repsRef.current?.focus();
      restTimer.start();
    }
  };

  const lastSets = lastSessionSets.slice(-5);

  const setDisplay = (s) => {
    if (isTimerEx) return `${s.reps}s hold`;
    if (isRepsOnly) return `${s.reps} reps`;
    if (s.isBodyweight) return `BW × ${s.reps} reps`;
    return `${s.weight} lbs × ${s.reps} reps`;
  };

  const isResting = restTimer.running;
  const restDone = restTimer.done;

  return (
    <div className={`ex-item ${isActive ? "active" : ""}`}>
      <div className="ex-header" onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="ex-name">{name}</div>
            {optional && <span className="ex-optional">optional</span>}
            {isTimerEx && <span style={{ fontSize: 11, background: "var(--accent-light)", color: "var(--accent)", borderRadius: 99, padding: "2px 6px", fontWeight: 700 }}>⏱ timer</span>}
          </div>
          {guide && <div className="ex-guide">{guide}</div>}
        </div>
        {loggedSets.length > 0 && <div className="ex-sets-count">{loggedSets.length}</div>}
        {isResting && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginLeft: 8 }}>⏱ {restTimer.fmt(restTimer.remaining)}</div>}
        <div style={{ marginLeft: 8, color: "var(--muted)", transform: isActive ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>⌄</div>
      </div>

      {isActive && (
        <div className="ex-body" style={{ position: "relative" }}>
          {lastSets.length > 0 && (
            <div className="last-session">
              <span style={{ alignSelf: "center" }}>Last:</span>
              {lastSets.map((s, i) => (
                <span key={i} className="last-tag">
                  {isTimerEx ? `${s.reps}s` : isRepsOnly ? `${s.reps}r` : s.isBodyweight ? `BW×${s.reps}` : `${s.weight}×${s.reps}`}
                </span>
              ))}
            </div>
          )}

          {/* BLOCKING REST TIMER OVERLAY — covers input area while resting */}
          {isResting && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(var(--bg-rgb, 247,245,242), 0.96)",
              backdropFilter: "blur(2px)",
              borderRadius: 8,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 10, zIndex: 10, padding: 20,
            }}>
              <div style={{ fontSize: 48, lineHeight: 1 }}>⏱</div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 52, color: "var(--accent)", lineHeight: 1 }}>
                {restTimer.fmt(restTimer.remaining)}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Resting...</div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 8, padding: "10px 24px" }}
                onClick={restTimer.reset}
              >
                Skip Rest
              </button>
            </div>
          )}

          {/* DONE banner */}
          {restDone && (
            <div
              className="rest-timer-bar"
              style={{ background: "var(--green-light)", borderColor: "var(--green)", marginBottom: 10, cursor: "pointer" }}
              onClick={restTimer.reset}
            >
              <div style={{ fontSize: 18 }}>✅</div>
              <div style={{ flex: 1, fontSize: 13, color: "var(--green)", fontWeight: 700 }}>Rest done — go again!</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>tap to clear</div>
            </div>
          )}

          {isTimerEx ? (
            <>
              <div style={{ marginBottom: 8, fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Hold time (seconds)</div>
              <div className="timer-preset-row">
                {[20, 30, 45, 60, 90].map(s => (
                  <button key={s} className="timer-preset-btn" onClick={() => setSeconds(String(s))}>{s}s</button>
                ))}
              </div>
              <div className="timer-ex-row">
                <div className="log-field">
                  <input
                    className="timer-ex-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="sec"
                    value={seconds}
                    onChange={e => setSeconds(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLog()}
                  />
                  <div className="log-label">Seconds</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {isBodyweightEx && (
                <label className="bw-toggle">
                  <input
                    type="checkbox"
                    checked={useBodyweight}
                    onChange={e => setUseBodyweight(e.target.checked)}
                  />
                  <span>Bodyweight only (no added weight)</span>
                </label>
              )}
              <div className="log-row">
                {(showWeight || (isBodyweightEx && !useBodyweight)) && (
                  <div className="log-field">
                    <input
                      className="log-input"
                      type="number"
                      inputMode="decimal"
                      placeholder="lbs"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && repsRef.current?.focus()}
                    />
                    <div className="log-label">Weight</div>
                  </div>
                )}
                <div className="log-field">
                  <input
                    className="log-input"
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    ref={repsRef}
                    onKeyDown={e => e.key === "Enter" && handleLog()}
                  />
                  <div className="log-label">Reps</div>
                </div>
              </div>
            </>
          )}

          <button className="log-btn" onClick={handleLog}>Log Set</button>

          {loggedSets.length > 0 && (
            <div className="logged-sets">
              {loggedSets.map((s, i) => (
                <div key={i} className="logged-set">
                  <div className="set-num">{i + 1}</div>
                  <div className="set-detail">{setDisplay(s)}</div>
                  <div className="set-del" onClick={() => onDelete(i)}>×</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SUMMARY ───────────────────────────────────────────────────────────────────
function SummaryScreen({ data, user, theme, onDone }) {
  if (data.cardio) {
    const c = data.cardio;
    return (
      <div className="screen">
        <div className="summary-hero">
          <div className="summary-icon">{CARDIO_ICONS[c.type] || "🏃"}</div>
          <div className="summary-title">{theme ? theme.summaryTitle : "Nice work!"}</div>
          <div className="summary-prog">{c.type}</div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{c.duration}</div>
            <div className="stat-label">Minutes</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">🔥</div>
            <div className="stat-label">Streak updated</div>
          </div>
        </div>
        <div style={{ padding: "0 20px" }}>
          <button className="btn btn-primary" onClick={onDone}>Done</button>
        </div>
      </div>
    );
  }

  const { session, lastSession } = data;
  const volDiff = lastSession ? session.totalVol - lastSession.totalVol : null;
  const setsDiff = lastSession ? session.totalSets - lastSession.totalSets : null;

  return (
    <div className="screen">
      <div className="summary-hero">
        <div className="summary-icon">💪</div>
        <div className="summary-title">{theme ? theme.summaryTitle : "Workout done!"}</div>
        <div className="summary-prog">{session.program} · {fmtDate(session.date)}</div>
        {session.cardioFinisher && (
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
            {CARDIO_ICONS[session.cardioFinisher.type]} {session.cardioFinisher.type} finisher · {session.cardioFinisher.duration}m
          </div>
        )}
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-val">{session.duration}m</div>
          <div className="stat-label">Duration</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{session.totalSets}</div>
          <div className="stat-label">Sets</div>
          {setsDiff !== null && setsDiff !== 0 && (
            <div className="stat-diff">{setsDiff > 0 ? "+" : ""}{setsDiff} vs last</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-val">{session.totalReps}</div>
          <div className="stat-label">Total Reps</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{session.totalVol >= 1000 ? (session.totalVol / 1000).toFixed(1) + "k" : session.totalVol}</div>
          <div className="stat-label">Volume (lbs)</div>
          {volDiff !== null && volDiff !== 0 && (
            <div className="stat-diff" style={{ color: volDiff > 0 ? "var(--green)" : "var(--accent)" }}>
              {volDiff > 0 ? "+" : ""}{Math.abs(volDiff) >= 1000 ? (volDiff / 1000).toFixed(1) + "k" : volDiff} vs last
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        <button className="btn btn-primary" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}


// ── STATS SCREEN ──────────────────────────────────────────────────────────────
function StatsScreen({ sessions, strengthSets, user, onBack }) {
  const [tab, setTab] = useState("overview");
  const [selectedEx, setSelectedEx] = useState(null);

  const mySessions = sessions.filter(s => s.user === user);
  const mySets = strengthSets.filter(s => s.user === user);

  // ── Overview ──
  const totalWorkouts = mySessions.length;
  const totalVol = mySets.reduce((a, s) => a + (!s.isBodyweight ? (s.weight || 0) * (s.reps || 0) : 0), 0);
  const totalSets = mySets.length;
  const totalReps = mySets.reduce((a, s) => a + (s.reps || 0), 0);

  // Volume by week (last 8 weeks)
  const weekVol = (() => {
    const weeks = {};
    mySets.forEach(s => {
      if (s.isBodyweight || !s.weight) return;
      const d = new Date(s.date);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toISOString().split("T")[0];
      weeks[key] = (weeks[key] || 0) + (s.weight * s.reps);
    });
    return Object.entries(weeks).sort(([a], [b]) => a > b ? 1 : -1).slice(-8);
  })();

  // ── PRs: best set weight per exercise ──
  const prs = (() => {
    const bests = {};
    mySets.forEach(s => {
      if (s.isBodyweight || !s.weight) return;
      if (!bests[s.exercise] || s.weight > bests[s.exercise].weight) {
        bests[s.exercise] = { weight: s.weight, reps: s.reps, date: s.date };
      }
    });
    return Object.entries(bests).sort(([, a], [, b]) => b.weight - a.weight);
  })();

  // ── Per-exercise history ──
  const exerciseList = [...new Set(mySets.map(s => s.exercise))].sort();
  const exHistory = selectedEx
    ? mySets.filter(s => s.exercise === selectedEx && !s.isBodyweight && s.weight)
        .reduce((acc, s) => {
          const last = acc[acc.length - 1];
          if (last && last.date === s.date) {
            if (s.weight > last.maxWeight) last.maxWeight = s.weight;
            last.totalVol += s.weight * s.reps;
          } else {
            acc.push({ date: s.date, maxWeight: s.weight, totalVol: s.weight * s.reps });
          }
          return acc;
        }, []).slice(-10)
    : [];

  const maxW = exHistory.length ? Math.max(...exHistory.map(p => p.maxWeight)) : 0;
  const minW = exHistory.length ? Math.min(...exHistory.map(p => p.maxWeight)) : 0;
  const chartH = 80;

  const fmtVol = (v) => v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v);

  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div>
          <div className="header-title">Stats</div>
          <div className="header-sub">{user}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg)", padding: "0 16px" }}>
        {[["overview","Overview"],["progress","Progress"],["prs","PRs"]].map(([id, label]) => (
          <div
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              color: tab === id ? "var(--accent)" : "var(--muted)",
              borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >{label}</div>
        ))}
      </div>

      <div className="screen-scroll">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div className="stats-grid" style={{ marginTop: 16 }}>
              <div className="stat-card">
                <div className="stat-val">{totalWorkouts}</div>
                <div className="stat-label">Workouts</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{fmtVol(totalVol)}</div>
                <div className="stat-label">Total Volume</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{totalSets}</div>
                <div className="stat-label">Total Sets</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{totalReps}</div>
                <div className="stat-label">Total Reps</div>
              </div>
            </div>

            {weekVol.length > 1 && (
              <div className="card" style={{ marginTop: 8 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Weekly Volume</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: chartH + 24 }}>
                  {weekVol.map(([week, vol], i) => {
                    const maxV = Math.max(...weekVol.map(([,v]) => v));
                    const h = maxV ? Math.max(8, Math.round((vol / maxV) * chartH)) : 8;
                    const isLast = i === weekVol.length - 1;
                    return (
                      <div key={week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600 }}>{fmtVol(vol)}</div>
                        <div style={{ width: "100%", height: h, background: isLast ? "var(--accent)" : "var(--accent-light)", borderRadius: 4 }} />
                        <div style={{ fontSize: 9, color: "var(--muted)" }}>{new Date(week).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mySessions.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-text">Log some workouts to see your stats</div>
              </div>
            )}
          </>
        )}

        {/* ── PROGRESS (per-exercise chart) ── */}
        {tab === "progress" && (
          <>
            <div className="section-label" style={{ marginTop: 16 }}>Choose Exercise</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {exerciseList.map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedEx(ex)}
                  style={{
                    padding: "7px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: selectedEx === ex ? "var(--accent)" : "var(--surface)",
                    color: selectedEx === ex ? "white" : "var(--text)",
                    border: selectedEx === ex ? "none" : "1px solid var(--border)",
                  }}
                >{ex}</button>
              ))}
            </div>

            {selectedEx && exHistory.length > 0 && (
              <div className="card">
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{selectedEx}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Max weight per session</div>
                {/* Line chart */}
                <svg width="100%" height="100" viewBox={`0 0 ${exHistory.length * 40} 100`} style={{ overflow: "visible" }}>
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    points={exHistory.map((p, i) => {
                      const x = i * 40 + 20;
                      const y = maxW === minW ? 50 : 90 - ((p.maxWeight - minW) / (maxW - minW)) * 70;
                      return `${x},${y}`;
                    }).join(" ")}
                  />
                  {exHistory.map((p, i) => {
                    const x = i * 40 + 20;
                    const y = maxW === minW ? 50 : 90 - ((p.maxWeight - minW) / (maxW - minW)) * 70;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="var(--accent)" />
                        <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="var(--muted)">{p.maxWeight}</text>
                        <text x={x} y="100" textAnchor="middle" fontSize="8" fill="var(--muted)">{new Date(p.date).toLocaleDateString("en-US",{month:"numeric",day:"numeric"})}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {selectedEx && exHistory.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <div className="empty-text">No weighted sets logged for {selectedEx} yet</div>
              </div>
            )}

            {!selectedEx && (
              <div className="empty-state">
                <div className="empty-icon">👆</div>
                <div className="empty-text">Pick an exercise above to see your progress</div>
              </div>
            )}
          </>
        )}

        {/* ── PRs ── */}
        {tab === "prs" && (
          <>
            <div className="section-label" style={{ marginTop: 16 }}>Personal Records</div>
            {prs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏆</div>
                <div className="empty-text">No PRs yet — go lift some weights!</div>
              </div>
            ) : prs.map(([ex, pr]) => (
              <div key={ex} className="card" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 24 }}>🏆</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ex}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{fmtDate(pr.date)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, color: "var(--accent)" }}>{pr.weight} lbs</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{pr.reps} reps</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── CARDIO (standalone) ────────────────────────────────────────────────────────
function CardioScreen({ user, onBack, onLog }) {
  const [type, setType] = useState(null);
  const [duration, setDuration] = useState(null);
  const [custom, setCustom] = useState("");

  const canLog = type && (duration || (custom && Number(custom) >= 1));
  const finalDuration = duration || Number(custom);

  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div className="header-title">Cardio</div>
      </div>
      <div className="screen-scroll">
        <div className="section-label" style={{ marginTop: 8 }}>Type</div>
        <div className="cardio-grid">
          {CARDIO_TYPES.map(t => (
            <div key={t} className={`cardio-type-btn ${type === t ? "selected" : ""}`} onClick={() => setType(t)}>
              <div className="cardio-type-icon">{CARDIO_ICONS[t]}</div>
              {t}
            </div>
          ))}
        </div>
        <div className="section-label">Duration</div>
        <div className="duration-grid">
          {CARDIO_DURATIONS.map(d => (
            <button key={d} className={`duration-btn ${duration === d ? "selected" : ""}`}
              onClick={() => { setDuration(d); setCustom(""); }}>
              {d}m
            </button>
          ))}
          <input
            className="duration-btn"
            style={{ width: 70, textAlign: "center", border: custom ? "2px solid var(--green)" : undefined }}
            type="number"
            inputMode="numeric"
            placeholder="other"
            value={custom}
            onChange={e => { setCustom(e.target.value); setDuration(null); }}
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <button
            className="btn btn-green"
            disabled={!canLog}
            style={{ opacity: canLog ? 1 : 0.4 }}
            onClick={() => onLog({ type, duration: finalDuration })}
          >
            Log Cardio
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
const USER_COLORS = {
  Cullen: { bg: "#FFF0EA", color: "#E8500A", border: "#ffc9b0" },
  Lauren: { bg: "#EAF4EF", color: "#2D6A4F", border: "#b7ddc9" },
};

function HistoryScreen({ allSessions, allCardio, onBack, onDetail }) {
  const all = [
    ...allSessions.map(s => ({ ...s, _type: "strength" })),
    ...allCardio.map(c => ({ ...c, _type: "cardio" })),
  ].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div>
          <div className="header-title">History</div>
          <div className="header-sub">Cullen &amp; Lauren</div>
        </div>
      </div>
      <div className="screen-scroll">
        {all.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No workouts logged yet</div>
          </div>
        ) : all.map((item, i) => {
          const uc = USER_COLORS[item.user] || USER_COLORS.Cullen;
          return item._type === "strength" ? (
            <div key={i} className="hist-item" onClick={() => onDetail(item)}>
              <div className="hist-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: uc.bg, border: `1.5px solid ${uc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: uc.color, flexShrink: 0 }}>
                    {item.user ? item.user[0] : "?"}
                  </div>
                  <div className="hist-name">{item.program}</div>
                </div>
                <span className="badge badge-orange">Strength</span>
              </div>
              <div className="hist-date">{fmtDate(item.date)}</div>
              <div className="hist-meta" style={{ marginTop: 4 }}>
                {item.totalSets} sets · {item.totalReps} reps · {item.duration}m
                {item.cardioFinisher && ` · ${CARDIO_ICONS[item.cardioFinisher.type]} ${item.cardioFinisher.duration}m`}
              </div>
            </div>
          ) : (
            <div key={i} className="hist-item" style={{ cursor: "default" }}>
              <div className="hist-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: uc.bg, border: `1.5px solid ${uc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: uc.color, flexShrink: 0 }}>
                    {item.user ? item.user[0] : "?"}
                  </div>
                  <div className="hist-name">{CARDIO_ICONS[item.type]} {item.type}</div>
                </div>
                <span className="badge badge-green">Cardio</span>
              </div>
              <div className="hist-date">{fmtDate(item.date)}</div>
              <div className="hist-meta" style={{ marginTop: 4 }}>{item.duration} min</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HIST DETAIL ───────────────────────────────────────────────────────────────
function HistDetailScreen({ session, onBack, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editSets, setEditSets] = useState(session.sets ? JSON.parse(JSON.stringify(session.sets)) : {});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fmtSet = (s) => s.isBodyweight ? `BW × ${s.reps}` : `${s.weight} lbs × ${s.reps}`;

  const deleteSet = (ex, idx) => {
    setEditSets(prev => {
      const updated = { ...prev, [ex]: prev[ex].filter((_, i) => i !== idx) };
      if (updated[ex].length === 0) delete updated[ex];
      return updated;
    });
  };

  const updateSetField = (ex, idx, field, val) => {
    setEditSets(prev => ({
      ...prev,
      [ex]: prev[ex].map((s, i) => i === idx ? { ...s, [field]: field === "isBodyweight" ? val : Number(val) } : s),
    }));
  };

  const handleSave = () => {
    onUpdate({ ...session, sets: editSets });
    setEditing(false);
  };

  const allSets = Object.values(editSets).flat();
  const totalVol = allSets.reduce((a, s) => a + (!s.isBodyweight ? (s.weight || 0) * (s.reps || 0) : 0), 0);

  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div className="header-title">{session.program}</div>
          <div className="header-sub">{fmtDate(session.date)} · {session.duration}m</div>
        </div>
        {!editing && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "8px 14px", fontSize: 13 }}
              onClick={() => { setEditSets(JSON.parse(JSON.stringify(session.sets || {}))); setEditing(true); }}
            >
              ✏️ Edit
            </button>
            <button
              className="btn"
              style={{ padding: "8px 14px", fontSize: 13, background: "#FFF0EA", color: "var(--accent)", border: "1px solid #ffc9b0" }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️
            </button>
          </div>
        )}
        {editing && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>

      <div className="screen-scroll">
        {/* Stats summary */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{allSets.length}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Sets</div>
            </div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{allSets.reduce((a, s) => a + (s.reps || 0), 0)}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Reps</div>
            </div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>
                {totalVol >= 1000 ? (totalVol / 1000).toFixed(1) + "k" : totalVol}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Volume</div>
            </div>
          </div>
          {session.cardioFinisher && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--green-light)", borderRadius: 8, fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
              {CARDIO_ICONS[session.cardioFinisher.type]} {session.cardioFinisher.type} finisher · {session.cardioFinisher.duration} min
            </div>
          )}
        </div>

        {/* Exercise sets — view or edit mode */}
        {Object.entries(editing ? editSets : (session.sets || {})).map(([ex, sets]) => (
          <div key={ex} className="detail-exercise card">
            <div className="detail-ex-name">{ex}</div>
            {sets.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < sets.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div className="set-num">{i + 1}</div>
                {editing ? (
                  <>
                    {!s.isBodyweight && (
                      <input
                        type="number" inputMode="decimal"
                        value={s.weight}
                        onChange={e => updateSetField(ex, i, "weight", e.target.value)}
                        style={{ width: 64, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, textAlign: "center", background: "var(--bg)" }}
                      />
                    )}
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>×</span>
                    <input
                      type="number" inputMode="numeric"
                      value={s.reps}
                      onChange={e => updateSetField(ex, i, "reps", e.target.value)}
                      style={{ width: 52, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, textAlign: "center", background: "var(--bg)" }}
                    />
                    <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>{s.isBodyweight ? "BW" : "lbs"}</span>
                    <div style={{ color: "var(--accent)", cursor: "pointer", fontSize: 18, padding: "2px 4px" }} onClick={() => deleteSet(ex, i)}>×</div>
                  </>
                ) : (
                  <div className="detail-set" style={{ flex: 1, padding: 0 }}>{fmtSet(s)}</div>
                )}
              </div>
            ))}
            {sets.length === 0 && editing && (
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0", fontStyle: "italic" }}>No sets — exercise will be removed on save</div>
            )}
          </div>
        ))}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete workout?"
          body="This will permanently remove this session and all its sets from your history."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={() => onDelete(session.sessionId)}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}


// ── REST TIMER SELECT SCREEN ──────────────────────────────────────────────────
function RestTimerSelectScreen({ program, defaultSecs, user, onBack, onStart }) {
  const [selected, setSelected] = useState(defaultSecs || 90);

  const descs = { 60: "Quick compound lifts, high volume", 90: "Most people, most of the time", 120: "Heavy lifts, low reps" };

  return (
    <div className="screen rest-select-screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div>
          <div className="header-title">{program.name}</div>
          <div className="header-sub">Pick your rest timer</div>
        </div>
      </div>
      <div className="rest-hero">
        <div className="rest-hero-icon">⏱️</div>
        <div className="rest-hero-title">Rest Between Sets</div>
        <div className="rest-hero-sub">Your timer starts automatically after each logged set</div>
      </div>
      <div className="rest-options">
        {REST_TIMER_OPTIONS.map(opt => (
          <div
            key={opt.seconds}
            className={`rest-option-btn ${selected === opt.seconds ? "selected" : ""}`}
            onClick={() => setSelected(opt.seconds)}
          >
            <div className="rest-option-emoji">{opt.emoji}</div>
            <div style={{ flex: 1 }}>
              <div className="rest-option-label">{opt.label}</div>
              <div className="rest-option-desc">{descs[opt.seconds]}</div>
            </div>
            {selected === opt.seconds && <div style={{ fontSize: 20 }}>✓</div>}
          </div>
        ))}
      </div>
      <div className="rest-start-btn">
        <button className="btn btn-primary" onClick={() => onStart(selected)}>
          Start Workout →
        </button>
        {user === "Cullen" && (
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 10, color: "var(--muted)", fontSize: 14 }}
            onClick={() => onStart(null)}
          >
            Skip rest timer
          </button>
        )}
      </div>
    </div>
  );
}

// ── THEME MENU ────────────────────────────────────────────────────────────────
function ThemeMenu({ theme, onTheme, onClose, onSwitchUser }) {
  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-panel" onClick={e => e.stopPropagation()}>
        <div className="menu-title">⚙️ Settings</div>

        <div className="menu-section-label">Themes</div>
        {Object.entries(THEMES).map(([key, t]) => (
          <div
            key={key}
            className={`theme-btn ${theme === key ? "active" : ""}`}
            onClick={() => onTheme(key)}
          >
            <div className="theme-btn-emoji">{t.emoji}</div>
            <div>{t.name}</div>
            {theme === key && <div style={{ marginLeft: "auto", fontSize: 16 }}>✓</div>}
          </div>
        ))}

        <div className="menu-section-label" style={{ marginTop: 32 }}>Account</div>
        <button
          className="btn btn-secondary"
          style={{ width: "100%", marginBottom: 12, justifyContent: "flex-start", gap: 10 }}
          onClick={onSwitchUser}
        >
          👤 Switch User
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "flex-start" }}
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ tab, onTab }) {
  return (
    <div className="bottom-nav">
      {[
        { id: "home", icon: "🏠", label: "Home" },
        { id: "programs", icon: "💪", label: "Workout" },
        { id: "history", icon: "📋", label: "History" },
        { id: "stats", icon: "📊", label: "Stats" },
      ].map(n => (
        <div key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => onTab(n.id)}>
          <div className="nav-icon">{n.icon}</div>
          {n.label}
        </div>
      ))}
    </div>
  );
}
