import axios, { AxiosError } from "axios";

export class JobClientError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "JobClientError";
    this.statusCode = statusCode;
  }
}

export class NetworkError extends JobClientError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = "NetworkError";
  }
}

export class RateLimitError extends JobClientError {
  public retryAfter?: number;
  constructor(message: string, retryAfter?: number, statusCode?: number) {
    super(message, statusCode);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends JobClientError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = "ServerError";
  }
}

export class TimeoutError extends JobClientError {
  constructor(timeoutMs: number, statusCode?: number) {
    super(
      `Timeout reached after ${timeoutMs}ms waiting for completion.`,
      statusCode
    );
    this.name = "TimeoutError";
  }
}

export function handleError(
  error: AxiosError | Error,
  context = "Operation"
): never {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const statusCode = error.response.status;
      switch (statusCode) {
        case 429:
          throw new RateLimitError(
            `${context}: Rate limit exceeded`,
            error.response.headers["retry-after"],
            statusCode
          );
        case 500:
          throw new ServerError(
            `${context}: Internal server error`,
            statusCode
          );
        case 404:
          throw new JobClientError(
            `${context}: Resource not found`,
            statusCode
          );
        default:
          throw new JobClientError(
            `${context} failed: ${error.response.data}`,
            statusCode
          );
      }
    } else if (error.request) {
      throw new NetworkError(`${context}: No response received`);
    } else {
      throw new JobClientError(`${context}: Error - ${error.message}`);
    }
  }

  // Fallback 
  throw new JobClientError(`${context}: Unexpected error - ${String(error)}`);
}
