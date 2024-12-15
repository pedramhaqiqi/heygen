import { StatusClient } from "../src";

const BASE_URL: string = "http://localhost:8000";

async function runTest() {
  const client = new StatusClient(BASE_URL);
  try {
    console.log("Fetching job status...");
    const status = await client.getStatus();
    console.log("Job status:", status);
  } catch (err: unknown) {
    console.error("Error fetching job status:", err);
  }
}

runTest();