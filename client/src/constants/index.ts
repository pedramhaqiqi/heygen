export const STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  ERROR: "error",
} as const;

export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_POLL_INTERVAL_MS = 1_000;
export const DEFAULT_MAX_RETRIES = 3;