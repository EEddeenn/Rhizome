export const STORAGE_KEYS = {
  NOTE_LIST_WIDTH: "rhizome_editor_note_list_width",
  TOKEN_SESSION: "rhizome_editor_token_session",
  TOKEN_LOCAL: "rhizome_editor_token_local",
  CONFIG: "rhizome_editor_config",
  AUTO_LOGIN: "rhizome_editor_auto_login",
  SPLIT_PERCENT: "rhizome_editor_split_percent",
} as const;

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
