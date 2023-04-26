import express, { Express } from "express"

import apiRouter from "./routes/api"
import lnurlRouter from "./routes/lnurl"

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use("/api", apiRouter)
app.use("/.well-known", lnurlRouter)

export default app
