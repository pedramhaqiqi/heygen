import { STATUS } from "./constants";

export type resultType = (typeof STATUS)[keyof typeof STATUS];
export type pollMode = "short" | "long";

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