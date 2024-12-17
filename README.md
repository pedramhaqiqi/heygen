## Project Setup Guide

Follow the steps below to set up and run the project. These instructions cover both the server and client components.

### Setting Up the Server

To set up and run the FastAPI server:

1. **Navigate to the Server Directory**  
    From the root of the project, change into the server directory:
    ```sh
    cd server
    ```

2. **Create a Virtual Environment**  
    Create a Python virtual environment:
    ```sh
    python -m venv .venv
    ```

3. **Activate the Virtual Environment**  
    Run the following command:
    ```sh
    source .venv/bin/activate
    ```

4. **Install Dependencies**  
    Install the required Python packages:
    ```sh
    pip install -r requirements.txt
    ```

5. **Run the Server**  
    Start the FastAPI development server (for our purposes running in dev mode suffices):
    ```sh
    fastapi dev 
    ```
    By default, the server will be available at:
    ```
    http://127.0.0.1:8000
    ```

### Setting Up the Client

To set up the client library:

1. **Navigate to the Client Directory**  
    In a new terminal window, change to the client directory:
    ```sh
    cd client
    ```

2. **Install Dependencies**  
    Install the required Node.js packages using npm:
    ```sh
    npm install
    ```

### Running the Project

With both the server and client set up:

1. **Start the Server**  
    Ensure the FastAPI server is running on `http://127.0.0.1:8000`.

2. **Test the Client Integration Tests**  
    You can run one of the client integration tests to verify everything is working. 
    ```sh
    npm run test:long-polling
    ```

Once both the server and client are set up, you can test the functionality or use the client library to create jobs, fetch statuses, and monitor job completions. I've provided a `test-client.ts` file for you to play around with the client library, also there are integration tests that showcase various functionalities and situations. 

### Integration Tests:
Once you have installed the dependencies for the client and server, you are good to run the integration scripts. You are perfectly fine if you would like to run them individually, I have provided a script at the root of the project that spins up the server and runs all the tests in order.

In the root of the repository, while making sure the server is down. The script runs the server as a daemon and proceeds to navigate to the client library and run the integration tests.
```sh
./run-integration-tests.sh
```

#### Test Cases
The client library includes several integration tests to ensure its functionality, reliability, and resilience. Below is a concise description of each test case:

- **test:long-polling**  
    Verifies that the client can successfully monitor a job using long polling until completion or failure, respecting the specified timeouts and intervals.

- **test:short-polling**  
    Ensures that the client correctly implements short polling by repeatedly checking the server for job status updates at a defined interval.

- **test:failing-job**  
    Tests how the client handles a job that ends in an error state, ensuring proper error handling and response.

- **test:rate-limiter**  
    Simulates a scenario where the client makes frequent requests and hits the server’s rate limiting threshold. Confirms that the client reacts appropriately to rate-limited responses.

- **test:server-error**  
    Validates the client’s behavior when the server encounters an internal error (HTTP 500), ensuring retries or error propagation occur as expected.

Each test case can be executed independently using the following commands:

```sh
npm run test:long-polling
npm run test:short-polling
npm run test:failing-job
npm run test:rate-limiter
npm run test:server-error
```

## Design Choices

In developing my client library, I carefully evaluated multiple strategies for monitoring job statuses efficiently while ensuring scalability, adaptability, and minimal server overhead. Below are the key design decisions, including why I chose long polling over WebSockets, and the considerations I made to optimize performance.

### Customer Mindset
I wanted my client API to meet the needs of a vast number of users by allowing flexibility on the client side, provided that the server is well protected. 

### Communication Strategies Considered

I evaluated two main strategies for communication:
- Polling: Long Polling and Short Polling
- WebSockets
- SSE's and webhooks were also considered but not suitable for a client library

While WebSockets offer a powerful solution for real-time, bi-directional communication, they come with trade-offs that made them less suitable for this project.

### Why I Chose Polling Over WebSockets

1. **Alignment with HTTP Request-Response Architecture**  
    The scenario mentioned in the assignment is built on an HTTP request-response model. Long polling aligns naturally with this architecture, avoiding the need for extensive modifications to integrate WebSockets.

2. **Adaptability to HTTP-Based Backends**  
    Polling allows seamless integration with any HTTP-based backend. It uses standard HTTP connections, which are broadly supported.

3. **Scalability and Server Efficiency**  
    Maintaining bi-directional WebSocket connections at scale can impose significant server overhead. Persistent connections require dedicated resources, which can lead to bottlenecks under high loads. Polling mitigates this by leveraging stateless HTTP requests, allowing servers to efficiently handle a large number of concurrent clients as it controls how to handle these connections without an obligation to persist them.

4. **Simplicity for Status Monitoring**  
    Since the primary purpose of this client is to monitor job statuses, the unidirectional communication model of polling is sufficient. WebSockets would add unnecessary complexity for a task that involves periodic status checks rather than real-time interactions.

5. **Overhead Management**  
    The server addresses potential load challenges by enforcing thresholds on connection duration for Polling. For short polling, it avoids overloading by implementing rate limiting, ensuring that requests are spaced out at a manageable frequency.

### Why both short and long polling?
Initially, I implemented long polling as the primary strategy. However, I added short polling because it was a straightforward enhancement that gives clients greater flexibility.

By supporting both options:
- Clients can choose the polling strategy that best suits their needs.
- Short polling provides quicker updates for clients that prioritize lower latency.
- Long polling minimizes overhead for clients that are comfortable with slightly delayed updates.

To balance costs and performance:
- Rate limiting and connection timeouts protect the server from being overwhelmed by frequent requests.
- Clients can fine-tune polling intervals and timeouts to control their own trade-offs between latency and server load.

This approach gives clients control while ensuring the server remains performant and protected.

### Implementation of Polling Strategies

#### Client-Side Configuration
The client library is built with flexibility, allowing users to fine-tune polling behavior based on their needs:

- **Timeout**: Configurable duration for how long the client waits for a server response, preventing indefinite blocking.
- **Polling Interval**: Users can control how frequently status checks occur, balancing the trade-off between timely updates and server resource consumption.
- **Polling Mode**:
    - **Long Polling**: Efficient for reducing request frequency while maintaining up-to-date job statuses.
    - **Short Polling**: Useful for clients needing more frequent updates in low-latency scenarios.
- **Retry Policy**: To improve resiliency, the library includes a retry mechanism for transient failures (e.g., network issues or intermittent errors), ensuring reliable job monitoring even in less stable environments. The server returns a `Retry-After` header, which the client can handle using an exponential backoff strategy.

#### Server-Side Considerations

To efficiently support long polling while minimizing overhead, I incorporated the following optimizations into the server:
1. **Connection Timeouts**  
    Long polling connections are capped with a configurable timeout. This prevents excessive resource usage and ensures server responsiveness under high load. If a job remains pending beyond the timeout, the server returns a “pending” status, and the client retries after a delay.

2. **Rate Limiting for Short Polling**  
    For short polling, I implemented rate limiting to throttle incoming requests. This prevents clients from overwhelming the server with frequent status checks.

3. **Scalability Awareness**  
    By leveraging stateless HTTP connections and enforcing connection thresholds, the server efficiently handles a large number of concurrent polling requests without being overwhelmed.

## API Reference

Below is the API reference for the client library, detailing the publicly exposed methods, constants, and types. These are designed to provide flexibility and simplicity for monitoring job statuses while ensuring clarity in their intended use.

### Publicly Exposed Methods and Classes

#### JobClient

The main class of the client library, JobClient, provides methods to interact with the server for job creation, single-status retrieval, and polling.
- **Purpose**: To allow users to manage job lifecycles efficiently and reliably.
#### Constructor Parameters
- **baseUrl**: The base URL of the server to which the client will connect.
- **maxRetries**: An optional parameter specifying the maximum number of retry attempts for transient failures.

##### Key Methods
1. **createJob(processingDuration: number, shouldError: boolean): Promise<CreateJobResponse>**
    - **Description**: Creates a new job on the server with configurable parameters (e.g., duration and whether the job should simulate an error state).
    - **Use Case**: This method is primarily exposed to demonstrate the functionality of the client and server. It is particularly useful for testing and validating how jobs behave during their lifecycle.

2. **getStatus(jobId: string, mode: PollingMode): Promise<JobStatus>**
    - **Description**: Fetches the current status of a job from the server.
    - **Use Case**: This method is made publicly available for cases where the client wants to fetch a single status update without initiating polling. It provides a simple and direct way to check the status of a job at a given moment.

3. **awaitCompletion(jobId: string, options: AwaitCompletionOptions): Promise<JobStatus>**
    - **Description**: Polls the server for a job’s status until it reaches a terminal state (COMPLETED or ERROR).
    - **Behavior**: By default, this method uses long polling to minimize request frequency and reduce overhead. It evaluates the lifecycle of the job’s status to decide whether to continue polling or stop. The method will only return COMPLETED or ERROR once polling ends.
    - **Use Case**: This is the main polling function that clients should use to monitor job completion. It is ideal for scenarios where the client needs to reliably track the job until it finishes, while respecting configurable options like polling intervals and timeouts.

### Constants
- **JOB_STATUS**
    - Represents the possible states of a job.
    - **Values**: PENDING, COMPLETED, ERROR.
    - **Use Case**: Helps clients handle status comparisons cleanly without relying on hardcoded strings.

- **POLLING_MODES**
    - Defines the available polling strategies.
    - **Values**: LONG (long polling), SHORT (short polling).
    - **Use Case**: Allows clients to configure how frequently they want to poll for status updates.

### Errors

Custom error classes provide clear and specific error handling:
- **JobClientError**: The base error class for all client-related failures.
- **NetworkError**: Thrown when there are network-related issues (e.g., connection problems).
- **RateLimitError**: Indicates the server has rate-limited the client. Includes a retryAfter value for implementing backoff strategies.
- **ServerError**: Represents server-side errors (HTTP 5xx responses).
- **Use Case**: These error classes enable clients to handle failures gracefully and differentiate between various error types for better control.

### Types
- **AwaitCompletionOptions**: Configuration options for the awaitCompletion method, including timeout duration, polling interval, and polling mode.
- **JobStatus**: Represents the possible job states (PENDING, COMPLETED, or ERROR).
- **PollingMode**: Specifies the polling strategy (LONG or SHORT).

### Why These Are Exposed
1. **JobClient**: Exposed as the main entry point for interacting with the client library. It encapsulates all core functionality: job creation, single-status retrieval, and polling.
2. **createJob**: Primarily for demonstrating functionality. Useful for testing how jobs progress through their lifecycle.
3. **getStatus**: Exposed for clients who need to fetch a single status update about a job. This avoids unnecessary polling for use cases where a one-time check suffices.
4. **awaitCompletion**: The primary method for tracking job completion. Designed to manage the polling lifecycle efficiently, ensuring that the client handles COMPLETED and ERROR states cleanly while supporting configurable options.
5. **Constants and Types**: Exposed to provide clarity, type safety, and maintainability for users interacting with the library.
6. **Errors**: Exposed to allow for granular and predictable error handling, enabling clients to respond appropriately to various failure scenarios.

By exposing only the essential methods and constants, this API ensures that users can interact with the client library effectively without unnecessary complexity. The flexibility provided by polling modes and configuration options allows users to adapt the client’s behavior to meet their specific requirements.

## Future Considerations

While the current implementation fulfills the requirements of status monitoring and job management, several enhancements can improve the robustness, scalability, and user experience of the project. These future considerations aim to address growing demands and optimize both the client and server components.

1. **Opt-In Logging / Accepting a Logger Object**
    - **Purpose**: Allow clients to provide their own logger implementation or opt-in to internal logging.
    - **Benefits**:
        - Improves observability for client users without enforcing a logging library.
        - Users can integrate the client library seamlessly into their existing logging frameworks.

2. **Dynamic Timeout Estimation**
    - **Enhancement**: The job creation endpoint could return an estimated processing time for a job.
    - **How It Works**:
        - The server computes an approximate time for job completion based on input parameters or load.
        - This estimate is sent back in the job creation response.
    - **Benefits**:
        - Clients can dynamically set their timeoutMs for awaitCompletion, ensuring polling durations are realistic.
        - Avoids excessive waiting or premature timeouts.

3. **Redis / Message Broker for Task Management**
    - **Enhancement**: Integrate a Redis store or message broker (e.g., RabbitMQ, Kafka) to handle job state and task management more efficiently.
    - **Purpose**:
        - Manage tasks in a distributed, scalable, and fault-tolerant manner.
        - Persist job states across multiple server instances.
    - **Benefits**:
        - Improves reliability and scalability when handling a large number of concurrent jobs.
        - Decouples the job management logic from the API layer, enabling better separation of concerns.

4. **Server Eviction Policy for Long-Polling**
    - **Enhancement**: Implement an eviction policy to manage the active connection pool when handling long-polling at scale.
    - **How It Works**:
        - Set limits on the number of active long-polling connections.
        - Evict older or idle connections based on configurable criteria (e.g., LRU - Least Recently Used).
        - Return appropriate responses or retry suggestions to evicted clients.
    - **Benefits**:
        - Prevents server resource exhaustion when managing large numbers of concurrent long-polling requests.
        - Ensures fair distribution of server resources and maintains performance under heavy load.