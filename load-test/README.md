# Load Testing with k6

This directory contains k6 load testing scripts for the Polltato project.

## 1. Setup k6

To install k6 on your Mac, use [Homebrew](https://brew.sh/):

```bash
brew install k6
```

For other operating systems, refer to the [official k6 installation guide](https://k6.io/docs/getting-started/installation/).

## 2. Running the Load Test

You can run the load test using the following command:

```bash
k6 run script.js
```

### Overriding Configuration

You can override the default API and Frontend URLs using environment variables:

```bash
k6 run -e BASE_URL=http://your-production-api.com -e FRONTEND_URL=http://your-frontend.com script.js
```

### Setting the Room ID

To test a specific poll room, pass the `ROOM_ID` environment variable:

```bash
k6 run -e ROOM_ID=your-room-uuid script.js
```

## 3. Test Scenarios

The `script.js` performs the following steps in each iteration:
1. **Landing Page**: Fetches the frontend root (`/`).
2. **Get Poll**: Fetches poll details from the backend (`/polls/{room_id}`).
3. **Vote**: Submits a vote to a poll (`/polls/{room_id}/votes`).

## 4. Understanding Results

- **http_req_duration**: How long the requests took. The script has a threshold of `p(95)<500ms`.
- **http_req_failed**: The percentage of failed requests.
- **vus**: The number of virtual users running concurrently.
- **iterations**: Total number of times the test script was executed.
