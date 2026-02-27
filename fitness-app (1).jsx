import { useState, useEffect, useRef } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────
const PROGRAMS = {
  Cullen: [
    {
      id: "ppl-push",
      name: "PPL · Push",
      exercises: [
        { name: "Bench Press" },
        { name: "Incline Press" },
        { name: "Pec Fly" },
        { name: "OHP" },
        { name: "Lateral Raises" },
        { name: "Tricep Pushdown" },
        { name: "Dips" },
      ],
    },
    {
      id: "ppl-pull",
      name: "PPL · Pull",
      exercises: [
        { name: "Pull-ups" },
        { name: "Pulldown" },
        { name: "Barbell Row" },
        { name: "T-Bar Row" },
        { name: "Lat Row" },
        { name: "Rear Delt Fly" },
        { name: "Bicep Curl" },
      ],
    },
    {
      id: "ppl-legs",
      name: "PPL · Legs",
      exercises: [
        { name: "RDL" },
        { name: "Hack Squat" },
        { name: "Leg Press" },
        { name: "Ham Curl" },
        { name: "Leg Extension" },
      ],
    },
    {
      id: "upper-a",
      name: "Upper A",
      subtitle: "Horizontal emphasis",
      exercises: [
        { name: "Bench Press", guide: "3 sets · 4–8 reps" },
        { name: "Pull-ups", guide: "3 sets · 6–10 reps" },
        { name: "Barbell Row", guide: "2–3 sets" },
        { name: "Dips", guide: "3 sets" },
        { name: "Bicep Curl", guide: "2–3 sets", optional: false },
        { name: "Lateral Raises", guide: "2 sets", optional: true },
      ],
    },
    {
      id: "upper-b",
      name: "Upper B",
      subtitle: "Vertical emphasis",
      exercises: [
        { name: "OHP", guide: "3 sets" },
        { name: "Pull-ups", guide: "3 sets" },
        { name: "Incline Press", guide: "3 sets" },
        { name: "T-Bar Row", guide: "3 sets" },
        { name: "Tricep Pushdown", guide: "2–3 sets" },
        { name: "Bicep Curl", guide: "2–3 sets" },
      ],
    },
    {
      id: "lower",
      name: "Lower Day",
      exercises: [
        { name: "Hack Squat", guide: "3 sets" },
        { name: "RDL", guide: "3 sets" },
        { name: "Ham Curl", guide: "3 sets" },
        { name: "Leg Extension", guide: "3 sets" },
        { name: "Calves / Split Squat", guide: "1–2 sets", optional: true },
        { name: "Core", guide: "3 sets", optional: true },
      ],
    },
  ],
  Lauren: [
    {
      id: "lauren-fb1",
      name: "Full Body 1",
      exercises: [
        { name: "Goblet Squat" },
        { name: "RDL" },
        { name: "Chest Press" },
        { name: "Pulldown" },
      ],
    },
    {
      id: "lauren-fb2",
      name: "Full Body 2",
      exercises: [
        { name: "Deadlift" },
        { name: "Split Squat" },
        { name: "Shoulder Press" },
        { name: "Row" },
      ],
    },
  ],
};

const CARDIO_TYPES = ["Walk", "Run", "Bike", "Elliptical", "Swim"];
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
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const elapsed = (start) => {
  const s = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

function calcStreak(sessions, user) {
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
    else if (diff === 2 && streak > 0) { cursor = d; } // grace buffer
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

  html, body, #root { height: 100%; background: var(--bg); }

  body {
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
  }

  .app {
    max-width: 430px;
    margin: 0 auto;
    min-height: 100%;
    display: flex;
    flex-direction: column;
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

  /* HOME */
  .home-hero {
    padding: 32px 20px 24px;
  }
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
  .recent-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }
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
  .user-select-logo {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 8px;
    color: var(--accent);
  }
  .user-select-sub {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 48px;
  }
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
  .user-info-name {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
  }

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

  .cardio-card {
    background: var(--green-light);
    border-color: #b7ddc9;
  }
  .cardio-card .prog-icon { background: #d4eddf; }

  /* ACTIVE WORKOUT */
  .workout-timer {
    font-size: 12px;
    color: var(--muted);
    font-weight: 500;
  }
  .exercise-list { }
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

  .ex-body {
    padding: 0 16px 16px;
    border-top: 1px solid var(--border);
  }
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
  .log-row {
    display: flex; gap: 10px; align-items: flex-start;
    margin-bottom: 10px;
  }
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
  .log-label {
    font-size: 11px; color: var(--muted); text-align: center; margin-top: 4px;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  }
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

  .finish-bar {
    padding: 16px 20px;
    background: var(--bg);
    border-top: 1px solid var(--border);
    position: sticky;
    bottom: 0;
  }

  /* SUMMARY */
  .summary-hero {
    padding: 32px 20px 24px;
    text-align: center;
  }
  .summary-icon { font-size: 48px; margin-bottom: 16px; }
  .summary-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 28px;
    margin-bottom: 4px;
  }
  .summary-prog { font-size: 14px; color: var(--muted); }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 0 20px;
    margin-bottom: 16px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    text-align: center;
  }
  .stat-val {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--accent);
  }
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
  .cardio-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 10px; margin-bottom: 20px;
  }
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
    max-height: 70vh;
    overflow-y: auto;
  }
  .modal-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 16px;
  }
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

  .empty-state {
    text-align: center; padding: 48px 24px;
    color: var(--muted);
  }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }
  .empty-text { font-size: 14px; }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-orange { background: var(--accent-light); color: var(--accent); }
  .badge-green { background: var(--green-light); color: var(--green); }
`;

// ── ICONS ──────────────────────────────────────────────────────────────────────
const CARDIO_ICONS = { Walk: "🚶", Run: "🏃", Bike: "🚴", Elliptical: "⚡", Swim: "🏊" };
const PROG_ICONS = {
  "ppl-push": "💪", "ppl-pull": "🔃", "ppl-legs": "🦵",
  "upper-a": "📐", "upper-b": "⬆️", "lower": "🦿",
  "lauren-fb1": "⚡", "lauren-fb2": "🔥",
};

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [sessions, setSessions] = useState(() => load("sessions", []));
  const [strengthSets, setStrengthSets] = useState(() => load("strengthSets", []));
  const [cardioLogs, setCardioLogs] = useState(() => load("cardioLogs", []));
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home"); // home | programs | workout | summary | history | histDetail | cardio
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [histDetail, setHistDetail] = useState(null);
  const [tab, setTab] = useState("home");

  useEffect(() => { save("sessions", sessions); }, [sessions]);
  useEffect(() => { save("strengthSets", strengthSets); }, [strengthSets]);
  useEffect(() => { save("cardioLogs", cardioLogs); }, [cardioLogs]);

  const goHome = () => { setScreen("home"); setTab("home"); };
  const goHistory = () => { setScreen("history"); setTab("history"); };

  // User sets
  const mySets = strengthSets.filter(s => s.user === user);
  const mySessions = sessions.filter(s => s.user === user);
  const myCardio = cardioLogs.filter(c => c.user === user);

  // Recent workouts
  const recentSessions = mySessions.slice(-3).reverse();
  const streak = calcStreak([...sessions, ...cardioLogs.map(c => ({ ...c, type: "cardio" }))], user);

  const startWorkout = (prog) => {
    const sid = `s${Date.now()}`;
    setActiveWorkout({
      sessionId: sid,
      program: prog,
      startTime: Date.now(),
      sets: {}, // exerciseName -> [{weight, reps}]
      activeExercise: null,
      exercises: prog.exercises.map(e => e.name),
    });
    setScreen("workout");
  };

  const finishWorkout = () => {
    const w = activeWorkout;
    const end = Date.now();
    const duration = Math.round((end - w.startTime) / 60000);
    const allSets = Object.values(w.sets).flat();
    const totalSets = allSets.length;
    const totalReps = allSets.reduce((a, s) => a + s.reps, 0);
    const totalVol = allSets.reduce((a, s) => a + s.weight * s.reps, 0);

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
    };

    const newSets = [];
    for (const [ex, sets] of Object.entries(w.sets)) {
      sets.forEach(s => newSets.push({ user, sessionId: w.sessionId, date: today(), program: w.program.name, exercise: ex, weight: s.weight, reps: s.reps }));
    }

    // Compare to last session of same program
    const lastSameSession = [...mySessions].reverse().find(s => s.programId === w.program.id);
    setSessions(prev => [...prev, newSession]);
    setStrengthSets(prev => [...prev, ...newSets]);
    setSummaryData({ session: newSession, lastSession: lastSameSession });
    setActiveWorkout(null);
    setScreen("summary");
  };

  // Last sets per exercise (for auto-fill reference)
  const getLastSetWeight = (exerciseName) => {
    const exSets = mySets.filter(s => s.exercise === exerciseName);
    if (!exSets.length) return "";
    return exSets[exSets.length - 1].weight;
  };

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
            onSwitchUser={() => setUser(null)}
            onStartPrograms={() => { setScreen("programs"); setTab("programs"); }}
            onViewHistory={() => goHistory()}
            onViewDetail={(s) => { setHistDetail(s); setScreen("histDetail"); }}
          />
        )}
        {screen === "programs" && (
          <ProgramsScreen
            user={user}
            programs={PROGRAMS[user]}
            onBack={goHome}
            onStart={startWorkout}
            onCardio={() => setScreen("cardio")}
          />
        )}
        {screen === "workout" && activeWorkout && (
          <WorkoutScreen
            workout={activeWorkout}
            setWorkout={setActiveWorkout}
            getLastSetWeight={getLastSetWeight}
            mySets={mySets}
            onFinish={finishWorkout}
            onBack={() => { setActiveWorkout(null); setScreen("programs"); }}
          />
        )}
        {screen === "summary" && summaryData && (
          <SummaryScreen
            data={summaryData}
            user={user}
            onDone={goHome}
          />
        )}
        {screen === "history" && (
          <HistoryScreen
            sessions={mySessions}
            cardio={myCardio}
            onBack={goHome}
            onDetail={(s) => { setHistDetail(s); setScreen("histDetail"); }}
          />
        )}
        {screen === "histDetail" && histDetail && (
          <HistDetailScreen
            session={histDetail}
            onBack={() => setScreen("history")}
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
        {screen !== "workout" && screen !== "summary" && screen !== "histDetail" && (
          <BottomNav tab={tab} onTab={(t) => {
            setTab(t);
            if (t === "home") goHome();
            if (t === "programs") { setScreen("programs"); }
            if (t === "history") goHistory();
          }} />
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
      <div className="user-select-sub">Who's training today?</div>
      {["Cullen", "Lauren"].map(u => (
        <button key={u} className="user-btn" onClick={() => onSelect(u)}>
          <div className="user-avatar">{u[0]}</div>
          <div>
            <div className="user-info-name">{u}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ user, streak, recentSessions, onSwitchUser, onStartPrograms, onViewHistory, onViewDetail }) {
  return (
    <div className="screen">
      <div className="screen-scroll">
        <div className="home-hero">
          <div className="home-greeting">Good {getTimeOfDay()}</div>
          <div className="home-name">{user}</div>
          {streak > 0
            ? <div className="streak-pill">🔥 {streak}-day streak</div>
            : <div className="streak-pill" style={{ background: "#f5f5f5", color: "#999" }}>Start your streak</div>
          }
        </div>

        <div style={{ padding: "0 20px" }}>
          <button className="btn btn-primary" onClick={onStartPrograms}>
            Start Workout
          </button>

          <div className="section-label">Recent</div>
          {recentSessions.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div className="empty-icon">🏋️</div>
              <div className="empty-text">No workouts yet. Let's go!</div>
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
function ProgramsScreen({ user, programs, onBack, onStart, onCardio }) {
  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div>
          <div className="header-title">Programs</div>
          <div className="header-sub">{user}</div>
        </div>
      </div>
      <div className="screen-scroll">
        <div className="section-label" style={{ marginTop: 8 }}>Strength</div>
        {programs.map(p => (
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
    </div>
  );
}

// ── WORKOUT ───────────────────────────────────────────────────────────────────
function WorkoutScreen({ workout, setWorkout, getLastSetWeight, mySets, onFinish, onBack }) {
  const [showAddEx, setShowAddEx] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [timer, setTimer] = useState(elapsed(workout.startTime));

  useEffect(() => {
    const iv = setInterval(() => setTimer(elapsed(workout.startTime)), 30000);
    return () => clearInterval(iv);
  }, [workout.startTime]);

  const toggleExercise = (name) => {
    setWorkout(w => ({
      ...w,
      activeExercise: w.activeExercise === name ? null : name,
    }));
  };

  const logSet = (exName, weight, reps) => {
    setWorkout(w => ({
      ...w,
      sets: {
        ...w.sets,
        [exName]: [...(w.sets[exName] || []), { weight: Number(weight), reps: Number(reps) }],
      },
    }));
  };

  const deleteSet = (exName, idx) => {
    setWorkout(w => ({
      ...w,
      sets: {
        ...w.sets,
        [exName]: w.sets[exName].filter((_, i) => i !== idx),
      },
    }));
  };

  const addExercise = () => {
    if (!newExName.trim()) return;
    setWorkout(w => ({ ...w, exercises: [...w.exercises, newExName.trim()] }));
    setNewExName("");
    setShowAddEx(false);
  };

  const totalSets = Object.values(workout.sets).flat().length;

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="header">
        <button className="header-back" onClick={onBack}>✕</button>
        <div style={{ flex: 1 }}>
          <div className="header-title">{workout.program.name}</div>
          <div className="header-sub">{timer} · {totalSets} sets logged</div>
        </div>
      </div>
      <div className="screen-scroll" style={{ flex: 1, overflowY: "auto" }}>
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
              onToggle={() => toggleExercise(exName)}
              onLog={(w, r) => logSet(exName, w, r)}
              onDelete={(i) => deleteSet(exName, i)}
            />
          );
        })}
        <button className="add-exercise-btn" onClick={() => setShowAddEx(true)}>
          + Add exercise
        </button>
      </div>
      <div className="finish-bar">
        <button className="btn btn-green" onClick={onFinish}>
          Finish Workout
        </button>
      </div>
      {showAddEx && (
        <div className="modal-overlay" onClick={() => setShowAddEx(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Exercise</div>
            <input
              className="modal-input"
              placeholder="Exercise name"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExercise()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={addExercise}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseItem({ name, isActive, loggedSets, guide, optional, lastWeight, lastSessionSets, onToggle, onLog, onDelete }) {
  const [weight, setWeight] = useState(lastWeight !== "" ? String(lastWeight) : "");
  const [reps, setReps] = useState("");
  const repsRef = useRef(null);

  // Update weight from most recent logged set in current session
  useEffect(() => {
    if (loggedSets.length > 0) {
      setWeight(String(loggedSets[loggedSets.length - 1].weight));
    }
  }, [loggedSets.length]);

  const handleLog = () => {
    if (!reps) return;
    const w = weight || 0;
    onLog(w, reps);
    setReps("");
    repsRef.current?.focus();
  };

  // Get last session sets (previous session, not current)
  const lastSets = lastSessionSets.slice(-5);

  return (
    <div className={`ex-item ${isActive ? "active" : ""}`}>
      <div className="ex-header" onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="ex-name">{name}</div>
            {optional && <span className="ex-optional">optional</span>}
          </div>
          {guide && <div className="ex-guide">{guide}</div>}
        </div>
        {loggedSets.length > 0 && (
          <div className="ex-sets-count">{loggedSets.length}</div>
        )}
        <div style={{ marginLeft: 8, color: "var(--muted)", transform: isActive ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>⌄</div>
      </div>

      {isActive && (
        <div className="ex-body">
          {lastSets.length > 0 && (
            <div className="last-session">
              <span style={{ alignSelf: "center" }}>Last:</span>
              {lastSets.map((s, i) => (
                <span key={i} className="last-tag">{s.weight}×{s.reps}</span>
              ))}
            </div>
          )}
          <div className="log-row">
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
          <button className="log-btn" onClick={handleLog}>Log Set</button>

          {loggedSets.length > 0 && (
            <div className="logged-sets">
              {loggedSets.map((s, i) => (
                <div key={i} className="logged-set">
                  <div className="set-num">{i + 1}</div>
                  <div className="set-detail">{s.weight} lbs × {s.reps} reps</div>
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
function SummaryScreen({ data, user, onDone }) {
  if (data.cardio) {
    const c = data.cardio;
    return (
      <div className="screen">
        <div className="summary-hero">
          <div className="summary-icon">{CARDIO_ICONS[c.type] || "🏃"}</div>
          <div className="summary-title">Nice work!</div>
          <div className="summary-prog">{c.type}</div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{c.duration}</div>
            <div className="stat-label">Minutes</div>
          </div>
          <div className="stat-card">
            <div className="stat-val">✓</div>
            <div className="stat-label">Counts toward streak</div>
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
        <div className="summary-title">Workout done!</div>
        <div className="summary-prog">{session.program} · {fmtDate(session.date)}</div>
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
              {volDiff > 0 ? "+" : ""}{volDiff >= 1000 || volDiff <= -1000 ? (volDiff / 1000).toFixed(1) + "k" : volDiff} vs last
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

// ── CARDIO ────────────────────────────────────────────────────────────────────
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
function HistoryScreen({ sessions, cardio, onBack, onDetail }) {
  const all = [
    ...sessions.map(s => ({ ...s, _type: "strength" })),
    ...cardio.map(c => ({ ...c, _type: "cardio" })),
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div className="header-title">History</div>
      </div>
      <div className="screen-scroll">
        {all.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No workouts logged yet</div>
          </div>
        ) : all.map((item, i) => (
          item._type === "strength" ? (
            <div key={i} className="hist-item" onClick={() => onDetail(item)}>
              <div className="hist-header">
                <div className="hist-name">{item.program}</div>
                <span className="badge badge-orange">Strength</span>
              </div>
              <div className="hist-date">{fmtDate(item.date)}</div>
              <div className="hist-meta" style={{ marginTop: 4 }}>
                {item.totalSets} sets · {item.totalReps} reps · {item.duration}m
              </div>
            </div>
          ) : (
            <div key={i} className="hist-item" style={{ cursor: "default" }}>
              <div className="hist-header">
                <div className="hist-name">{CARDIO_ICONS[item.type]} {item.type}</div>
                <span className="badge badge-green">Cardio</span>
              </div>
              <div className="hist-date">{fmtDate(item.date)}</div>
              <div className="hist-meta" style={{ marginTop: 4 }}>{item.duration} min</div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ── HIST DETAIL ───────────────────────────────────────────────────────────────
function HistDetailScreen({ session, onBack }) {
  return (
    <div className="screen">
      <div className="header">
        <button className="header-back" onClick={onBack}>←</button>
        <div>
          <div className="header-title">{session.program}</div>
          <div className="header-sub">{fmtDate(session.date)} · {session.duration}m</div>
        </div>
      </div>
      <div className="screen-scroll">
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div><div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{session.totalSets}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Sets</div></div>
            <div><div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{session.totalReps}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Reps</div></div>
            <div><div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>{session.totalVol >= 1000 ? (session.totalVol / 1000).toFixed(1) + "k" : session.totalVol}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Volume</div></div>
          </div>
        </div>
        {session.sets && Object.entries(session.sets).map(([ex, sets]) => (
          <div key={ex} className="detail-exercise card">
            <div className="detail-ex-name">{ex}</div>
            {sets.map((s, i) => (
              <div key={i} className="detail-set">Set {i + 1}: {s.weight} lbs × {s.reps} reps</div>
            ))}
          </div>
        ))}
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
      ].map(n => (
        <div key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => onTab(n.id)}>
          <div className="nav-icon">{n.icon}</div>
          {n.label}
        </div>
      ))}
    </div>
  );
}
