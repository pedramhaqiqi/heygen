import axios, { AxiosError, AxiosInstance } from "axios";
import {
  DEFAULT_MAX_RETRIES,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  END_POINTS,
  POLLING_MODES,
  JOB_STATUS,
} from "./constants";
import { JobClientError, TimeoutError, handleError } from "./errors";
import {
  AwaitCompletionOptions,
  CreateJobResponse,
  StatusResponse,
  PollingMode,
  JobStatus,
} from "./types";
import { configureAxiosRetry } from "./utils";
class JobClient {
  private api: AxiosInstance;

  constructor(baseUrl: string, maxRetries: number = DEFAULT_MAX_RETRIES) {
    const url = new URL(baseUrl);
    this.api = axios.create({
      baseURL: url.toString(),
    });

    configureAxiosRetry(this.api, maxRetries);
  }

  /**
   * Creates a new job on the server with the specified parameters, main use is for testing.
   * @param {number} processingDuration - The time in seconds the job should take before completing or erroring.
   * @param {boolean} shouldError - Whether the job should end in an error state (true) or complete successfully (false).
   * @returns {Promise<CreateJobResponse>} An object containing the newly created job_id and its initial status.
   * @throws {JobClientError} If the HTTP request fails or the server returns an error response.
   */
  public async createJob(
    processingDuration: number,
    shouldError: boolean
  ): Promise<CreateJobResponse> {
    try {
      const response = await this.api.post<CreateJobResponse>(END_POINTS.JOBS, {
        processing_duration: processingDuration,
        should_error: shouldError,
      });

      const data = response.data;
      return { job_id: data.job_id, status: data.status };
    } catch (error) {
      throw handleError(error as AxiosError, "Failed to create job");
    }
  }

  /**
   * Fetches the current status of the job from the server.
   * @param {string} jobId - The unique identifier of the job to check.
   * @param {PollingMode} mode - The polling mode to use when checking the job status.
   * @returns {Promise<JobStatus>} The current status of the job as a string.
   * @throws {JobClientError} If the HTTP request fails or the server responds with an error status.
   */
  public async getStatus(jobId: string, mode: PollingMode): Promise<JobStatus> {
    try {
      const response = await this.api.get<StatusResponse>(END_POINTS.JOB_STATUS, {
        params: { job_id: jobId, mode },
      });

      const data = response.data;
      return data.result;
    } catch (error) {
      throw handleError(error as AxiosError, "Failed to fetch status");
    }
  }
  /**
   * Polls the server for the job status until it is no longer pending.
   * This is the main function that the client will call to track job completion.
   * @param {string} jobId - The unique identifier of the job.
   * @param {AwaitCompletionOptions} options - Configuration for timeout and polling interval, and polling strategy.
   * @returns {Promise<JobStatus>} The final status of the job.
   * @throws {JobClientError | TimeoutError} If the job ends in an error state, a timeout occurs, or there is a network/server issue.
   */
  public async awaitCompletion(
    jobId: string,
    {
      mode = POLLING_MODES.LONG,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    }: AwaitCompletionOptions
  ): Promise<JobStatus> {
    const start = Date.now();

    while (Date.now() - start <= timeoutMs) {
      console.log(`Polling job status for jobId: ${jobId}`);
      const status = await this.getStatus(jobId, mode);
      const shouldContinue = this.handleJobStatus(status, jobId);
      if (!shouldContinue) {
        return status;
      }
      console.log(
        `Job ${jobId} is still pending. Will retry in ${pollIntervalMs}ms.`
      );
      await this.delay(pollIntervalMs);
    }

    const message = `Polling timed out for job ${jobId} after ${timeoutMs}ms.`;
    console.error(message);
    throw new TimeoutError(timeoutMs);
  }

  /**
   * Delays execution for a specified amount of time.
   * @param {number} ms The time to wait in milliseconds.
   * @returns {Promise<void>} A promise that resolves after the specified time.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handles the status of the job and determines whether to continue polling, return a result, or throw an error.
   * @param {string} status - The current status of the job.
   * @param {string} jobId - The unique identifier of the job.
   * @returns {Promise<boolean>} A boolean indicating whether polling should continue.
   * @throws {JobClientError} If the status is unknown or in an error state.
   */
  private handleJobStatus(status: string, jobId: string): boolean {
    switch (status) {
      case JOB_STATUS.COMPLETED:
        console.log(`Job ${jobId} completed successfully.`);
        return false;

      case JOB_STATUS.ERROR:
        console.log(`Job ${jobId} ended in an error state.`);
        return false;

      case JOB_STATUS.PENDING:
        return true;

      default:
        throw new JobClientError(
          `Unknown status '${status}' for job ${jobId}.`
        );
    }
  }
}

export { JobClient };
