import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { JobClient } from "../../src/JobClient";
import { STATUS } from "../../src/constants";
import { CreateJobResponse } from "../../src/types";

const BASE_URL = "http://localhost:8000"; // Ensure your server is running here

jest.setTimeout(75000); // Increase timeout for retries

describe("JobClient - Rate Limiter and Retry Policy", () => {
  let client: JobClient;

  beforeAll(() => {
    client = new JobClient(BASE_URL, 3); // 3 retries for demonstration
  });

  it("should retry on rate-limiting (429) and complete the job successfully", async () => {
    // Create a job that takes ~5 seconds and doesn't error
    const processingDuration = 5;
    const shouldError = false;

    const { job_id, status }: CreateJobResponse = await client.createJob(
      processingDuration,
      shouldError
    );

    console.log(`Created job with ID: ${job_id} and initial status: ${status}`);

    // Use short-polling with 0ms interval to quickly trigger retries as the server will rate limit.
    const finalStatus = await client.awaitCompletion(job_id, {
      mode: "short",
      timeoutMs: 75000,    // 10 seconds timeout
      pollIntervalMs: 0,   // 0ms interval to simulate rapid polling and hit rate limits
    });

    console.log(`Final status (rate-limiter test): ${finalStatus}`);
    expect(finalStatus).toBe(STATUS.COMPLETED);
  });
});