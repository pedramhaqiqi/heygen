type resultType = "pending" | "completed" | "error";
type pollMode = "short" | "long";

interface StatusResponse {
  result: resultType;
}

interface CreateJobResponse {
  job_id: string;
  status: resultType;
}
interface AwaitCompletionOptions {
    mode?: pollMode;
    timeoutMs?: number;
    pollIntervalMs?: number;
}