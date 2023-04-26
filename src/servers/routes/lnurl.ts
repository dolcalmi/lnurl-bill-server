import express, { Request, Response } from "express"

import { Bill } from "@app"
import { BillAlreadyPaidError } from "@domain/bill/errors"
import { createBillMetadata } from "@domain/bill"
import { decodeInvoiceAmount } from "@utils"
import originalUrl from "original-url"
import { InvalidInvoiceAmountError } from "@domain/shared"

const router = express.Router()

router.get("/lnurlp/:reference", async (req: Request, res: Response) => {
  const reference = req.params["reference"] as BillRef
  const domain: Domain | undefined = req.hostname as Domain
  if (!domain || !reference) {
    res.status(400).json({ error: "Hostname or reference not found in the request" })
    return
  }

  const billPayment = await Bill.createPayment({ domain, reference })
  if (billPayment instanceof BillAlreadyPaidError) {
    res.status(502).json({ error: "Invoice already paid" })
    return
  }
  if (billPayment instanceof Error) {
    res
      .status(500)
      .json({ error: "An internal server error occurred", details: billPayment })
    return
  }

  const { amount } = req.query
  const minSendable = decodeInvoiceAmount(billPayment.invoice)
  if (billPayment instanceof InvalidInvoiceAmountError) {
    res.status(404).json({ error: "Invalid invoice amount" })
    return
  }

  if (amount) {
    if (Number(amount) !== minSendable) {
      res.status(404).json({ error: "Invalid invoice amount" })
      return
    }
    res.status(200).json({
      pr: billPayment.invoice,
      routes: [],
    })
    return
  }

  const metadata = createBillMetadata(domain, billPayment.pendingResponse)
  const url = originalUrl(req)

  res.status(200).json({
    callback: url.full,
    minSendable,
    maxSendable: minSendable,
    metadata: metadata,
    tag: "payRequest",
  })
})

export default router
