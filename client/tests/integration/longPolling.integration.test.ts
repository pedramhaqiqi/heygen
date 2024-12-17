import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { JobClient } from "../../src/JobClient";
import { STATUS } from "../../src/constants";
import { CreateJobResponse } from "../../src/types";

const BASE_URL = "http://localhost:8000";

jest.setTimeout(30000);

describe("JobClient - Long Polling", () => {
  let client: JobClient;

  beforeAll(() => {
    client = new JobClient(BASE_URL, 3);
  });

  it("should create a job (long-polling) and complete successfully", async () => {
    const processingDuration = 3;
    const shouldError = false;
    const { job_id, status }: CreateJobResponse = await client.createJob(processingDuration, shouldError);

    console.log(`Created job (long-polling) with ID: ${job_id} and initial status: ${status}`);

    const finalStatus = await client.awaitCompletion(job_id, {
      mode: "long",
      timeoutMs: 20000,
      pollIntervalMs: 1000,
    });

    console.log(`Final status (long-polling): ${finalStatus}`);
    expect(finalStatus).toBe(STATUS.COMPLETED);
  });
});