import express, { Request, Response } from "express"

import { Bill } from "@app"

import { BillIssuerTomlNotFoundError } from "@domain/bill/errors"
import { BillPaymentNotFoundRepositoryError } from "@domain/bill-payment/errors"

const router = express.Router()

router.get("/payments", async (req: Request, res: Response) => {
  const period = req.query["period"] as BillPeriod
  const reference = req.query["reference"] as BillRef
  const domain: Domain | undefined = req.hostname as Domain
  if (!domain || !reference) {
    res.status(400).json({ error: "Hostname or reference not found in the request" })
    return
  }

  const billPayment = await Bill.getPayment({ domain, period, reference })
  if (billPayment instanceof BillPaymentNotFoundRepositoryError) {
    res.status(404).json({ error: "Bill payment not found" })
    return
  }
  if (billPayment instanceof Error) {
    res
      .status(500)
      .json({ error: "An internal server error occurred", details: billPayment })
    return
  }
  const { invoice, invoiceStatus, notificationSentDate } = billPayment
  res.status(200).json({
    payment: { reference, period, invoice, invoiceStatus, notificationSentDate },
  })
})

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
