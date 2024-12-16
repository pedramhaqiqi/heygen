import axios, { AxiosInstance } from "axios";
import {
  STATUS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
} from "./constants";
import axiosRetry from "axios-retry";
import {
  pollMode,
  AwaitCompletionOptions,
  CreateJobResponse,
  StatusResponse,
} from "./types";
class JobClient {
  private api: AxiosInstance;

  constructor(baseUrl: string, maxRetries: number = DEFAULT_MAX_RETRIES) {
    const url = new URL(baseUrl);
    this.api = axios.create({
      baseURL: url.toString(),
    });

    axiosRetry(this.api, {
      retries: maxRetries,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        console.log(
          `Retry attempt due to error: ${error.message} with code ${error.code}`
        );
        return (
          axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error)
        );
      },
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
  public async getStatus(jobId: string, mode: pollMode): Promise<string> {
    try {
      const response = await this.api.get<StatusResponse>(`/status`, {
        params: { job_id: jobId, mode },
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
    {
      mode = "long",
      timeoutMs = DEFAULT_TIMEOUT_MS,
      pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    }: AwaitCompletionOptions
  ): Promise<string> {
    const start = Date.now();

    while (Date.now() - start <= timeoutMs) {
      let status: string;
      try {
        console.log("Fetching status...");
        status = await this.getStatus(jobId, mode);
      } catch (err: unknown) {
        throw new Error(
          `Failed to fetch status for job ${jobId}: ${String(err)}`
        );
      }

      switch (status) {
        case STATUS.COMPLETED:
        case STATUS.ERROR:
          return status;
        case STATUS.PENDING:
          console.log(`Job still pending... Waiting ${pollIntervalMs}ms`);
          await this.delay(pollIntervalMs);
          break;
      }
    }

    throw new Error(
      `Timeout reached after ${timeoutMs}ms waiting for completion.`
    );
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
