export const tracingConfig = {
  serviceName: process.env.TRACING_SERVICE_NAME || "bill-server-dev",
  url: process.env.TRACING_URL || "localhost",
}

export const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "", 10) || 5432,
  user: process.env.DB_USER || "lnurl-bill-server-usr",
  password: process.env.DB_PWD || "lnurl-bill-server-pwd",
  database: process.env.DB_DB || "lnurl-bill-server",
  poolMin: parseInt(process.env.DB_POOL_MIN || "", 10) || 1,
  poolMax: parseInt(process.env.DB_POOL_MAX || "", 10) || 5,
  debug: process.env.DB_DEBUG === "true",
}
