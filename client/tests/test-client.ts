import { JobClient } from "../src";

const BASE_URL: string = "http://localhost:8000";

async function runTest() {
  const client = new JobClient(BASE_URL);

  try {
    console.log("Creating a new job...");
    // Create a job that takes 10 seconds and does not error
    const { job_id, status } = await client.createJob(10, false);
    console.log(`Job created with ID: ${job_id}, initial status: ${status}`);

    console.log("Waiting for job completion...");
    const finalStatus = await client.awaitCompletion(job_id, 30000, 1000);
    console.log(`Final job status for job ${job_id}: ${finalStatus}`);
  } catch (error) {
    console.error("Error while waiting for job completion:", error);
  }
}

runTest();
