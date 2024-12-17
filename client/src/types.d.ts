import { STATUS, POLLING_MODES } from "./constants";

export type resultType = (typeof STATUS)[keyof typeof STATUS];
export type pollMode = (typeof POLLING_MODES)[keyof typeof POLLING_MODES];

export interface StatusResponse {
  result: resultType;
}

export interface CreateJobResponse {
  job_id: string;
  status: resultType;
}

export interface AwaitCompletionOptions {
  mode?: pollMode;
  timeoutMs?: number;
  pollIntervalMs?: number;
}