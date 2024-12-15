import fetch from 'node-fetch';

class StatusClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); 
  }

  public async getStatus(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch status: ${response.status} ${response.statusText}`);
    }

    const data: StatusResponse = await response.json() as StatusResponse;
    return data.result;
  }
}

export { StatusClient };