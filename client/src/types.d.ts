type resultType = "pending" | "completed" | "error";

interface StatusResponse {
  result: resultType;
}

interface CreateJobResponse {
  job_id: string;
  status: resultType;
}