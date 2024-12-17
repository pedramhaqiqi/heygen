import { JOB_STATUS, POLLING_MODES } from "./constants";

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
export type PollingMode = (typeof POLLING_MODES)[keyof typeof POLLING_MODES];

export interface StatusResponse {
  result: JobStatus;
}

export interface CreateJobResponse {
  job_id: string;
  status: JobStatus;
}

export interface AwaitCompletionOptions {
  mode?: PollingMode;
  timeoutMs?: number;
  pollIntervalMs?: number;
}