/** Product-mode flags — free forever for now; billing module is stubbed. */
export const PRODUCT = {
  IS_FREE: true,
  /** Set BILLING_ENABLED=true in env when you want to activate payments later */
  BILLING_ENABLED: process.env.BILLING_ENABLED === "true",
  MAX_WORKSPACES_PER_USER: 50,
  MAX_FILE_UPLOAD_MB: 15,
  REMINDER_SCAN_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  INVITE_EXPIRES_DAYS: 7,
} as const;

export const DEFAULT_WORKSPACE_STATUSES = [
  { key: "general", label: "General", color: "#8b95a1", order: 0 },
  { key: "backlog", label: "Backlog", color: "#3d8fd1", order: 1 },
  { key: "in-progress", label: "In progress", color: "#e0a800", order: 2 },
  { key: "paused", label: "Paused", color: "#ff6b3d", order: 3 },
  {
    key: "ready-to-launch",
    label: "Ready to launch",
    color: "#9bc41a",
    order: 4,
  },
] as const;

export const RECURRENCE_FREQ = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
} as const;

export type TRecurrenceFreq =
  (typeof RECURRENCE_FREQ)[keyof typeof RECURRENCE_FREQ];
