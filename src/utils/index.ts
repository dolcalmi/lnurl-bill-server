import crypto from "crypto"

import { InvalidInvoiceAmountError } from "@domain/shared"
import { parsePaymentRequest } from "invoices"

export const createLnurlMetadata = ({
  description,
  identifier,
}: {
  description: string
  identifier: string
}): string => {
  return JSON.stringify([
    ["text/plain", `${description}`],
    ["text/identifier", `${identifier}`],
  ])
}

export const createHash = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex")
}

export const decodeInvoiceAmount = (
  bolt11EncodedInvoice: string,
): number | InvalidInvoiceAmountError => {
  try {
    const { mtokens, safe_tokens } = parsePaymentRequest({
      request: bolt11EncodedInvoice,
    })
    return Number(mtokens || `${safe_tokens}000`)
  } catch (err) {
    return new InvalidInvoiceAmountError(err.message)
  }
}
