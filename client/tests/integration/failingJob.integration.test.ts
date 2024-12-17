import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { JobClient } from "../../src/JobClient";
import { JOB_STATUS } from "../../src/constants";
import { CreateJobResponse } from "../../src/types";

const BASE_URL = "http://localhost:8000";

jest.setTimeout(30000);

describe("JobClient - Failing Job", () => {
  let client: JobClient;

  beforeAll(() => {
    client = new JobClient(BASE_URL, 3);
  });

  it("should create a job that fails and return ERROR status", async () => {
    const processingDuration = 5;
    const shouldError = true;
    const { job_id, status }: CreateJobResponse = await client.createJob(
      processingDuration,
      shouldError
    );

    console.log(
      `Created failing job with ID: ${job_id} and initial status: ${status}`
    );

    const finalStatus = await client.awaitCompletion(job_id, {
      mode: "short",
      timeoutMs: 20000,
      pollIntervalMs: 1000,
    });

    console.log(`Final status (failing job): ${finalStatus}`);
    expect(finalStatus).toBe(JOB_STATUS.ERROR);
  });
});
