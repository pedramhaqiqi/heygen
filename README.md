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
Once you have installed the dependencies for the client and server,you are good to run the integrations scripts. You are perfectly fine if you would like to run them individually, I have provided a script at the root of the project that spins up the server and runs all the tests in order.

    In the root of the repository, while making sure the server is down. The script run the 
    server as a daemon and proceed to navigate to the client library and run the integration tests.
    ```sh
    ./run-integration-tests.sh
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
    Polling allows seamless integration with any HTTP-based backend. It uses standard HTTP connections, which are broadly supported

3. **Scalability and Server Efficiency**  
    Maintaining bi-directional WebSocket connections at scale can impose significant server overhead. Persistent connections require dedicated resources, which can lead to bottlenecks under high loads. Polling mitigates this by leveraging stateless HTTP requests, allowing servers to efficiently handle a large number of concurrent clients as it controls how to it handles these connections without an obligation to presist it.

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
- **Retry Policy**: To improve resiliency, the library includes a retry mechanism for transient failures (e.g., network issues or intermittent errors), ensuring reliable job monitoring even in less stable environments.

#### Server-Side Considerations

To efficiently support long polling while minimizing overhead, I incorporated the following optimizations into the server:
1. **Connection Timeouts**  
    Long polling connections are capped with a configurable timeout. This prevents excessive resource usage and ensures server responsiveness under high load. If a job remains pending beyond the timeout, the server returns a “pending” status, and the client retries after a delay.

2. **Rate Limiting for Short Polling**  
    For short polling, I implemented rate limiting to throttle incoming requests. This prevents clients from overwhelming the server with frequent status checks.

3. **Scalability Awareness**  
    By leveraging stateless HTTP connections and enforcing connection thresholds, the server efficiently handles a large number of concurrent polling requests without being overwhelmed.