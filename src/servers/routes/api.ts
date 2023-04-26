import express, { Request, Response } from "express"

import { Bill } from "@app"

import { BillIssuerTomlNotFoundError } from "@domain/bill/errors"

const router = express.Router()

router.get("/verify", async (req: Request, res: Response) => {
  const domain: Domain | undefined = req.hostname as Domain
  if (!domain) {
    res.status(400).json({ error: "Hostname not found in the request" })
    return
  }

  const settings = await Bill.resolveSettings({ domain })
  if (settings instanceof BillIssuerTomlNotFoundError) {
    res.status(502).json({ error: "Toml not found" })
    return
  }
  if (settings instanceof Error) {
    res
      .status(500)
      .json({ error: "An internal server error occurred", details: settings })
    return
  }

  res.status(200).json({ settings })
})

export default router
