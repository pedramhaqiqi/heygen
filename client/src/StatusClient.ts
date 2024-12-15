import fetch from "node-fetch";
import { STATUS } from "./constants";
class StatusClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

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
          await this.delay(pollIntervalMs);
          break;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { StatusClient };