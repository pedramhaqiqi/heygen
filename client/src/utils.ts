import { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { HTTP_STATUS } from "./constants";

/**
 * Configures Axios instance with retry logic.
 * @param {AxiosInstance} instance - The Axios instance to configure.
 * @param {number} maxRetries - Maximum number of retry attempts.
 */
export function configureAxiosRetry(
  instance: AxiosInstance,
  maxRetries: number = 3
) {
  axiosRetry(instance, {
    retries: maxRetries,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return (
        axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error)
      );
    },
    onRetry: (retryCount, error) => {
      if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        console.log(
          `Retry attempt #${retryCount} due to 429 Rate Limit. Retry-After: ${
            error.response.headers["retry-after"] || "N/A"
          } seconds.`
        );
      } else {
        console.log(
          `Retry attempt #${retryCount} due to error: ${
            error.message || "unknown error"
          }`
        );
      }
    },
  });
}
