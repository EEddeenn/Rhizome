const UI_PREFS_KEY = "rhizome_editor_ui_prefs";

export const NOTE_LIST_WIDTH = {
  DEFAULT: 256,
  MIN: 180,
  MAX: 400,
} as const;

export const SPLIT_VIEW = {
  DEFAULT_PERCENT: 40,
  MIN_PERCENT: 20,
  MAX_PERCENT: 60,
} as const;

interface UIPrefsV1 {
  v: 1;
  noteListWidth: number;
  splitPercent: number;
}

type UIPrefs = UIPrefsV1;

const DEFAULT_UI_PREFS: UIPrefs = {
  v: 1,
  noteListWidth: NOTE_LIST_WIDTH.DEFAULT,
  splitPercent: SPLIT_VIEW.DEFAULT_PERCENT,
};

export function loadUIPrefs(): UIPrefs {
  if (typeof window === "undefined") return DEFAULT_UI_PREFS;
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return DEFAULT_UI_PREFS;
    const parsed = JSON.parse(raw) as Partial<UIPrefs>;
    if (parsed.v === 1) {
      return {
        v: 1,
        noteListWidth: typeof parsed.noteListWidth === "number" 
          ? Math.max(NOTE_LIST_WIDTH.MIN, Math.min(NOTE_LIST_WIDTH.MAX, parsed.noteListWidth))
          : NOTE_LIST_WIDTH.DEFAULT,
        splitPercent: typeof parsed.splitPercent === "number"
          ? Math.max(SPLIT_VIEW.MIN_PERCENT, Math.min(SPLIT_VIEW.MAX_PERCENT, parsed.splitPercent))
          : SPLIT_VIEW.DEFAULT_PERCENT,
      };
    }
    return DEFAULT_UI_PREFS;
  } catch {
    return DEFAULT_UI_PREFS;
  }
}

export function saveUIPrefs(prefs: Partial<Omit<UIPrefs, "v">>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadUIPrefs();
    const updated: UIPrefs = { ...current, ...prefs, v: 1 };
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(updated));
  } catch {
    return;
  }
}
