export const tracingConfig = {
  serviceName: process.env.TRACING_SERVICE_NAME || "bill-server-dev",
  url: process.env.TRACING_URL || "localhost",
}
