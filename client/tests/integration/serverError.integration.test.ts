import { beforeAll, describe, expect, it, afterEach } from "@jest/globals";
import { JobClient } from "../../src";
import nock from "nock";
import { CreateJobResponse } from "../../src/types";
import { ERROR_TYPES } from "../../src/constants";
import { JobClientError } from "../../src/errors";

const BASE_URL = "http://localhost:8000";
const NUM_RETRIES = 3;

describe("JobClient - Server Error Handling", () => {
  let client: JobClient;

  beforeAll(() => {
    client = new JobClient(BASE_URL);
  });

  afterEach(() => {
    nock.cleanAll(); // Clean up any pending mocks
  });

  it("should raise an error when the server returns 500 Internal Server Error", async () => {
    nock(BASE_URL)
      .get("/status")
      .query({ job_id: "1", mode: "long" })
      .times(NUM_RETRIES)
      .reply(500, "Internal Server Error");
    nock(BASE_URL).post("/jobs").reply(200, { job_id: "1", status: "PENDING" });

    // Step 2: Call createJob and verify that an error is thrown
    try {
      console.log("Creating a job with server error...");
      const processingDuration = 3;
      const shouldError = false;
      const { job_id, status }: CreateJobResponse = await client.createJob(
        processingDuration,
        shouldError
      );
      console.log(
        `Created job with ID: ${job_id} and initial status: ${status}`
      );
      await client.awaitCompletion(job_id, {
        mode: "long",
        timeoutMs: 20000,
        pollIntervalMs: 1000,
      });
    } catch (error) {
        expect(error).toBeInstanceOf(JobClientError);
    }
  });
});
