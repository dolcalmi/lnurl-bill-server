import { InvalidLnInvoiceStatusError } from "./errors"

export * from "./errors"

export const WalletCurrency = {
  BtcSats: "BTC",
  UsdCents: "USD",
} as const

export const LnInvoiceStatus = {
  Expired: "EXPIRED",
  Pending: "PENDING",
  Paid: "PAID",
} as const

export const toLnInvoiceStatus = (
  status: string,
): LnInvoiceStatus | InvalidLnInvoiceStatusError => {
  for (const value of Object.values(LnInvoiceStatus)) {
    if (value === status.toUpperCase()) {
      return value
    }
  }

  return new InvalidLnInvoiceStatusError(status)
}
