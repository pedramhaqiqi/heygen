export const STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  ERROR: "error",
} as const;

export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_POLL_INTERVAL_MS = 1_000;
export const DEFAULT_MAX_RETRIES = 3;

export const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const POLLING_MODES = {
  SHORT: "short",
  LONG: "long",
};

export const END_POINTS = {
  JOBS: "/jobs",
  STATUS: "/status",
};

export const ERROR_TYPES = {
  NETWORK: "NetworkError",
  RATE_LIMIT: "RateLimitError",
  SERVER: "ServerError",
  TIMEOUT: "TimeoutError",
  CLIENT: "JobClientError",
}