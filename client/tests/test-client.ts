/**
 * A simple script to demonstrate basic functionality of the JobClient.
 *
 * This script creates a new job using the JobClient, waits for its completion,
 * and logs the job's final status.
 *
 * To run this script, ensure that the server is running locally on port 8000.
 */
import { JobClient } from "../src";
import { AwaitCompletionOptions } from "../src/types";

const BASE_URL: string = "http://localhost:8000";
const pollingConfig: AwaitCompletionOptions = {
  timeoutMs: 20000,
  pollIntervalMs: 1000,
  mode: "long",
}

async function runTest() {
  const client = new JobClient(BASE_URL);

  try {
    console.log("Creating a new job...");
    // Create a job that takes 10 seconds and does not error
    const { job_id, status } = await client.createJob(10, false);
    console.log(`Job created with ID: ${job_id}, initial status: ${status}`);

    console.log("Waiting for job completion...");
    const finalStatus = await client.awaitCompletion(job_id, pollingConfig);
    console.log(`Final job status for job ${job_id}: ${finalStatus}`);
  } catch (error) {
    console.error(error);
  }
}

runTest();
