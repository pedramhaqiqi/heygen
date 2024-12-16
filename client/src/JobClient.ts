import { STATUS } from "./constants";
import axios, { AxiosInstance } from "axios";
class JobClient {
  private api: AxiosInstance;

  constructor(baseUrl: string) {
    const url = new URL(baseUrl);
    this.api = axios.create({
      baseURL: url.toString(),
    });
  }

  /**
   * Creates a new job on the server with the specified parameters, main use is for testing.
   * @param {number} processingDuration - The time in seconds the job should take before completing or erroring.
   * @param {boolean} shouldError - Whether the job should end in an error state (true) or complete successfully (false).
   * @returns {Promise<{ job_id: string; status: string }>} An object containing the newly created job_id and its initial status.
   * @throws {Error} If the HTTP request fails or the server returns an error response.
   */
  public async createJob(
    processingDuration: number,
    shouldError: boolean
  ): Promise<CreateJobResponse> {
    try {
      const response = await this.api.post<CreateJobResponse>("/jobs", {
        processing_duration: processingDuration,
        should_error: shouldError,
      });

      const data = response.data;
      return { job_id: data.job_id, status: data.status };
    } catch (error) {
      throw new Error(`Failed to create job: ${error}`);
    }
  }

  /**
   * Fetches the current status of the job from the server.
   * @param {string} jobId - The unique identifier of the job to check.
   * @returns {Promise<string>} The current status of the job as a string.
   * @throws {Error} If the HTTP request fails or the server responds with an error status.
   */
  public async getStatus(jobId: string): Promise<string> {
    try {
      const response = await this.api.get<StatusResponse>(`/status`, {
        params: { job_id: jobId },
      });

      const data = response.data;
      return data.result;
    } catch (error) {
      throw new Error(`Failed to fetch status for job ${jobId}: ${error}`);
    }
  }

  /**
   * Polls the server for the job status until it is no longer pending.
   * @param {number} timeoutMs The maximum time to wait for the job to complete in milliseconds.
   * @param {number} pollIntervalMs The time to wait between status requests in milliseconds.
   * @returns {Promise<string>} The final status of the job.
   * @throws {Error} If the job ends in an error state or the timeout is reached.
   */
  public async awaitCompletion(
    jobId: string, 
    timeoutMs: number = 30000,
    pollIntervalMs: number = 1000,
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
