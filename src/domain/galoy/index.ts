import { InvalidStatusError } from "./errors"

export const GaloyWalletCurrency = {
  Usd: "USD",
  Btc: "BTC",
} as const

export const GaloyInvoiceStatus = {
  Expired: "EXPIRED",
  Pending: "PENDING",
  Paid: "PAID",
} as const

export const toGaloyInvoiceStatus = (
  status: string,
): GaloyInvoiceStatus | InvalidStatusError => {
  for (const value of Object.values(GaloyInvoiceStatus)) {
    if (value === status.toUpperCase()) {
      return value
    }
  }

  return new InvalidStatusError(status)
}
