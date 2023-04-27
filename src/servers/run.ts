import http from "http"

import { baseLogger } from "@services/logger"

import billServer from "./bill-server"
import { startJobs, stopJobs } from "./jobs"

// Normalize a port into a number, string, or false
function normalizePort(val: string | number): number | string | boolean {
  const port = parseInt(val.toString(), 10)

  if (isNaN(port)) {
    // Named pipe
    return val
  }

  if (port >= 0) {
    // Port number
    return port
  }

  return false
}

// Event listener for HTTP server "error" event
function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== "listen") {
    throw error
  }

  stopJobs()

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges")
      process.exit(1)
      break
    case "EADDRINUSE":
      console.error(bind + " is already in use")
      process.exit(1)
      break
    default:
      throw error
  }
}

// Event listener for HTTP server "listening" event
function onListening(): void {
  startJobs()

  const addr = server.address()
  const bind =
    typeof addr === "string" ? "pipe " + addr : `http://localhost:${addr?.port}`
  baseLogger.info(`🚀 Server ready at ${bind}`)
}

// Get port from environment and store in Express
const port = normalizePort(process.env.PORT || "3000")
billServer.set("port", port)

// Create HTTP server
const server = http.createServer(billServer)

// Listen on provided port, on all network interfaces
server.listen(port)
server.on("error", onError)
server.on("listening", onListening)
