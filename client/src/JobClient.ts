import fetch from "node-fetch";
import { STATUS } from "./constants";
class JobClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

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

    const data = await response.json() as CreateJobResponse;
    return { job_id: data.job_id, status: data.status };
  }

  /**
   * Fetches the current status of the job from the server.
   * @returns {Promise<string>} The current status of the job as a string.
   * @throws {Error} If the HTTP request fails or the server responds with an error status.
   */
  public async getStatus(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch status: ${response.status} ${response.statusText}`
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
    pollIntervalMs: number = 1000
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
        status = await this.getStatus();
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
