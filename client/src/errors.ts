import { AxiosError } from "axios";
import { ERROR_TYPES, HTTP_STATUS } from "./constants";

export class JobClientError extends Error {
  public statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = ERROR_TYPES.CLIENT;
    this.statusCode = statusCode;
  }
}

export class NetworkError extends JobClientError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = ERROR_TYPES.NETWORK;
  }
}

export class RateLimitError extends JobClientError {
  public retryAfter?: number;
  constructor(message: string, retryAfter?: number, statusCode?: number) {
    super(message, statusCode);
    this.name = ERROR_TYPES.RATE_LIMIT;
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends JobClientError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = ERROR_TYPES.SERVER;
  }
}

export class TimeoutError extends JobClientError {
  constructor(timeoutMs: number, statusCode?: number) {
    super(
      `Timeout reached after ${timeoutMs}ms waiting for completion.`,
      statusCode
    );
    this.name = ERROR_TYPES.TIMEOUT;
  }
}

export function handleError(
  error: AxiosError,
  context = "Operation"
): JobClientError {
  if (error.response) {
    const statusCode = error.response.status;
    switch (statusCode) {
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        return new RateLimitError(
          `${context}: Rate limit exceeded`,
          error.response.headers["retry-after"],
          statusCode
        );
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return new ServerError(`${context}: Internal server error`, statusCode);
      case HTTP_STATUS.NOT_FOUND:
        return new JobClientError(`${context}: Resource not found`, statusCode);
      default:
        return new JobClientError(
          `${context} failed: ${error.response.data}`,
          statusCode
        );
    }
  } else {
    return new NetworkError(`${context}: No response received`);
  }
}
