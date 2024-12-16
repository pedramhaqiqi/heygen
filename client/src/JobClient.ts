import fetch from "node-fetch";
import { STATUS } from "./constants";
class JobClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Creates a new job on the server with the specified parameters.
   * @param {number} processingDuration - The time in seconds the job should take before completing or erroring.
   * @param {boolean} shouldError - Whether the job should end in an error state (true) or complete successfully (false).
   * @returns {Promise<{ job_id: string; status: string }>} An object containing the newly created job_id and its initial status.
   * @throws {Error} If the HTTP request fails or the server returns an error response.
   */
  public async createJob(
    processingDuration: number,
    shouldError: boolean
  ): Promise<CreateJobResponse> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        processing_duration: processingDuration,
        should_error: shouldError,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create job: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as CreateJobResponse;
    return { job_id: data.job_id, status: data.status };
  }

  /**
   * Fetches the current status of the job from the server.
   * @param {string} jobId - The unique identifier of the job to check.
   * @returns {Promise<string>} The current status of the job as a string.
   * @throws {Error} If the HTTP request fails or the server responds with an error status.
   */
  public async getStatus(jobId: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/status?job_id=${encodeURIComponent(jobId)}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch status for job ${jobId}: ${response.status} ${response.statusText}`
      );
    }

    const data: StatusResponse = (await response.json()) as StatusResponse;
    return data.result;
  }

  /**
   * Polls the server for the job status until it is no longer pending.
   * @param {number} timeoutMs The maximum time to wait for the job to complete in milliseconds.
   * @param {number} pollIntervalMs The time to wait between status requests in milliseconds.
   * @returns {Promise<string>} The final status of the job.
   * @throws {Error} If the job ends in an error state or the timeout is reached.
   */
  public async awaitCompletion(
    timeoutMs: number = 30000,
    pollIntervalMs: number = 1000,
    jobId: string
  ): Promise<string> {
    const start = Date.now();

    while (true) {
      const elapsed = Date.now() - start;
      if (elapsed > timeoutMs) {
        throw new Error(
          `Timeout reached after ${timeoutMs}ms waiting for completion.`
        );
      }

      let status: string;
      try {
        console.log("Fetching status...");
        status = await this.getStatus(jobId);
      } catch (err: unknown) {
        // For now, decide to fail immediately TODO: Add retry logic/handle errors
        throw new Error(`Failed to fetch status: ${err}`);
      }

      switch (status) {
        case STATUS.COMPLETED:
          return STATUS.COMPLETED;
        case STATUS.ERROR:
          throw new Error("The job ended in an error state.");
        case STATUS.PENDING:
          console.log(`Job still pending...Waiting ${pollIntervalMs}ms`);
          await this.delay(pollIntervalMs);
          break;
      }
    }
  }

  /**
   * Delays execution for a specified amount of time.
   * @param {number} ms The time to wait in milliseconds.
   * @returns {Promise<void>} A promise that resolves after the specified time.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { JobClient };