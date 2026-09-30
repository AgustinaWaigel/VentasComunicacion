const { performance } = require("node:perf_hooks");
(async () => {
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    const res = await fetch(
      `${process.env.TEST_API_URL || "http://localhost:5000"}/api/productos`,
    );
    const headers = performance.now();
    const text = await res.text();
    const received = performance.now();
    const products = JSON.parse(text);
    console.log(
      JSON.stringify({
        sample: i + 1,
        status: res.status,
        ttfbMs: +(headers - start).toFixed(2),
        totalMs: +(performance.now() - start).toFixed(2),
        parseMs: +(performance.now() - received).toFixed(3),
        serverTiming: res.headers.get("server-timing"),
        bytes: Buffer.byteLength(text),
        count: products.length,
      }),
    );
  }
})();
