import { StatusClient } from "../src";

const BASE_URL: string = "http://localhost:8000";

async function runTest() {
  const client = new StatusClient(BASE_URL);

  try {
    console.log("Waiting for job completion...");
    const finalStatus = await client.awaitCompletion();
    console.log(`Final job status: ${finalStatus}`);
  } catch (error) {
    console.error("Error while waiting for job completion:", error);
  }
}

runTest();
