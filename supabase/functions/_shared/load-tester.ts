/**
 * Simple Load Tester for Edge Functions.
 * Measures latency, throughput, and error rates.
 */
export async function runLoadTest(url: string, options: { 
  concurrency: number, 
  durationMs: number,
  method?: string,
  headers?: Record<string, string>,
  body?: any
}) {
  const { concurrency, durationMs, method = "POST", headers = {}, body } = options;
  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies: number[] = [];

  console.log(`🚀 Starting load test on ${url}`);
  console.log(`Concurrency: ${concurrency}, Duration: ${durationMs}ms`);

  const worker = async () => {
    while (Date.now() - startTime < durationMs) {
      const reqStart = Date.now();
      try {
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined
        });

        const latency = Date.now() - reqStart;
        latencies.push(latency);
        totalRequests++;

        if (response.ok) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (err) {
        totalRequests++;
        failedRequests++;
        console.error(`Request failed: ${err.message}`);
      }
    }
  };

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const rps = (totalRequests / totalTime) * 1000;

  console.log(`\n--- Load Test Results ---`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Requests Per Second: ${rps.toFixed(2)}`);
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgLatency,
    rps
  };
}
